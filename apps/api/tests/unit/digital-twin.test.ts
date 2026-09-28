// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Spatial Digital Twin Unit Tests
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { digitalTwinService } from '../../src/modules/digital-twin/digital-twin.service.js';
import { stationsRepository } from '../../src/modules/stations/stations.repository.js';
import { assetsRepository } from '../../src/modules/assets/assets.repository.js';
import { sensorsRepository } from '../../src/modules/sensors/sensors.repository.js';
import { alertsRepository } from '../../src/modules/alerts/alerts.repository.js';
import { weatherService } from '../../src/modules/weather/weather.service.js';
import { riskService } from '../../src/modules/risk/risk.service.js';
import { SpatialHealthColor, SpatialProvenance, RiskLevel } from '@repo/shared';

describe('Digital Twin Service — 2D/3D Spatial Graph Projection', () => {
  const stationId = '00000000-0000-0000-0000-000000000001';
  const buildingId = '11111111-1111-1111-1111-111111111111';
  const roomId = '22222222-2222-2222-2222-222222222222';
  const assetId1 = '33333333-3333-3333-3333-333333333333';
  const assetId2 = '44444444-4444-4444-4444-444444444444';

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(stationsRepository, 'findById').mockResolvedValue({
      id: stationId,
      stationId: 'MAITRI',
      name: 'Maitri Station',
      latitude: -70.767,
      longitude: 11.733,
      altitude: 117,
      status: 'OPERATIONAL',
      timezone: 'UTC+5:30',
      description: 'Maitri',
      imageUrl: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.spyOn(stationsRepository, 'findHierarchy').mockResolvedValue({
      id: stationId,
      stationId: 'MAITRI',
      name: 'Maitri Station',
      latitude: -70.767,
      longitude: 11.733,
      altitude: 117,
      status: 'OPERATIONAL',
      timezone: 'UTC+5:30',
      description: 'Maitri',
      imageUrl: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      buildings: [
        {
          id: buildingId,
          stationId,
          name: 'Main Living & Command Block',
          code: 'MLB',
          floors: 2,
          purpose: 'Command & Living',
          coordinates: { x: 10, y: 0, z: 5, width: 25, length: 40, height: 8 },
          createdAt: new Date(),
          updatedAt: new Date(),
          rooms: [
            {
              id: roomId,
              buildingId,
              name: 'Power & Generator Room',
              code: 'PGR',
              floor: 0,
              purpose: 'Power Generation',
              area: 64,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      ],
    });

    vi.spyOn(assetsRepository, 'findAll').mockResolvedValue({
      data: [
        {
          id: assetId1,
          stationId,
          buildingId,
          roomId,
          name: 'Diesel Generator #1',
          code: 'GEN-01',
          category: 'GENERATOR' as any,
          criticality: 'CRITICAL' as any,
          status: 'NORMAL' as any,
          manufacturer: 'Caterpillar',
          model: '3306B',
          serialNumber: 'SN-01',
          metadata: { position: { x: 2, y: 0, z: 3 } },
          installDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: assetId2,
          stationId,
          buildingId,
          roomId,
          name: 'Diesel Generator #2',
          code: 'GEN-02',
          category: 'GENERATOR' as any,
          criticality: 'CRITICAL' as any,
          status: 'CRITICAL' as any,
          manufacturer: 'Caterpillar',
          model: '3306B',
          serialNumber: 'SN-02',
          metadata: null, // No explicit coordinates -> should be DERIVED
          installDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      total: 2,
    });

    vi.spyOn(sensorsRepository, 'findAll').mockResolvedValue({
      data: [
        {
          id: 'sens-1',
          stationId,
          assetId: assetId1,
          name: 'Generator 1 Power Sensor',
          type: 'POWER' as any,
          unit: 'kW',
          minThreshold: 0,
          maxThreshold: 100,
          warningThreshold: 80,
          criticalThreshold: 95,
          status: 'NORMAL' as any,
          lastReading: 68.5,
          lastReadingAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      total: 1,
    });

    vi.spyOn(alertsRepository, 'findAll').mockResolvedValue({
      data: [
        {
          id: 'alert-crit-1',
          stationId,
          sensorId: null,
          assetId: assetId2,
          title: 'Generator #2 Overheating & Trip Risk',
          message: 'Coolant temperature exceeded 98°C',
          severity: 'CRITICAL',
          status: 'ACTIVE',
          category: 'EQUIPMENT',
          acknowledgedBy: null,
          acknowledgedAt: null,
          resolvedBy: null,
          resolvedAt: null,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
      ],
      total: 1,
    });

    vi.spyOn(weatherService, 'getCurrentWeather').mockResolvedValue({
      id: 'weather-1',
      stationId,
      temperature: -28,
      windSpeed: 45,
      windGust: 65,
      windDirection: 'SSE',
      windChill: -42,
      pressure: 980,
      humidity: 70,
      visibilityMeters: 6000,
      condition: 'SNOW',
      provenance: 'SIMULATED',
      recordedAt: new Date(),
      createdAt: new Date(),
    });

    vi.spyOn(riskService, 'assessStationRisk').mockResolvedValue({
      stationId,
      compositeScore: 42,
      riskLevel: RiskLevel.MEDIUM,
      isEmergencyOverride: false,
      pillars: {} as any,
      topDrivers: [],
      recommendedActions: [],
      confidenceScore: 0.88,
      assumptions: [],
      assessedAt: new Date().toISOString(),
    });
  });

  it('assembles complete 2D/3D spatial tree matching Station -> Building -> Room -> Asset -> Sensor', async () => {
    const state = await digitalTwinService.getSpatialStationState(stationId);

    expect(state.stationId).toBe(stationId);
    expect(state.name).toBe('Maitri Station');
    expect(state.rootNodes).toHaveLength(1);

    const bNode = state.rootNodes[0];
    expect(bNode.type).toBe('BUILDING');
    expect(bNode.children).toHaveLength(1);

    const rNode = bNode.children![0];
    expect(rNode.type).toBe('ROOM');
    expect(rNode.children).toHaveLength(2);

    const aNode1 = rNode.children![0];
    expect(aNode1.name).toBe('Diesel Generator #1');
    expect(aNode1.type).toBe('ASSET');
    expect(aNode1.children).toHaveLength(1);

    const sNode = aNode1.children![0];
    expect(sNode.type).toBe('SENSOR');
    expect(sNode.telemetrySummary?.POWER.value).toBe(68.5);
  });

  it('correctly tracks spatial provenance as CONFIGURED vs DERIVED', async () => {
    const state = await digitalTwinService.getSpatialStationState(stationId);
    const bNode = state.rootNodes[0];
    expect(bNode.spatialProvenance).toBe(SpatialProvenance.CONFIGURED);
    expect(bNode.position.x).toBe(10);

    const aNode1 = bNode.children![0].children![0];
    expect(aNode1.spatialProvenance).toBe(SpatialProvenance.CONFIGURED);
    expect(aNode1.position.x).toBe(2);

    const aNode2 = bNode.children![0].children![1];
    expect(aNode2.spatialProvenance).toBe(SpatialProvenance.DERIVED);
  });

  it('colors assets accurately based on health and active critical alerts', async () => {
    const state = await digitalTwinService.getSpatialStationState(stationId);
    const rNode = state.rootNodes[0].children![0];

    const normalAsset = rNode.children![0];
    expect(normalAsset.healthColor).toBe(SpatialHealthColor.GREEN);
    expect(normalAsset.activeAlertCount).toBe(0);

    const criticalAsset = rNode.children![1];
    expect(criticalAsset.healthColor).toBe(SpatialHealthColor.RED);
    expect(criticalAsset.activeAlertCount).toBe(1);
    expect(criticalAsset.alertPins[0].title).toBe('Generator #2 Overheating & Trip Risk');
  });

  it('retrieves focused zone sub-tree for a single room', async () => {
    const zone = await digitalTwinService.getZoneSpatialState(stationId, roomId);
    expect(zone).not.toBeNull();
    expect(zone!.id).toBe(roomId);
    expect(zone!.name).toBe('Power & Generator Room');
    expect(zone!.children).toHaveLength(2);
  });
});
