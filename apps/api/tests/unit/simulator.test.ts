import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TelemetrySimulator } from '../../src/services/telemetry/simulator.js';
import { telemetryService } from '../../src/modules/telemetry/telemetry.service.js';
import { sensorsRepository } from '../../src/modules/sensors/sensors.repository.js';
import { stationsRepository } from '../../src/modules/stations/stations.repository.js';

describe('TelemetrySimulator', () => {
  let simulator: TelemetrySimulator;

  const mockStation = {
    id: 'station-maitri-1',
    stationId: 'MAITRI',
    name: 'Maitri Research Station',
    status: 'OPERATIONAL' as const,
    latitude: -70.767,
    longitude: 11.733,
    altitude: 130,
    timezone: 'UTC+5:30',
    description: 'Indian Antarctic Research Station in Schirmacher Oasis',
    imageUrl: null,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSensors = [
    {
      id: 'sensor-coolant-1',
      stationId: 'station-maitri-1',
      assetId: 'asset-1',
      name: 'Genset Coolant Temp',
      type: 'TEMPERATURE' as const,
      unit: '°C',
      status: 'NORMAL' as const,
      warningThreshold: 85,
      criticalThreshold: 95,
      minThreshold: 0,
      maxThreshold: null,
      lastReading: 75,
      lastReadingAt: new Date(),
      isActive: true,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'sensor-wind-1',
      stationId: 'station-maitri-1',
      assetId: 'asset-met-1',
      name: 'Anemometer Wind Speed',
      type: 'WIND_SPEED' as const,
      unit: 'km/h',
      status: 'NORMAL' as const,
      warningThreshold: 90,
      criticalThreshold: 120,
      minThreshold: 0,
      maxThreshold: null,
      lastReading: 30,
      lastReadingAt: new Date(),
      isActive: true,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    simulator = new TelemetrySimulator();
    vi.spyOn(stationsRepository, 'findById').mockResolvedValue(mockStation);
    vi.spyOn(sensorsRepository, 'findAll').mockResolvedValue({
      data: mockSensors,
      total: 2,
    });
  });

  afterEach(() => {
    simulator.stop();
  });

  it('should initialize and report stopped status by default', () => {
    const status = simulator.getStatus();
    expect(status.isRunning).toBe(false);
    expect(status.scenario).toBe('NORMAL');
  });

  it('should switch scenario dynamically', () => {
    simulator.setScenario('SPIKE');
    expect(simulator.getStatus().scenario).toBe('SPIKE');
    simulator.setScenario('GRADUAL_DRIFT');
    expect(simulator.getStatus().scenario).toBe('GRADUAL_DRIFT');
  });

  it('should generate readings and send to telemetryService on simulation start', async () => {
    const ingestSpy = vi.spyOn(telemetryService, 'ingestReading').mockResolvedValue({
      reading: {} as any,
      isDuplicate: false,
    });

    await simulator.start({
      stationCode: 'MAITRI',
      scenario: 'NORMAL',
      intervalMs: 10000,
    });

    expect(simulator.getStatus().isRunning).toBe(true);
    expect(simulator.getStatus().ticks).toBeGreaterThanOrEqual(1);
    expect(ingestSpy).toHaveBeenCalledTimes(2); // coolant + wind
  });

  it('should inject severe readings in SPIKE scenario', async () => {
    const ingestSpy = vi.spyOn(telemetryService, 'ingestReading').mockResolvedValue({
      reading: {} as any,
      isDuplicate: false,
    });

    await simulator.start({
      stationCode: 'MAITRI',
      scenario: 'SPIKE',
      intervalMs: 10000,
    });

    // Check that high wind speed (> 100 km/h) and high coolant temp were generated
    expect(ingestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        sensorId: 'sensor-wind-1',
        value: 125.0,
      })
    );
    expect(ingestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        sensorId: 'sensor-coolant-1',
        value: 99.2,
      })
    );
  });

  it('should report quality: 0 in DROPOUT scenario', async () => {
    const ingestSpy = vi.spyOn(telemetryService, 'ingestReading').mockResolvedValue({
      reading: {} as any,
      isDuplicate: false,
    });

    await simulator.start({
      stationCode: 'MAITRI',
      scenario: 'DROPOUT',
      intervalMs: 10000,
    });

    expect(ingestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        sensorId: 'sensor-coolant-1',
        quality: 0,
        value: 0,
      })
    );
  });
});
