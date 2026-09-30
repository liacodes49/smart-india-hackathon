// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Simulation Service
// ═══════════════════════════════════════════════════════════════
// Orchestration layer for What-If scenario execution.
// Strictly enforces:
// 1. LIVE PRODUCTION STATE != SCENARIO STATE.
// 2. Reuses existing domain services for baseline snapshotting.
// 3. Emits standard domain events on the existing eventBus.
// ═══════════════════════════════════════════════════════════════

import {
  EventType,
  createDomainEvent,
  SimulationStatus,
  type SimulationResult,
} from '@repo/shared';
import type { CreateSimulationInput, SimulationQueryInput } from '@repo/schemas';
import { eventBus } from '../../lib/event-bus.js';
import { logger } from '../../config/logger.js';
import { stationsRepository } from '../stations/stations.repository.js';
import { db } from '../../config/database.js';
import { users } from '../../db/schema/index.js';
import { energyService } from '../energy/energy.service.js';
import { fuelForecastingService } from '../predictions/fuel.service.js';
import { weatherService } from '../weather/weather.service.js';
import { riskService } from '../risk/risk.service.js';
import { alertsService } from '../alerts/alerts.service.js';
import {
  simulationRepository,
  type SimulationSelect,
} from './simulation.repository.js';
import {
  simulationEngine,
  type BaselineStationState,
} from './simulation.engine.js';

export class SimulationService {
  /**
   * Create a new simulation scenario in DRAFT status
   */
  async createSimulation(
    input: CreateSimulationInput,
    userId: string | null
  ): Promise<SimulationSelect> {
    const station = await stationsRepository.findById(input.stationId);
    if (!station) {
      throw new Error(`Station not found: ${input.stationId}`);
    }

    // Resolve userId: use provided auth user, or fall back to first system user
    let resolvedUserId = userId;
    if (!resolvedUserId) {
      const [systemUser] = await db.select({ id: users.id }).from(users).limit(1);
      if (!systemUser) throw new Error('No users in database. Run: pnpm db:seed');
      resolvedUserId = systemUser.id;
    }

    const sim = await simulationRepository.create({
      stationId: station.id, // always use the UUID FK, not the station code
      name: input.name,
      type: input.type as any,
      description: input.description,
      status: SimulationStatus.DRAFT as any,
      parameters: input.parameters,
      createdBy: resolvedUserId,
    });

    eventBus.publish(
      createDomainEvent({
        eventType: EventType.SIMULATION_REQUESTED,
        source: 'simulation-service',
        entityId: sim.id,
        stationId: sim.stationId,
        payload: { simulationId: sim.id, name: sim.name, type: sim.type },
      })
    );

    return sim;
  }

  /**
   * Run a simulation by ID using an immutable live baseline snapshot
   */
  async runSimulation(id: string): Promise<SimulationSelect> {
    const sim = await simulationRepository.findById(id);
    if (!sim) {
      throw new Error(`Simulation '${id}' not found`);
    }

    // Mark as RUNNING
    await simulationRepository.update(id, {
      status: SimulationStatus.RUNNING as any,
      startedAt: new Date(),
    });

    eventBus.publish(
      createDomainEvent({
        eventType: EventType.SIMULATION_STARTED,
        source: 'simulation-service',
        entityId: sim.id,
        stationId: sim.stationId,
        payload: { simulationId: sim.id },
      })
    );

    try {
      // Build read-only baseline snapshot from live domain services
      const baseline = await this.buildBaselineSnapshot(sim.stationId);

      // Execute scenario in isolated memory sandbox
      const results = simulationEngine.executeScenario(
        sim.type,
        sim.parameters as Record<string, unknown>,
        baseline
      );

      // Save results
      const updated = await simulationRepository.update(id, {
        status: SimulationStatus.COMPLETED as any,
        results: results as any,
        completedAt: new Date(),
      });

      eventBus.publish(
        createDomainEvent({
          eventType: EventType.SIMULATION_COMPLETED,
          source: 'simulation-service',
          entityId: sim.id,
          stationId: sim.stationId,
          payload: {
            simulationId: sim.id,
            impactScore: results.impactScore,
            summary: results.summary,
          },
        })
      );

      // If scenario reveals severe vulnerability / impact, raise a simulation advisory alert
      if (results.impactScore >= 60) {
        try {
          await alertsService.createAlert({
            stationId: sim.stationId,
            title: `[SIMULATION ADVISORY] High Impact: ${sim.name}`,
            message: `What-If scenario projection (${sim.type}): ${results.summary}. Impact Score: ${results.impactScore}/100.`,
            severity: results.impactScore >= 80 ? 'CRITICAL' : 'WARNING',
            category: (sim.type === 'EQUIPMENT_FAILURE' ? 'EQUIPMENT' : sim.type === 'WEATHER_EXTREME' ? 'ENVIRONMENTAL' : 'POWER') as any,
          });
        } catch (alertErr) {
          logger.warn(`Could not emit simulation advisory alert:`, alertErr);
        }
      }

      return updated!;
    } catch (error: any) {
      logger.error(`Simulation '${id}' execution failed:`, error);

      await simulationRepository.update(id, {
        status: SimulationStatus.FAILED as any,
        results: { error: error.message } as any,
        completedAt: new Date(),
      });

      eventBus.publish(
        createDomainEvent({
          eventType: EventType.SIMULATION_FAILED,
          source: 'simulation-service',
          entityId: sim.id,
          stationId: sim.stationId,
          payload: { simulationId: sim.id, error: error.message },
        })
      );

      throw error;
    }
  }

  /**
   * Ephemeral quick-run without database persistence
   */
  async quickRunSimulation(
    stationId: string,
    type: string,
    parameters: Record<string, unknown>
  ): Promise<SimulationResult> {
    const baseline = await this.buildBaselineSnapshot(stationId);
    return simulationEngine.executeScenario(type, parameters, baseline);
  }

  /**
   * Retrieve a simulation by ID
   */
  async getSimulationById(id: string): Promise<SimulationSelect | null> {
    return simulationRepository.findById(id);
  }

  /**
   * List simulations with filtering & pagination
   */
  async listSimulations(filter?: SimulationQueryInput) {
    // Resolve station code (e.g. "MAITRI") to UUID if provided
    if (filter?.stationId) {
      const station = await stationsRepository.findById(filter.stationId);
      if (station) {
        filter = { ...filter, stationId: station.id };
      }
    }
    return simulationRepository.findAll(filter);
  }

  // ── Baseline Snapshot Builder (Read-Only) ──────────────────────

  private async buildBaselineSnapshot(stationId: string): Promise<BaselineStationState> {
    const station = await stationsRepository.findById(stationId);
    if (!station) {
      throw new Error(`Station not found: ${stationId}`);
    }

    // 1. Energy baseline
    let powerDemandKw = 135.0;
    let activeGenerators = 2;
    let batterySocPercent = 95.0;
    let ratedGenerationCapacityKw = 125.0;

    try {
      const energy = await energyService.getStationEnergySummary(stationId);
      powerDemandKw = energy.totalGenerationKw > 0 ? energy.totalGenerationKw : 135.0;
      activeGenerators = energy.activeGenerators > 0 ? energy.activeGenerators : 2;
      batterySocPercent = (energy as any).batteryStatus?.socPercent ?? 95.0;
      ratedGenerationCapacityKw = Math.max(100, activeGenerators * 62.5);
    } catch (err) {
      logger.warn(`Could not pull live energy for station ${stationId}, using default baseline:`, err);
    }

    // 2. Fuel forecast baseline
    let currentFuelStockLiters = 45000;
    let fuelBurnRateLph = 28.0;
    let fuelAutonomyDays = 66.9;
    let daysToReserveThreshold = 51.9;

    try {
      const fuel = await fuelForecastingService.forecastFuelDepletion(stationId);
      currentFuelStockLiters = fuel.currentStockLiters;
      fuelBurnRateLph = fuel.dailyBurnRateLiters / 24.0;
      fuelAutonomyDays = fuel.estimatedDaysRemaining;
      daysToReserveThreshold = fuel.daysToMinimumThreshold;
    } catch (err) {
      logger.warn(`Could not pull fuel forecast for station ${stationId}:`, err);
    }

    // 3. Weather baseline
    let ambientTemperatureC = -25.0;
    try {
      const weather = await weatherService.getCurrentWeather(stationId);
      ambientTemperatureC = weather.temperature;
    } catch (err) {
      logger.warn(`Could not pull weather for station ${stationId}:`, err);
    }

    // 4. Risk baseline
    let compositeRiskScore = 32;
    let riskLevel = 'LOW' as any;
    try {
      const risk = await riskService.assessStationRisk(stationId);
      compositeRiskScore = risk.compositeScore;
      riskLevel = risk.riskLevel;
    } catch (err) {
      logger.warn(`Could not pull risk score for station ${stationId}:`, err);
    }

    return {
      stationId: station.id,
      name: station.name,
      powerDemandKw,
      ratedGenerationCapacityKw,
      activeGenerators,
      batterySocPercent,
      currentFuelStockLiters,
      fuelBurnRateLph,
      fuelAutonomyDays,
      daysToReserveThreshold,
      ambientTemperatureC,
      internalTemperatureC: 21.0, // Regulated indoor room temperature standard
      compositeRiskScore,
      riskLevel,
      criticalAssetsHealth: 85,
    };
  }
}

export const simulationService = new SimulationService();
