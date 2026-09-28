import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TelemetryService } from '../../src/modules/telemetry/telemetry.service.js';
import { telemetryRepository } from '../../src/modules/telemetry/telemetry.repository.js';
import { sensorsRepository } from '../../src/modules/sensors/sensors.repository.js';
import { alertsService } from '../../src/modules/alerts/alerts.service.js';
import { eventBus } from '../../src/lib/event-bus.js';
import { EventType, SensorStatus } from '@repo/shared';

describe('TelemetryService', () => {
  let service: TelemetryService;

  const mockSensor = {
    id: 'sensor-1',
    stationId: 'maitri',
    assetId: 'asset-genset-1',
    name: 'Genset Coolant Temp',
    type: 'TEMPERATURE' as const,
    unit: '°C',
    status: 'NORMAL' as const,
    warningThreshold: 85,
    criticalThreshold: 95,
    minThreshold: -10,
    maxThreshold: null,
    lastReading: 70,
    lastReadingAt: new Date('2026-03-15T12:00:00Z'),
    isActive: true,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TelemetryService();
  });

  describe('ingestReading', () => {
    it('should successfully ingest a valid telemetry reading and emit TELEMETRY_READING_RECORDED', async () => {
      const readingTimestamp = new Date();
      const mockRecord = {
        id: 'telem-1',
        stationId: 'maitri',
        sensorId: 'sensor-1',
        timestamp: readingTimestamp,
        value: 75.5,
        unit: '°C',
        quality: 100,
        status: 'NORMAL' as const,
        createdAt: new Date(),
      };

      vi.spyOn(sensorsRepository, 'findById').mockResolvedValue(mockSensor);
      vi.spyOn(telemetryRepository, 'create').mockResolvedValue(mockRecord);
      vi.spyOn(sensorsRepository, 'updateReading').mockResolvedValue(mockSensor);
      vi.spyOn(alertsService, 'evaluateReading').mockResolvedValue({
        breached: false,
      });
      const publishSpy = vi.spyOn(eventBus, 'publish').mockResolvedValue();

      const result = await service.ingestReading({
        sensorId: 'sensor-1',
        stationId: 'maitri',
        timestamp: readingTimestamp.toISOString(),
        value: 75.5,
        unit: '°C',
        status: 'NORMAL',
        quality: 100,
      });

      expect(result.isDuplicate).toBe(false);
      expect(result.reading.id).toBe('telem-1');
      expect(telemetryRepository.create).toHaveBeenCalledTimes(1);
      expect(sensorsRepository.updateReading).toHaveBeenCalledWith(
        'sensor-1',
        75.5,
        SensorStatus.NORMAL,
        readingTimestamp
      );
      expect(alertsService.evaluateReading).toHaveBeenCalledWith(
        expect.objectContaining({
          sensorId: 'sensor-1',
          value: 75.5,
          unit: '°C',
        }),
        mockSensor
      );
      expect(publishSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.TELEMETRY_READING_RECORDED,
          entityId: 'telem-1',
          stationId: 'maitri',
        })
      );
    });

    it('should reject timestamps too far in the future (>5 minutes)', async () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await expect(
        service.ingestReading({
          sensorId: 'sensor-1',
          stationId: 'maitri',
          timestamp: futureTime,
          value: 75.5,
          unit: '°C',
          status: 'NORMAL',
        })
      ).rejects.toThrow(/timestamp cannot be in the future/i);
    });

    it('should handle idempotent duplicate readings gracefully without duplicate alert or skew', async () => {
      const existingRecord = {
        id: 'existing-telem-1',
        stationId: 'maitri',
        sensorId: 'sensor-1',
        timestamp: new Date('2026-03-15T12:00:00Z'),
        value: 75.5,
        unit: '°C',
        quality: 100,
        status: 'NORMAL' as const,
        createdAt: new Date(),
      };

      vi.spyOn(sensorsRepository, 'findById').mockResolvedValue(mockSensor);
      // Repository returns null on conflict (ON CONFLICT DO NOTHING)
      vi.spyOn(telemetryRepository, 'create').mockResolvedValue(null);
      vi.spyOn(telemetryRepository, 'findBySensorAndTimestamp').mockResolvedValue(existingRecord);
      const alertSpy = vi.spyOn(alertsService, 'evaluateReading');
      const publishSpy = vi.spyOn(eventBus, 'publish');

      const result = await service.ingestReading({
        sensorId: 'sensor-1',
        stationId: 'maitri',
        timestamp: '2026-03-15T12:00:00Z',
        value: 75.5,
        unit: '°C',
        status: 'NORMAL',
      });

      expect(result.isDuplicate).toBe(true);
      expect(result.reading.id).toBe('existing-telem-1');
      // No duplicate alert evaluation or event emission on duplicate
      expect(alertSpy).not.toHaveBeenCalled();
      expect(publishSpy).not.toHaveBeenCalled();
    });
  });

  describe('ingestBatch', () => {
    it('should process batch of readings and report inserted vs duplicate counts', async () => {
      const now = new Date();
      const readings = [
        { sensorId: 'sensor-1', stationId: 'maitri', timestamp: now.toISOString(), value: 72.0, unit: '°C', status: 'NORMAL' as const },
        { sensorId: 'sensor-1', stationId: 'maitri', timestamp: now.toISOString(), value: 72.0, unit: '°C', status: 'NORMAL' as const }, // duplicate timestamp
      ];

      vi.spyOn(sensorsRepository, 'findById').mockResolvedValue(mockSensor);
      vi.spyOn(telemetryRepository, 'createBatch').mockResolvedValue([
        {
          id: 'telem-batch-1',
          stationId: 'maitri',
          sensorId: 'sensor-1',
          timestamp: now,
          value: 72.0,
          unit: '°C',
          quality: 100,
          status: 'NORMAL' as const,
          createdAt: new Date(),
        },
      ]);
      vi.spyOn(sensorsRepository, 'updateReading').mockResolvedValue(mockSensor);
      vi.spyOn(alertsService, 'evaluateReading').mockResolvedValue({
        breached: false,
      });
      const publishSpy = vi.spyOn(eventBus, 'publish').mockResolvedValue();

      const result = await service.ingestBatch({ readings });

      expect(result.processed).toBe(2);
      expect(result.inserted).toBe(1);
      expect(result.duplicates).toBe(1);
      expect(publishSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.TELEMETRY_BATCH_RECORDED,
        })
      );
    });
  });

  describe('Rolling Statistics Cache', () => {
    it('should compute window min, max, and avg accurately from in-memory ring buffer', async () => {
      const baseTime = Date.now();
      vi.spyOn(sensorsRepository, 'findById').mockResolvedValue(mockSensor);
      vi.spyOn(sensorsRepository, 'updateReading').mockResolvedValue(mockSensor);
      vi.spyOn(alertsService, 'evaluateReading').mockResolvedValue({ breached: false });
      vi.spyOn(eventBus, 'publish').mockResolvedValue();

      // Feed values: 10, 20, 30 across last 2 minutes
      const values = [10, 20, 30];
      for (let i = 0; i < values.length; i++) {
        const time = new Date(baseTime - (2 - i) * 30000);
        vi.spyOn(telemetryRepository, 'create').mockResolvedValue({
          id: `t-${i}`,
          stationId: 'maitri',
          sensorId: 'sensor-1',
          timestamp: time,
          value: values[i],
          unit: '°C',
          quality: 100,
          status: 'NORMAL' as const,
          createdAt: new Date(),
        });

        await service.ingestReading({
          sensorId: 'sensor-1',
          stationId: 'maitri',
          timestamp: time.toISOString(),
          value: values[i],
          unit: '°C',
          status: 'NORMAL',
        });
      }

      const stats5m = await service.getRollingStats('sensor-1', '5m');
      expect(stats5m.count).toBe(3);
      expect(stats5m.min).toBe(10);
      expect(stats5m.max).toBe(30);
      expect(stats5m.avg).toBe(20);
    });
  });
});
