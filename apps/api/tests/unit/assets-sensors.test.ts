import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssetsService } from '../../src/modules/assets/assets.service.js';
import { assetsRepository } from '../../src/modules/assets/assets.repository.js';
import { SensorsService } from '../../src/modules/sensors/sensors.service.js';
import { sensorsRepository } from '../../src/modules/sensors/sensors.repository.js';
import { eventBus } from '../../src/lib/event-bus.js';
import { EventType, SensorStatus, AssetCriticality } from '@repo/shared';

describe('Assets & Sensors Hierarchy & Lifecycle', () => {
  let assetsService: AssetsService;
  let sensorsService: SensorsService;

  beforeEach(() => {
    vi.clearAllMocks();
    assetsService = new AssetsService();
    sensorsService = new SensorsService();
  });

  describe('AssetsService', () => {
    it('should reject creating asset when building belongs to a different station', async () => {
      vi.spyOn(assetsRepository, 'validateHierarchy').mockResolvedValue({
        valid: false,
        error: "Building 'bld-bharati' does not belong to station 'maitri'",
      });

      await expect(
        assetsService.createAsset({
          stationId: 'maitri',
          buildingId: 'bld-bharati',
          name: 'Main Generator 1',
          code: 'GEN-01',
          category: 'GENERATOR',
          criticality: AssetCriticality.CRITICAL,
          status: 'NORMAL',
        })
      ).rejects.toThrow(/does not belong to station/i);
    });

    it('should successfully create asset and emit ASSET_CREATED', async () => {
      const mockAsset = {
        id: 'asset-1',
        stationId: 'maitri',
        buildingId: 'bld-maitri-1',
        roomId: null,
        name: 'Main Generator 1',
        code: 'GEN-01',
        category: 'GENERATOR' as const,
        criticality: 'CRITICAL' as const,
        status: 'NORMAL' as const,
        model: 'Cummins KTA50',
        manufacturer: 'Cummins',
        serialNumber: 'SN-9821',
        installDate: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(assetsRepository, 'validateHierarchy').mockResolvedValue({ valid: true });
      vi.spyOn(assetsRepository, 'findByCode').mockResolvedValue(null);
      vi.spyOn(assetsRepository, 'create').mockResolvedValue(mockAsset);
      const publishSpy = vi.spyOn(eventBus, 'publish').mockResolvedValue();

      const result = await assetsService.createAsset({
        stationId: 'maitri',
        buildingId: 'bld-maitri-1',
        name: 'Main Generator 1',
        code: 'GEN-01',
        category: 'GENERATOR',
        criticality: AssetCriticality.CRITICAL,
        status: 'NORMAL',
      });

      expect(result.id).toBe('asset-1');
      expect(publishSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.ASSET_CREATED,
          entityId: 'asset-1',
          stationId: 'maitri',
        })
      );
    });
  });

  describe('SensorsService', () => {
    it('should reject sensor registration if referenced asset does not belong to the station', async () => {
      vi.spyOn(sensorsRepository, 'validateAssetAssociation').mockResolvedValue(false);

      await expect(
        sensorsService.createSensor({
          stationId: 'maitri', // mismatch with asset
          assetId: 'asset-bharati-1',
          name: 'Coolant Temp Sensor',
          type: 'TEMPERATURE',
          unit: '°C',
          status: 'NORMAL',
        })
      ).rejects.toThrow(/does not belong to Station 'maitri'/i);
    });

    it('should detect stale sensors and flag them as OFFLINE', async () => {
      const staleSensor = {
        id: 'sensor-stale-1',
        stationId: 'maitri',
        assetId: 'asset-1',
        name: 'Outdoor Temp Sensor',
        type: 'TEMPERATURE' as const,
        unit: '°C',
        status: 'NORMAL' as const,
        warningThreshold: null,
        criticalThreshold: null,
        minThreshold: null,
        maxThreshold: null,
        lastReading: -25.0,
        lastReadingAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago (> 5m threshold)
        isActive: true,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(sensorsRepository, 'findStaleSensors').mockResolvedValue([staleSensor]);
      vi.spyOn(sensorsRepository, 'update').mockResolvedValue({
        ...staleSensor,
        status: 'OFFLINE',
      });
      const publishSpy = vi.spyOn(eventBus, 'publish').mockResolvedValue();

      const count = await sensorsService.checkStaleSensors();

      expect(count).toBe(1);
      expect(sensorsRepository.update).toHaveBeenCalledWith('sensor-stale-1', {
        status: SensorStatus.OFFLINE,
      });
      expect(publishSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.SENSOR_STATUS_CHANGED,
          entityId: 'sensor-stale-1',
          payload: expect.objectContaining({
            newStatus: 'OFFLINE',
          }),
        })
      );
    });
  });
});
