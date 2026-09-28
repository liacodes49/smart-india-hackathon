// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Predictions & Equipment Health Unit Tests
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { anomalyService } from '../../src/modules/predictions/anomaly.service.js';
import { EquipmentHealthService } from '../../src/modules/predictions/equipment-health.service.js';
import { RiskLevel, SensorType, MaintenanceStatus } from '@repo/shared';

describe('Predictions & Equipment Health Engine', () => {
  describe('Z-Score Anomaly Detection', () => {
    it('should return low anomaly score for readings within normal standard deviation', () => {
      const window = [80.1, 79.8, 80.4, 80.2, 79.9, 80.0];
      const result = anomalyService.evaluateReading(80.3, window);

      expect(result.isAnomaly).toBe(false);
      expect(result.zScore).toBeLessThan(2.0);
      expect(result.anomalyScore).toBeLessThan(50);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect significant statistical anomalies when value exceeds 3-sigma', () => {
      const window = [80.0, 80.2, 79.8, 80.1, 80.0, 79.9]; // mean ~80.0, stdDev ~0.14
      const result = anomalyService.evaluateReading(83.5, window); // > 20 sigma outlier

      expect(result.isAnomaly).toBe(true);
      expect(result.zScore).toBeGreaterThan(3.0);
      expect(result.anomalyScore).toBeGreaterThanOrEqual(80);
    });

    it('should handle sparse sample windows (< 3 readings) gracefully with reduced confidence', () => {
      const window = [80.0];
      const result = anomalyService.evaluateReading(82.0, window);

      expect(result.isAnomaly).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.calculationBasis).toContain('PROTOTYPE_ASSUMPTION');
    });
  });

  describe('Equipment Health Index & Estimated RUL', () => {
    it('should calculate high health and STABLE Estimated RUL for nominal asset', async () => {
      const service = new EquipmentHealthService();

      const mockAsset = {
        id: 'asset-gen-01',
        stationId: 'station-maitri',
        name: 'Maitri Primary DG 1',
        category: 'GENERATOR',
      };

      const mockSensors = [
        {
          id: 'sensor-temp-01',
          assetId: 'asset-gen-01',
          name: 'Coolant Temp',
          type: SensorType.TEMPERATURE,
          unit: '°C',
          lastReading: 80.5,
        },
        {
          id: 'sensor-vib-01',
          assetId: 'asset-gen-01',
          name: 'Bearing Vibration',
          type: SensorType.VIBRATION,
          unit: 'mm/s',
          lastReading: 1.8,
        },
      ];

      const { assetsRepository } = await import('../../src/modules/assets/assets.repository.js');
      vi.spyOn(assetsRepository, 'findById').mockResolvedValue(mockAsset as any);
      const { sensorsRepository } = await import('../../src/modules/sensors/sensors.repository.js');
      vi.spyOn(sensorsRepository, 'findByAssetId').mockResolvedValue(mockSensors as any);

      const { telemetryRepository } = await import('../../src/modules/telemetry/telemetry.repository.js');
      vi.spyOn(telemetryRepository, 'findAll').mockResolvedValue({
        data: [{ value: 80.0 } as any, { value: 80.5 } as any, { value: 80.2 } as any],
        total: 3,
      });

      const { predictionsRepository } = await import('../../src/modules/predictions/predictions.repository.js');
      vi.spyOn(predictionsRepository, 'create').mockResolvedValue({} as any);

      const summary = await service.evaluateAssetHealth('asset-gen-01');

      expect(summary.healthScore).toBeGreaterThanOrEqual(90);
      expect(summary.failureRiskEstimate).toBe(RiskLevel.LOW);
      expect(summary.estimatedRul.degradationTrend).toBe('STABLE');
      expect(summary.estimatedRul.estimateHours).toBeGreaterThanOrEqual(2000);
      expect(summary.assumptions).toBeDefined();
    });

    it('should calculate degraded health, elevated failure risk, and trigger maintenance recommendation', async () => {
      const service = new EquipmentHealthService();

      const mockAsset = {
        id: 'asset-gen-02',
        stationId: 'station-maitri',
        name: 'Maitri Primary DG 2',
        category: 'GENERATOR',
      };

      const mockSensors = [
        {
          id: 'sensor-temp-02',
          assetId: 'asset-gen-02',
          name: 'Coolant Temp',
          type: SensorType.TEMPERATURE,
          unit: '°C',
          lastReading: 94.0, // High thermal stress
        },
        {
          id: 'sensor-vib-02',
          assetId: 'asset-gen-02',
          name: 'Bearing Vibration',
          type: SensorType.VIBRATION,
          unit: 'mm/s',
          lastReading: 4.8, // Critical mechanical vibration
        },
      ];

      const { assetsRepository } = await import('../../src/modules/assets/assets.repository.js');
      vi.spyOn(assetsRepository, 'findById').mockResolvedValue(mockAsset as any);

      const { sensorsRepository } = await import('../../src/modules/sensors/sensors.repository.js');
      vi.spyOn(sensorsRepository, 'findByAssetId').mockResolvedValue(mockSensors as any);

      const { telemetryRepository } = await import('../../src/modules/telemetry/telemetry.repository.js');
      vi.spyOn(telemetryRepository, 'findAll').mockResolvedValue({
        data: [{ value: 92.0 } as any, { value: 94.0 } as any],
        total: 2,
      });

      const { predictionsRepository } = await import('../../src/modules/predictions/predictions.repository.js');
      vi.spyOn(predictionsRepository, 'create').mockResolvedValue({} as any);

      const { maintenanceService } = await import('../../src/modules/maintenance/maintenance.service.js');
      const createRecSpy = vi.spyOn(maintenanceService, 'createRecommendation').mockResolvedValue({
        id: 'rec-1',
        status: MaintenanceStatus.RECOMMENDED,
      } as any);

      const summary = await service.evaluateAssetHealth('asset-gen-02');

      expect(summary.healthScore).toBeLessThan(70);
      expect(summary.failureRiskEstimate).toBe(RiskLevel.CRITICAL);
      expect(summary.estimatedRul.degradationTrend).toBe('RAPID_DEGRADATION');
      expect(summary.operatingStressFactors.length).toBeGreaterThan(0);

      // Verify human-in-the-loop maintenance recommendation trigger
      expect(createRecSpy).toHaveBeenCalledOnce();
      expect(createRecSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          stationId: 'station-maitri',
          assetId: 'asset-gen-02',
        })
      );
    });
  });
});
