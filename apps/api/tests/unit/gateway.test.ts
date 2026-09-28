// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Industrial Gateway Unit & Adapter Tests
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gatewayService } from '../../src/modules/gateway/gateway.service.js';
import { stationsRepository } from '../../src/modules/stations/stations.repository.js';
import { telemetryService } from '../../src/modules/telemetry/telemetry.service.js';
import { GatewayProtocol, DataProvenance } from '@repo/shared';

describe('Industrial Telemetry Ingestion Gateway', () => {
  const stationId = '00000000-0000-0000-0000-000000000001';

  const mockStation: any = {
    id: stationId,
    stationId: 'MAITRI',
    name: 'Maitri Research Station',
    latitude: -70.767,
    longitude: 11.733,
    altitude: 117,
    status: 'OPERATIONAL',
    timezone: 'UTC+5:30',
    description: 'Central Antarctic Station',
    imageUrl: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    gatewayService.clearDeadLetter();
    vi.spyOn(stationsRepository, 'findById').mockResolvedValue(mockStation);
  });

  describe('1. Protocol Normalization & Canonical Telemetry Routing', () => {
    it('normalizes standard REST payloads and routes to TelemetryService.ingestBatch()', async () => {
      const ingestSpy = vi.spyOn(telemetryService, 'ingestBatch').mockResolvedValue({
        processed: 2,
        inserted: 2,
        duplicates: 0,
        alertsTriggered: 0,
      });

      const result = await gatewayService.ingest(GatewayProtocol.REST, {
        stationId,
        payload: {
          readings: [
            { sensorId: 'sensor-gen-01', value: 45.5, unit: 'kW' },
            { sensorId: 'sensor-battery-01', value: 92.0, unit: '%' },
          ],
        },
      });

      expect(result.protocol).toBe(GatewayProtocol.REST);
      expect(result.acceptedCount).toBe(2);
      expect(result.quarantinedCount).toBe(0);
      expect(ingestSpy).toHaveBeenCalledTimes(1);
    });

    it('normalizes industrial MQTT tag arrays (SCADA d.tags format)', async () => {
      const ingestSpy = vi.spyOn(telemetryService, 'ingestBatch').mockResolvedValue({
        processed: 2,
        inserted: 2,
        duplicates: 0,
        alertsTriggered: 0,
      });

      const mqttPayload = {
        topic: 'antarctica/maitri/power/generators',
        d: {
          tags: [
            { id: 'gen-01-freq', val: 50.1, unit: 'Hz', ts: 1773700000000 },
            { id: 'gen-01-temp', val: 78.4, unit: '°C', ts: 1773700000000 },
          ],
        },
      };

      const result = await gatewayService.ingest(GatewayProtocol.MQTT, {
        stationId,
        payload: mqttPayload,
      });

      expect(result.protocol).toBe(GatewayProtocol.MQTT);
      expect(result.acceptedCount).toBe(2);
      expect(ingestSpy).toHaveBeenCalledWith({
        readings: expect.arrayContaining([
          expect.objectContaining({ sensorId: 'gen-01-freq', value: 50.1, unit: 'Hz' }),
          expect.objectContaining({ sensorId: 'gen-01-temp', value: 78.4, unit: '°C' }),
        ]),
      });
    });

    it('normalizes Modbus PLC register tables into sensor readings', async () => {
      const ingestSpy = vi.spyOn(telemetryService, 'ingestBatch').mockResolvedValue({
        processed: 2,
        inserted: 2,
        duplicates: 0,
        alertsTriggered: 0,
      });

      const modbusPayload = {
        slaveId: 2,
        registers: [
          { address: 40001, sensorId: 'sensor-flow-rate', value: 14.8, unit: 'L/min' },
          { address: 40002, sensorId: 'sensor-pump-rpm', value: 1450, unit: 'RPM' },
        ],
      };

      const result = await gatewayService.ingest(GatewayProtocol.MODBUS, {
        stationId,
        payload: modbusPayload,
      });

      expect(result.protocol).toBe(GatewayProtocol.MODBUS);
      expect(result.acceptedCount).toBe(2);
      expect(ingestSpy).toHaveBeenCalledTimes(1);
    });

    it('normalizes Manual field operator logs with MANUAL provenance', async () => {
      const ingestSpy = vi.spyOn(telemetryService, 'ingestBatch').mockResolvedValue({
        processed: 1,
        inserted: 1,
        duplicates: 0,
        alertsTriggered: 0,
      });

      const manualPayload = {
        operatorId: 'user-tech-01',
        readings: [
          { sensorId: 'sensor-glycol-ph', value: 7.2, unit: 'pH', loggedAt: '2026-09-16T12:00:00Z' },
        ],
      };

      const result = await gatewayService.ingest(GatewayProtocol.MANUAL, {
        stationId,
        payload: manualPayload,
      });

      expect(result.protocol).toBe(GatewayProtocol.MANUAL);
      expect(result.acceptedCount).toBe(1);
      expect(ingestSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. Malformed Payload Handling & Dead-Letter Quarantine', () => {
    it('quarantines malformed items missing sensorId, numeric value, or unit without crashing', async () => {
      vi.spyOn(telemetryService, 'ingestBatch').mockResolvedValue({
        processed: 1,
        inserted: 1,
        duplicates: 0,
        alertsTriggered: 0,
      });

      const mixedPayload = {
        readings: [
          { sensorId: 'valid-sensor', value: 50.0, unit: 'kW' }, // Valid
          { sensorId: '', value: 20.0, unit: 'kW' }, // Missing sensorId
          { sensorId: 'bad-val-sensor', value: 'not-a-number', unit: 'kW' }, // Invalid value
          { sensorId: 'no-unit-sensor', value: 10.0 }, // Missing unit
        ],
      };

      const result = await gatewayService.ingest(GatewayProtocol.REST, {
        stationId,
        payload: mixedPayload,
      });

      expect(result.acceptedCount).toBe(1);
      expect(result.quarantinedCount).toBe(3);

      const deadLetter = gatewayService.getDeadLetter(stationId);
      expect(deadLetter.length).toBe(3);
      expect(deadLetter.map((d) => d.code)).toEqual(
        expect.arrayContaining(['MISSING_SENSOR_ID', 'INVALID_NUMERIC_VALUE', 'MISSING_UNIT'])
      );
    });
  });

  describe('3. Backpressure & Ingestion Statistics', () => {
    it('rejects batch when exceeding the 500-reading backpressure limit', async () => {
      const oversizedBatch = Array.from({ length: 501 }, (_, i) => ({
        sensorId: `sensor-${i}`,
        value: i,
        unit: 'kW',
      }));

      await expect(
        gatewayService.ingest(GatewayProtocol.REST, {
          stationId,
          payload: { readings: oversizedBatch },
        })
      ).rejects.toThrow(/exceeds maximum allowable backpressure threshold/);
    });

    it('tracks gateway ingestion statistics accurately across protocols', async () => {
      const stats = gatewayService.getStats();
      expect(stats.totalIngested).toBeGreaterThan(0);
      expect(stats.totalAccepted).toBeGreaterThan(0);
      expect(stats.byProtocol[GatewayProtocol.REST]).toBeGreaterThan(0);
    });
  });
});
