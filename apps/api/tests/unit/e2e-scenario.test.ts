// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — End-to-End Polar Crisis Scenario Test
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimulationType, RiskLevel, IncidentSeverity, IncidentStatus, SpatialHealthColor } from '@repo/shared';
import { simulationEngine, type BaselineStationState } from '../../src/modules/simulation/simulation.engine.js';
import { simulationService } from '../../src/modules/simulation/simulation.service.js';
import { incidentsService } from '../../src/modules/incidents/incidents.service.js';
import { incidentsRepository } from '../../src/modules/incidents/incidents.repository.js';
import { alertsRepository } from '../../src/modules/alerts/alerts.repository.js';
import { digitalTwinService } from '../../src/modules/digital-twin/digital-twin.service.js';
import { stationsRepository } from '../../src/modules/stations/stations.repository.js';
import { assetsRepository } from '../../src/modules/assets/assets.repository.js';
import { sensorsRepository } from '../../src/modules/sensors/sensors.repository.js';
import { weatherService } from '../../src/modules/weather/weather.service.js';
import { riskService } from '../../src/modules/risk/risk.service.js';
import { assistantService } from '../../src/modules/assistant/assistant.service.js';

describe('End-to-End Polar Crisis Scenario: Maitri Station Generator Failure & Incident Response', () => {
  const stationId = '00000000-0000-0000-0000-000000000001';
  const alertId = 'alert-gen-02-critical';
  const userId = '00000000-0000-0000-0000-000000000099';

  const mockBaseline: BaselineStationState = {
    stationId,
    name: 'Maitri Station',
    powerDemandKw: 135.0,
    ratedGenerationCapacityKw: 125.0,
    activeGenerators: 2,
    batterySocPercent: 90.0,
    currentFuelStockLiters: 45000,
    fuelBurnRateLph: 28.0,
    fuelAutonomyDays: 66.9,
    daysToReserveThreshold: 51.9,
    ambientTemperatureC: -38.0,
    internalTemperatureC: 19.5,
    compositeRiskScore: 40,
    riskLevel: RiskLevel.MEDIUM,
    criticalAssetsHealth: 85,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Step 1: Simulation Engine executes What-If Generator Trip Contingency without mutating live state', async () => {
    // 1. Run what-if scenario
    const simResult = simulationEngine.executeScenario(
      SimulationType.POWER_FAILURE,
      { offlineGeneratorCount: 1, tier3LoadShedding: false },
      mockBaseline
    );

    // Verify mathematical projections
    expect(simResult.deltas.generationCapacityKw.delta).toBe(-62.5);
    expect(simResult.deltas.generationCapacityKw.projected).toBe(62.5);
    expect(simResult.deltas.powerDemandKw.projected).toBe(135.0);
    expect(simResult.deltas.compositeRiskScore.delta).toBeGreaterThan(30);
    expect(simResult.impactScore).toBeGreaterThanOrEqual(70);

    // Timeline checkpoints
    expect(simResult.timelineSteps).toHaveLength(6);
    expect(simResult.timelineSteps[0].offsetHours).toBe(0);
    expect(simResult.timelineSteps[1].offsetHours).toBe(1);
    expect(simResult.timelineSteps[2].offsetHours).toBe(6);

    // Verify mitigation options
    expect(simResult.mitigations.length).toBeGreaterThanOrEqual(2);
    expect(simResult.assumptions.length).toBeGreaterThan(0);
  });

  it('Step 2: Alert is raised and escalated to an Operational Incident with validated lifecycle', async () => {
    // Mock alert in repository
    const mockAlert = {
      id: alertId,
      stationId,
      assetId: 'asset-generator-02',
      severity: 'CRITICAL',
      status: 'TRIGGERED',
      type: 'POWER_DEFICIT',
      message: 'Generator #2 sudden bearing thermal trip. Generation dropped to 62.5 kW.',
      suggestedAction: 'Isolate Generator 2 breaker and switch auxiliary load to Battery Bank',
      metadata: { temperature: 104.2, vibrationMmS: 9.8 },
      triggeredAt: new Date(),
      createdAt: new Date(),
    };

    vi.spyOn(alertsRepository, 'findById').mockResolvedValue(mockAlert as any);
    vi.spyOn(alertsRepository, 'update').mockResolvedValue(mockAlert as any);

    let dbIncidents: any[] = [];
    vi.spyOn(incidentsRepository, 'findActiveByAlertId').mockImplementation(async (aId) => {
      return dbIncidents.find(i => i.sourceAlertId === aId && i.status !== IncidentStatus.CLOSED) ?? null;
    });

    vi.spyOn(incidentsRepository, 'create').mockImplementation(async (data: any) => {
      const inc = {
        id: 'inc-gen-02-uuid',
        ...data,
        status: IncidentStatus.OPEN,
        escalatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      dbIncidents.push(inc);
      return inc;
    });

    vi.spyOn(incidentsRepository, 'findById').mockImplementation(async (id) => {
      return dbIncidents.find(i => i.id === id) ?? null;
    });

    vi.spyOn(incidentsRepository, 'update').mockImplementation(async (id, updates) => {
      const inc = dbIncidents.find(i => i.id === id);
      if (inc) Object.assign(inc, updates);
      return inc;
    });

    // 2. Escalate Alert -> Incident
    const { incident, isNewlyCreated } = await incidentsService.escalateAlertToIncident(
      alertId,
      userId,
      {
        severity: IncidentSeverity.CRITICAL,
        remediationSteps: ['Isolate generator breaker and switch to battery'],
      }
    );

    expect(isNewlyCreated).toBe(true);
    expect(incident.status).toBe(IncidentStatus.OPEN);
    expect(incident.severity).toBe(IncidentSeverity.CRITICAL);
    expect(incident.sourceAlertId).toBe(alertId);

    // 3. Test Idempotency: Re-escalating same alert returns existing incident
    const reEscalate = await incidentsService.escalateAlertToIncident(alertId, userId);
    expect(reEscalate.isNewlyCreated).toBe(false);
    expect(reEscalate.incident.id).toBe(incident.id);

    // 4. Progress lifecycle: OPEN -> ASSIGNED
    const assigned = await incidentsService.assignIncident(incident.id, 'lead-engineer-sharma', userId);
    expect(assigned.status).toBe(IncidentStatus.ASSIGNED);
    expect(assigned.assignedTo).toBe('lead-engineer-sharma');

    // 5. Progress lifecycle: ASSIGNED -> IN_PROGRESS
    const inProgress = await incidentsService.updateIncident(
      incident.id,
      { status: IncidentStatus.IN_PROGRESS },
      userId
    );
    expect(inProgress.status).toBe(IncidentStatus.IN_PROGRESS);

    // 6. Progress lifecycle: IN_PROGRESS -> RESOLVED
    const resolved = await incidentsService.resolveIncident(
      incident.id,
      'Thermal overload due to high viscosity lube oil at -38°C ambient',
      'Auxiliary pre-heater activated and Generator #2 restarted on reserve circuit',
      userId
    );
    expect(resolved.status).toBe(IncidentStatus.RESOLVED);
    expect(resolved.rootCause).toContain('Thermal overload');

    // 7. Progress lifecycle: RESOLVED -> CLOSED
    const closed = await incidentsService.updateIncident(
      incident.id,
      { status: IncidentStatus.CLOSED },
      userId
    );
    expect(closed.status).toBe(IncidentStatus.CLOSED);
  });

  it('Step 3: Spatial Digital Twin projects 2D/3D health state with degraded nodes in RED', async () => {
    vi.spyOn(stationsRepository, 'findById').mockResolvedValue({
      id: stationId,
      stationId: 'MAITRI',
      name: 'Maitri Station',
      latitude: -70.767,
      longitude: 11.733,
      status: 'ACTIVE',
    } as any);

    vi.spyOn(stationsRepository, 'findHierarchy').mockResolvedValue({
      id: stationId,
      stationId: 'MAITRI',
      name: 'Maitri Station',
      latitude: -70.767,
      longitude: 11.733,
      buildings: [
        {
          id: 'b-power',
          stationId,
          name: 'Power Block',
          code: 'PWR',
          rooms: [
            { id: 'r-generator-room', buildingId: 'b-power', name: 'Generator Room', code: 'GEN' },
          ],
        },
      ],
    } as any);

    vi.spyOn(assetsRepository, 'findAll').mockResolvedValue({
      data: [
        {
          id: 'asset-generator-01',
          stationId,
          buildingId: 'b-power',
          roomId: 'r-generator-room',
          name: 'Diesel Generator #1',
          status: 'OPERATIONAL',
          criticality: 'CRITICAL',
          metadata: { position: { x: 5, y: 5, z: 0 } },
        },
        {
          id: 'asset-generator-02',
          stationId,
          buildingId: 'b-power',
          roomId: 'r-generator-room',
          name: 'Diesel Generator #2',
          status: 'CRITICAL', // Degraded!
          criticality: 'CRITICAL',
          metadata: { position: { x: 8, y: 5, z: 0 } },
        },
      ] as any,
      total: 2,
    });

    vi.spyOn(sensorsRepository, 'findAll').mockResolvedValue({ data: [], total: 0 });
    vi.spyOn(alertsRepository, 'findAll').mockResolvedValue({
      data: [
        { id: 'alert-1', assetId: 'asset-generator-02', severity: 'CRITICAL', status: 'ACTIVE' },
      ] as any,
      total: 1,
    });

    vi.spyOn(weatherService, 'getCurrentWeather').mockResolvedValue({
      temperature: -38,
      windSpeed: 45,
      windChill: -52,
      condition: 'BLIZZARD',
      recordedAt: new Date(),
    } as any);

    vi.spyOn(riskService, 'assessStationRisk').mockResolvedValue({
      compositeScore: 78,
      riskLevel: RiskLevel.CRITICAL,
      assessedAt: new Date().toISOString(),
      isEmergencyOverride: false,
      pillars: {
        energyRisk: { score: 85 },
        equipmentRisk: { score: 75 },
        weatherRisk: { score: 88 },
        supplyRisk: { score: 40 },
      },
      topDrivers: ['Generator #2 degraded'],
      recommendedActions: ['Shed non-critical heating'],
    } as any);

    // Get spatial state
    const spatialState = await digitalTwinService.getSpatialStationState(stationId);

    expect(spatialState.stationId).toBe(stationId);
    expect(spatialState.name).toBe('Maitri Station');
    expect(spatialState.stationHealthScore).toBe(22); // 100 - 78
    expect(spatialState.rootNodes.length).toBe(1);

    const powerBuilding = spatialState.rootNodes[0];
    expect(powerBuilding.id).toBe('b-power');
    const room = powerBuilding.children?.[0];
    expect(room?.id).toBe('r-generator-room');

    // Degraded generator must be RED
    const gen2Node = room?.children?.find(n => n.id === 'asset-generator-02');
    expect(gen2Node).toBeDefined();
    expect(gen2Node?.healthColor).toBe(SpatialHealthColor.RED);
    expect(gen2Node?.activeAlertCount).toBe(1);

    // Operational generator must be GREEN
    const gen1Node = room?.children?.find(n => n.id === 'asset-generator-01');
    expect(gen1Node?.healthColor).toBe(SpatialHealthColor.GREEN);
  });

  it('Step 4: Grounded AI Assistant synthesizes query using backend evidence without hallucinations', async () => {
    vi.spyOn(stationsRepository, 'findById').mockResolvedValue({
      id: stationId,
      name: 'Maitri Station',
    } as any);

    vi.spyOn(weatherService, 'getCurrentWeather').mockResolvedValue({
      temperature: -38,
      windSpeed: 52,
      windChill: -55,
      condition: 'BLIZZARD',
      stormSeverityIndex: 82,
      isBlizzardWarning: true,
      recordedAt: new Date(),
    } as any);

    vi.spyOn(riskService, 'assessStationRisk').mockResolvedValue({
      compositeScore: 78,
      riskLevel: RiskLevel.CRITICAL,
      assessedAt: new Date().toISOString(),
      isEmergencyOverride: false,
      pillars: {
        energyRisk: { score: 85 },
        equipmentRisk: { score: 75 },
        weatherRisk: { score: 88 },
        supplyRisk: { score: 40 },
      },
      topDrivers: ['Generator #2 Emergency Thermal Trip'],
      recommendedActions: ['Shed non-critical scientific heating loads'],
    } as any);

    vi.spyOn(incidentsService, 'listIncidents').mockResolvedValue({
      data: [
        {
          id: 'inc-gen-02',
          title: 'Generator #2 Emergency Thermal Trip',
          severity: IncidentSeverity.CRITICAL,
          status: IncidentStatus.IN_PROGRESS,
          remediationSteps: ['Restart auxiliary heater'],
        },
      ],
      total: 1,
    } as any);

    const response = await assistantService.processInquiry({
      stationId,
      message: 'What is the current storm severity and are there any active critical incidents?',
    });

    // Evidence validation
    expect(response.evidence.length).toBeGreaterThanOrEqual(2);
    const sources = response.evidence.map(e => e.source);
    expect(sources).toContain('weather');
    expect(sources).toContain('active_incidents');
    expect(response.groundingStatus).toBe('GROUNDED');

    // Answer grounding
    expect(response.answer).toContain('-38°C');
    expect(response.answer).toContain('Blizzard Warning Active');
    expect(response.answer).toContain('Generator #2 Emergency Thermal Trip');
    expect(response.suggestedActions.length).toBeGreaterThan(0);
  });

  it('Step 5: Strictly preserves the LIVE STATE != SCENARIO STATE Invariant across simulation run', async () => {
    // Spy on production mutation methods
    const createAlertSpy = vi.spyOn(alertsRepository, 'create');
    const createAssetSpy = vi.spyOn(assetsRepository, 'create');
    const createIncidentSpy = vi.spyOn(incidentsRepository, 'create');

    // Quick run what-if simulation via service
    vi.spyOn(stationsRepository, 'findById').mockResolvedValue({
      id: stationId,
      name: 'Maitri Station',
    } as any);

    vi.spyOn(riskService, 'assessStationRisk').mockResolvedValue({
      compositeScore: 40,
      riskLevel: RiskLevel.LOW,
      assessedAt: new Date().toISOString(),
      isEmergencyOverride: false,
      pillars: {
        energyRisk: { score: 30 },
        equipmentRisk: { score: 35 },
        weatherRisk: { score: 25 },
        supplyRisk: { score: 20 },
      },
      topDrivers: [],
      recommendedActions: [],
    } as any);

    const quickRunResult = await simulationService.quickRunSimulation(
      stationId,
      SimulationType.POWER_FAILURE,
      { offlineGeneratorCount: 1, tier3LoadShedding: false }
    );

    expect(quickRunResult).toBeDefined();
    expect(quickRunResult.deltas.generationCapacityKw.delta).toBe(-62.5);

    // CRITICAL: Verify ZERO calls to live DB mutation methods
    expect(createAlertSpy).not.toHaveBeenCalled();
    expect(createAssetSpy).not.toHaveBeenCalled();
    expect(createIncidentSpy).not.toHaveBeenCalled();
  });
});
