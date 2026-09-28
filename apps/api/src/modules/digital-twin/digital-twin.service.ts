// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Spatial Digital Twin Service
// ═══════════════════════════════════════════════════════════════
// Read-model projection assembling the physical and operational hierarchy
// (Station -> Building -> Room -> Asset -> Sensor) into a 2D/3D spatial tree.
// Provides:
// 1. Initial complete spatial snapshot with Cartesian coordinates and operational colors.
// 2. Focused zone sub-tree retrieval.
// 3. Explicit spatial provenance tagging (CONFIGURED | DERIVED | DEFAULT).
// ═══════════════════════════════════════════════════════════════

import {
  SpatialHealthColor,
  SpatialProvenance,
  type SpatialTwinNode,
  type SpatialStationState,
  type SpatialCoordinate3D,
  type SpatialDimensions3D,
  RiskLevel,
  WeatherCondition,
} from '@repo/shared';
import { stationsRepository } from '../stations/stations.repository.js';
import { assetsRepository } from '../assets/assets.repository.js';
import { sensorsRepository } from '../sensors/sensors.repository.js';
import { alertsRepository } from '../alerts/alerts.repository.js';
import { weatherService } from '../weather/weather.service.js';
import { riskService } from '../risk/risk.service.js';

export class DigitalTwinService {
  /**
   * Assemble complete 2D/3D spatial operational state for a station
   */
  async getSpatialStationState(stationIdOrCode: string): Promise<SpatialStationState> {
    const station = await stationsRepository.findById(stationIdOrCode);
    if (!station) {
      throw new Error(`Station '${stationIdOrCode}' not found`);
    }

    // 1. Fetch physical hierarchy, assets, sensors, and active alerts in parallel
    const [hierarchy, assetsRes, sensorsRes, alertsRes, weather, risk] = await Promise.all([
      stationsRepository.findHierarchy(station.id),
      assetsRepository.findAll({ stationId: station.id, limit: 200 }),
      sensorsRepository.findAll({ stationId: station.id, limit: 300 }),
      alertsRepository.findAll({ stationId: station.id, status: 'ACTIVE' as any, limit: 100 }).catch(() => ({ data: [], total: 0 })),
      weatherService.getCurrentWeather(station.id).catch(() => null),
      riskService.assessStationRisk(station.id).catch(() => null),
    ]);

    const assets = assetsRes.data;
    const sensors = sensorsRes.data;
    const activeAlerts = alertsRes.data;

    // Group assets by room and building
    const assetsByRoom = new Map<string, typeof assets>();
    const assetsByBuildingOnly = new Map<string, typeof assets>();

    for (const asset of assets) {
      if (asset.roomId) {
        const list = assetsByRoom.get(asset.roomId) ?? [];
        list.push(asset);
        assetsByRoom.set(asset.roomId, list);
      } else if (asset.buildingId) {
        const list = assetsByBuildingOnly.get(asset.buildingId) ?? [];
        list.push(asset);
        assetsByBuildingOnly.set(asset.buildingId, list);
      }
    }

    // Group sensors by asset
    const sensorsByAsset = new Map<string, typeof sensors>();
    for (const sensor of sensors) {
      if (sensor.assetId) {
        const list = sensorsByAsset.get(sensor.assetId) ?? [];
        list.push(sensor);
        sensorsByAsset.set(sensor.assetId, list);
      }
    }

    // Group active alerts by asset and station
    const alertsByAsset = new Map<string, typeof activeAlerts>();
    for (const alert of activeAlerts) {
      if (alert.assetId) {
        const list = alertsByAsset.get(alert.assetId) ?? [];
        list.push(alert);
        alertsByAsset.set(alert.assetId, list);
      }
    }

    // 2. Build 3D Tree Nodes
    const rootNodes: SpatialTwinNode[] = [];
    const buildingsList = hierarchy?.buildings ?? [];

    buildingsList.forEach((b, bIdx) => {
      // Building coordinates
      const bCoords = this.parseBuildingCoordinates(b.coordinates, bIdx);
      const bRooms = b.rooms ?? [];

      const roomNodes: SpatialTwinNode[] = bRooms.map((r, rIdx) => {
        const rCoords = this.deriveRoomCoordinates(r, rIdx, bRooms.length);
        const roomAssets = assetsByRoom.get(r.id) ?? [];

        const assetNodes: SpatialTwinNode[] = roomAssets.map((a, aIdx) => {
          const aCoords = this.deriveAssetCoordinates(a, aIdx, roomAssets.length);
          const assetSensors = sensorsByAsset.get(a.id) ?? [];
          const assetAlerts = alertsByAsset.get(a.id) ?? [];

          // Determine health score and health color
          const healthScore = this.calculateAssetHealthScore(a, assetAlerts);
          const healthColor = this.mapHealthToColor(healthScore, assetAlerts);

          // Sensor nodes
          const sensorNodes: SpatialTwinNode[] = assetSensors.map((s, sIdx) => ({
            id: s.id,
            name: s.name,
            type: 'SENSOR',
            position: { x: sIdx * 0.5, y: 0.5, z: 0 },
            spatialProvenance: SpatialProvenance.DERIVED,
            status: s.status,
            healthScore: s.status === 'NORMAL' ? 100 : s.status === 'WARNING' ? 65 : 25,
            healthColor: s.status === 'NORMAL' ? SpatialHealthColor.GREEN : s.status === 'WARNING' ? SpatialHealthColor.YELLOW : SpatialHealthColor.RED,
            activeAlertCount: 0,
            alertPins: [],
            telemetrySummary: s.lastReading !== null ? {
              [s.type]: { value: s.lastReading, unit: s.unit }
            } : undefined,
          }));

          return {
            id: a.id,
            name: a.name,
            type: 'ASSET',
            position: aCoords.position,
            dimensions: aCoords.dimensions,
            spatialProvenance: aCoords.provenance,
            status: a.status,
            healthScore,
            healthColor,
            activeAlertCount: assetAlerts.length,
            alertPins: assetAlerts.map(al => ({
              alertId: al.id,
              severity: al.severity as any,
              title: al.title,
            })),
            children: sensorNodes,
          };
        });

        // Room aggregate health
        const roomHealth = assetNodes.length > 0
          ? Math.round(assetNodes.reduce((acc, an) => acc + an.healthScore, 0) / assetNodes.length)
          : 90;

        return {
          id: r.id,
          name: r.name,
          type: 'ROOM',
          position: rCoords.position,
          dimensions: rCoords.dimensions,
          spatialProvenance: rCoords.provenance,
          status: 'OPERATIONAL',
          healthScore: roomHealth,
          healthColor: this.mapHealthToColor(roomHealth, []),
          activeAlertCount: assetNodes.reduce((acc, an) => acc + an.activeAlertCount, 0),
          alertPins: assetNodes.flatMap(an => an.alertPins),
          children: assetNodes,
        };
      });

      // Building aggregate health
      const bHealth = roomNodes.length > 0
        ? Math.round(roomNodes.reduce((acc, rn) => acc + rn.healthScore, 0) / roomNodes.length)
        : 90;

      rootNodes.push({
        id: b.id,
        name: b.name,
        type: 'BUILDING',
        position: bCoords.position,
        dimensions: bCoords.dimensions,
        spatialProvenance: bCoords.provenance,
        status: 'OPERATIONAL',
        healthScore: bHealth,
        healthColor: this.mapHealthToColor(bHealth, []),
        activeAlertCount: roomNodes.reduce((acc, rn) => acc + rn.activeAlertCount, 0),
        alertPins: roomNodes.flatMap(rn => rn.alertPins),
        children: roomNodes,
      });
    });

    // 3. Environmental Skybox & Overview
    const weatherCondition = (weather?.condition as WeatherCondition) ?? WeatherCondition.OVERCAST;
    const isBlizzard = weatherCondition === WeatherCondition.BLIZZARD || weatherCondition === WeatherCondition.KATABATIC_GALE;

    return {
      stationId: station.id,
      name: station.name,
      latitude: station.latitude,
      longitude: station.longitude,
      altitude: station.altitude,
      status: station.status as any,
      environmentalSkybox: {
        ambientTemperatureC: weather?.temperature ?? -25.0,
        windSpeedKmh: weather?.windSpeed ?? 30.0,
        windDirectionDeg: 145,
        condition: weatherCondition,
        blizzardVisibilityFactor: isBlizzard ? 0.15 : 0.95,
      },
      stationHealthScore: 100 - (risk?.compositeScore ?? 25),
      riskLevel: risk?.riskLevel ?? RiskLevel.LOW,
      rootNodes,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Retrieve a focused zone/room subtree
   */
  async getZoneSpatialState(stationId: string, zoneId: string): Promise<SpatialTwinNode | null> {
    const fullState = await this.getSpatialStationState(stationId);
    for (const building of fullState.rootNodes) {
      if (building.children) {
        const found = building.children.find(r => r.id === zoneId);
        if (found) return found;
      }
    }
    return null;
  }

  // ── Helper Coordinate & Health Derivations ──────────────────────

  private parseBuildingCoordinates(
    coords: unknown,
    index: number
  ): { position: SpatialCoordinate3D; dimensions: SpatialDimensions3D; provenance: SpatialProvenance } {
    if (coords && typeof coords === 'object' && 'x' in coords && 'y' in coords) {
      const c = coords as any;
      return {
        position: { x: Number(c.x), y: Number(c.y), z: Number(c.z ?? 0) },
        dimensions: {
          width: Number(c.width ?? 20),
          length: Number(c.length ?? 35),
          height: Number(c.height ?? 8),
        },
        provenance: SpatialProvenance.CONFIGURED,
      };
    }

    // Deterministic offset layout: arrange buildings along East-West grid
    return {
      position: { x: index * 40 - 40, y: 0, z: 0 },
      dimensions: { width: 22, length: 38, height: 8 },
      provenance: SpatialProvenance.DEFAULT,
    };
  }

  private deriveRoomCoordinates(
    room: { area?: number | null; floor?: number },
    index: number,
    totalRooms: number
  ): { position: SpatialCoordinate3D; dimensions: SpatialDimensions3D; provenance: SpatialProvenance } {
    const area = room.area ?? 40;
    const side = Math.round(Math.sqrt(area));
    const floor = room.floor ?? 0;

    // Arrange rooms inside building footprint
    const cols = Math.max(1, Math.ceil(Math.sqrt(totalRooms)));
    const row = Math.floor(index / cols);
    const col = index % cols;

    return {
      position: {
        x: (col * 8) - 10,
        y: floor * 3.5,
        z: (row * 8) - 10,
      },
      dimensions: {
        width: Math.max(4, side),
        length: Math.max(4, side),
        height: 3.2,
      },
      provenance: SpatialProvenance.DERIVED,
    };
  }

  private deriveAssetCoordinates(
    asset: { metadata?: unknown },
    index: number,
    _totalAssets: number
  ): { position: SpatialCoordinate3D; dimensions: SpatialDimensions3D; provenance: SpatialProvenance } {
    const m = asset.metadata as any;
    if (m?.position && typeof m.position === 'object') {
      return {
        position: { x: Number(m.position.x), y: Number(m.position.y), z: Number(m.position.z) },
        dimensions: { width: 1.5, length: 1.5, height: 2.0 },
        provenance: SpatialProvenance.CONFIGURED,
      };
    }

    return {
      position: {
        x: (index % 3) * 2 - 2,
        y: 0,
        z: Math.floor(index / 3) * 2 - 1,
      },
      dimensions: { width: 1.2, length: 1.2, height: 1.8 },
      provenance: SpatialProvenance.DERIVED,
    };
  }

  private calculateAssetHealthScore(asset: { status: string }, alerts: Array<{ severity: string }>): number {
    if (alerts.some(a => a.severity === 'CRITICAL' || a.severity === 'EMERGENCY')) {
      return 35;
    }
    if (alerts.some(a => a.severity === 'WARNING')) {
      return 60;
    }
    if (asset.status === 'CRITICAL') return 20;
    if (asset.status === 'WARNING') return 65;
    return 95;
  }

  private mapHealthToColor(score: number, alerts: Array<{ severity: string }>): SpatialHealthColor {
    if (alerts.some(a => a.severity === 'CRITICAL' || a.severity === 'EMERGENCY')) {
      return SpatialHealthColor.RED;
    }
    if (alerts.some(a => a.severity === 'WARNING')) {
      return SpatialHealthColor.YELLOW;
    }
    if (score >= 80) return SpatialHealthColor.GREEN;
    if (score >= 50) return SpatialHealthColor.YELLOW;
    return SpatialHealthColor.RED;
  }
}

export const digitalTwinService = new DigitalTwinService();
