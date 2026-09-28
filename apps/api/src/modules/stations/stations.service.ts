// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Stations Service
// ═══════════════════════════════════════════════════════════════
// Business logic for station hierarchy, lifecycle management,
// and event dispatching.
// ═══════════════════════════════════════════════════════════════

import {
  stationsRepository,
  StationInsert,
  StationSelect,
  StationHierarchy,
  BuildingInsert,
  BuildingSelect,
  RoomInsert,
  RoomSelect,
} from './stations.repository.js';
import { eventBus } from '../../lib/event-bus.js';
import { createDomainEvent, EventType, StationOverview, DashboardStats } from '@repo/shared';
import { db } from '../../config/database.js';
import { assets, sensors, alerts } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';

export class StationsService {
  async getAllStations(): Promise<StationSelect[]> {
    return stationsRepository.findAll();
  }

  async getStationById(idOrCode: string): Promise<StationSelect | null> {
    return stationsRepository.findById(idOrCode);
  }

  async getStationHierarchy(idOrCode: string): Promise<StationHierarchy | null> {
    return stationsRepository.findHierarchy(idOrCode);
  }

  async getStationOverview(idOrCode: string): Promise<StationOverview | null> {
    const station = await stationsRepository.findById(idOrCode);
    if (!station) return null;

    // Fetch counts for dashboard stats
    const stationAssets = await db.select().from(assets).where(eq(assets.stationId, station.id));
    const stationSensors = await db.select().from(sensors).where(eq(sensors.stationId, station.id));
    const stationAlerts = await db.select().from(alerts).where(eq(alerts.stationId, station.id));

    const activeAlerts = stationAlerts.filter(a => a.status === 'ACTIVE');
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'EMERGENCY');
    const sensorsOnline = stationSensors.filter(s => s.status === 'NORMAL');

    const stats: DashboardStats = {
      totalAssets: stationAssets.length,
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
      sensorsOnline: sensorsOnline.length,
      sensorsTotal: stationSensors.length,
      pendingMaintenance: 0,
      powerStatus: 100,
      fuelLevel: 85,
    };

    return {
      station: station as any,
      stats,
      recentAlerts: stationAlerts.slice(0, 5) as any,
      telemetrySummary: [],
    };
  }

  async createStation(data: StationInsert, userId?: string): Promise<StationSelect> {
    const existing = await stationsRepository.findById(data.stationId);
    if (existing) {
      throw new Error(`Station with code '${data.stationId}' already exists`);
    }

    const created = await stationsRepository.create(data);

    await eventBus.publish(
      createDomainEvent({
        eventType: EventType.STATION_CREATED,
        source: 'stations-service',
        entityId: created.id,
        stationId: created.id,
        payload: {
          stationId: created.stationId,
          name: created.name,
          createdBy: userId,
        },
      })
    );

    return created;
  }

  async updateStation(id: string, data: Partial<StationInsert>, userId?: string): Promise<StationSelect | null> {
    const existing = await stationsRepository.findById(id);
    if (!existing) return null;

    const updated = await stationsRepository.update(existing.id, data);
    if (!updated) return null;

    if (data.status && data.status !== existing.status) {
      await eventBus.publish(
        createDomainEvent({
          eventType: EventType.STATION_STATUS_CHANGED,
          source: 'stations-service',
          entityId: updated.id,
          stationId: updated.id,
          payload: {
            oldStatus: existing.status,
            newStatus: updated.status,
            updatedBy: userId,
          },
        })
      );
    } else {
      await eventBus.publish(
        createDomainEvent({
          eventType: EventType.STATION_UPDATED,
          source: 'stations-service',
          entityId: updated.id,
          stationId: updated.id,
          payload: {
            changes: data,
            updatedBy: userId,
          },
        })
      );
    }

    return updated;
  }

  async deleteStation(id: string): Promise<boolean> {
    const existing = await stationsRepository.findById(id);
    if (!existing) return false;
    return stationsRepository.delete(existing.id);
  }

  // ── Buildings ──────────────────────────────────────────────

  async getBuildings(stationIdOrCode: string): Promise<BuildingSelect[]> {
    const station = await stationsRepository.findById(stationIdOrCode);
    if (!station) return [];
    return stationsRepository.findBuildingsByStationId(station.id);
  }

  async createBuilding(data: BuildingInsert): Promise<BuildingSelect> {
    const created = await stationsRepository.createBuilding(data);

    await eventBus.publish(
      createDomainEvent({
        eventType: EventType.BUILDING_CREATED,
        source: 'stations-service',
        entityId: created.id,
        stationId: created.stationId,
        payload: created,
      })
    );

    return created;
  }

  async updateBuilding(id: string, data: Partial<BuildingInsert>): Promise<BuildingSelect | null> {
    return stationsRepository.updateBuilding(id, data);
  }

  async deleteBuilding(id: string): Promise<boolean> {
    return stationsRepository.deleteBuilding(id);
  }

  // ── Rooms / Zones ──────────────────────────────────────────

  async getRooms(buildingId: string): Promise<RoomSelect[]> {
    return stationsRepository.findRoomsByBuildingId(buildingId);
  }

  async createRoom(data: RoomInsert): Promise<RoomSelect> {
    const created = await stationsRepository.createRoom(data);

    await eventBus.publish(
      createDomainEvent({
        eventType: EventType.ROOM_CREATED,
        source: 'stations-service',
        entityId: created.id,
        payload: created,
      })
    );

    return created;
  }

  async updateRoom(id: string, data: Partial<RoomInsert>): Promise<RoomSelect | null> {
    return stationsRepository.updateRoom(id, data);
  }

  async deleteRoom(id: string): Promise<boolean> {
    return stationsRepository.deleteRoom(id);
  }
}

export const stationsService = new StationsService();
