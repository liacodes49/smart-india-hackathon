// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Telemetry Simulator Engine
// ═══════════════════════════════════════════════════════════════
// Generates realistic, physically-correlated Antarctic station
// telemetry across NORMAL, GRADUAL_DRIFT, SPIKE, DROPOUT, and
// DEGRADATION scenarios. Directly exercises the ingestion pipeline.
// ═══════════════════════════════════════════════════════════════

import { telemetryService } from '../../modules/telemetry/telemetry.service.js';
import { sensorsRepository } from '../../modules/sensors/sensors.repository.js';
import { stationsRepository } from '../../modules/stations/stations.repository.js';
import { logger } from '../../config/logger.js';
import { SensorStatus } from '@repo/shared';

export type SimulationScenario =
  | 'NORMAL'
  | 'GRADUAL_DRIFT'
  | 'SPIKE'
  | 'DROPOUT'
  | 'DEGRADATION';

export interface SimulatorConfig {
  stationCode?: string;
  scenario: SimulationScenario;
  intervalMs: number;
}

export interface SimulatorStatus {
  isRunning: boolean;
  scenario: SimulationScenario;
  intervalMs: number;
  ticks: number;
  readingsGenerated: number;
  stationCode?: string;
  startedAt?: string;
}

export class TelemetrySimulator {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private currentScenario: SimulationScenario = 'NORMAL';
  private intervalMs = 3000; // Default 3s tick
  private ticks = 0;
  private readingsGenerated = 0;
  private targetStationCode = 'MAITRI';
  private startedAt?: string;

  // Correlated state
  private state = {
    loadKw: 65,
    coolantTempC: 80,
    fuelLevelPercent: 85,
    ambientTempC: -25,
    windSpeedKmh: 35,
    batterySocPercent: 92,
  };

  getStatus(): SimulatorStatus {
    return {
      isRunning: this.isRunning,
      scenario: this.currentScenario,
      intervalMs: this.intervalMs,
      ticks: this.ticks,
      readingsGenerated: this.readingsGenerated,
      stationCode: this.targetStationCode,
      startedAt: this.startedAt,
    };
  }

  async start(config?: Partial<SimulatorConfig>): Promise<SimulatorStatus> {
    if (this.isRunning) {
      this.stop();
    }

    if (config?.scenario) this.currentScenario = config.scenario;
    if (config?.intervalMs) this.intervalMs = config.intervalMs;
    if (config?.stationCode) this.targetStationCode = config.stationCode;

    this.isRunning = true;
    this.ticks = 0;
    this.startedAt = new Date().toISOString();

    logger.info(`[Simulator] Starting telemetry simulator in '${this.currentScenario}' scenario (interval: ${this.intervalMs}ms)`);

    this.timer = setInterval(async () => {
      try {
        await this.tick();
      } catch (err) {
        logger.error('[Simulator] Error in simulation tick:', err);
      }
    }, this.intervalMs);

    // Run first tick immediately
    await this.tick();

    return this.getStatus();
  }

  stop(): SimulatorStatus {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    logger.info(`[Simulator] Telemetry simulator stopped. Total readings: ${this.readingsGenerated}`);
    return this.getStatus();
  }

  setScenario(scenario: SimulationScenario): SimulatorStatus {
    this.currentScenario = scenario;
    logger.info(`[Simulator] Switched simulation scenario to '${scenario}'`);
    return this.getStatus();
  }

  /**
   * Generates correlated telemetry step based on the active scenario
   */
  private async tick(): Promise<void> {
    this.ticks++;
    const t = this.ticks;
    const now = new Date();

    // 1. Fetch sensors for target station
    const station = await stationsRepository.findById(this.targetStationCode);
    if (!station) {
      logger.warn(`[Simulator] Station '${this.targetStationCode}' not found`);
      return;
    }

    const sensorsList = await sensorsRepository.findAll({ stationId: station.id, limit: 100 });
    if (sensorsList.data.length === 0) {
      logger.warn(`[Simulator] No sensors found for station '${this.targetStationCode}'`);
      return;
    }

    // 2. Correlated physical model progression
    switch (this.currentScenario) {
      case 'NORMAL': {
        // Normal sinusoidal diurnal variation
        this.state.loadKw = 60 + Math.sin(t / 5) * 8 + (Math.random() - 0.5) * 2;
        this.state.coolantTempC = 78 + (this.state.loadKw / 100) * 10 + (Math.random() - 0.5);
        this.state.fuelLevelPercent = Math.max(10, this.state.fuelLevelPercent - 0.05);
        this.state.ambientTempC = -25 + Math.sin(t / 8) * 4;
        this.state.windSpeedKmh = 25 + Math.sin(t / 6) * 15 + Math.random() * 5;
        this.state.batterySocPercent = 90 + Math.sin(t / 10) * 5;
        break;
      }
      case 'SPIKE': {
        // Sudden severe spike exceeding critical thresholds
        this.state.loadKw = 98.5; // High generator overload
        this.state.coolantTempC = 99.2; // Exceeds warning (92) and critical (98) thresholds!
        this.state.fuelLevelPercent = Math.max(5, this.state.fuelLevelPercent - 0.2);
        this.state.windSpeedKmh = 125.0; // Katabatic storm gale
        break;
      }
      case 'GRADUAL_DRIFT': {
        // Progressive mechanical drift
        this.state.coolantTempC = 80 + t * 1.5; // Steadily climbs toward threshold breach
        this.state.loadKw = 65 + t * 0.8;
        break;
      }
      case 'DROPOUT': {
        // Sensor signal loss (reading 0 or nullified)
        this.state.coolantTempC = 0;
        this.state.loadKw = 0;
        this.state.windSpeedKmh = 0;
        break;
      }
      case 'DEGRADATION': {
        // High vibration & thermal fluctuation
        this.state.loadKw = 75 + (Math.random() - 0.5) * 25;
        this.state.coolantTempC = 88 + Math.random() * 8; // Borderline warning
        break;
      }
    }

    // 3. Dispatch readings through real telemetry ingestion service
    for (const sensor of sensorsList.data) {
      let value: number;
      let status: SensorStatus = SensorStatus.NORMAL;

      switch (sensor.type) {
        case 'TEMPERATURE':
          value = sensor.name.toLowerCase().includes('coolant')
            ? Number(this.state.coolantTempC.toFixed(1))
            : Number(this.state.ambientTempC.toFixed(1));
          break;
        case 'POWER':
          value = Number(this.state.loadKw.toFixed(1));
          break;
        case 'FUEL':
          value = Number(this.state.fuelLevelPercent.toFixed(1));
          break;
        case 'WIND_SPEED':
          value = Number(this.state.windSpeedKmh.toFixed(1));
          break;
        case 'BATTERY':
          value = Number(this.state.batterySocPercent.toFixed(1));
          break;
        default:
          value = +(50 + Math.sin(t) * 5).toFixed(1);
          break;
      }

      if (this.currentScenario === 'SPIKE' && sensor.type === 'TEMPERATURE' && sensor.name.toLowerCase().includes('coolant')) {
        status = SensorStatus.CRITICAL;
      }

      try {
        await telemetryService.ingestReading({
          sensorId: sensor.id,
          stationId: station.id,
          timestamp: now.toISOString(),
          value,
          unit: sensor.unit,
          status,
          quality: this.currentScenario === 'DROPOUT' ? 0 : 100,
        });

        this.readingsGenerated++;
      } catch (err) {
        // Ignore duplicate reading edge case during fast ticks
        logger.debug(`[Simulator] Ingest skipped for sensor ${sensor.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }
}

export const telemetrySimulator = new TelemetrySimulator();
