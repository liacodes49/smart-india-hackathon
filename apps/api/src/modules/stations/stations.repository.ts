// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Stations Repository
// ═══════════════════════════════════════════════════════════════
// Persistence layer for stations, buildings, and rooms
// ═══════════════════════════════════════════════════════════════

import { eq, or } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { stations, buildings, rooms } from '../../db/schema/index.js';

export type StationInsert = typeof stations.$inferInsert;
export type StationSelect = typeof stations.$inferSelect;
export type BuildingInsert = typeof buildings.$inferInsert;
export type BuildingSelect = typeof buildings.$inferSelect;
export type RoomInsert = typeof rooms.$inferInsert;
export type RoomSelect = typeof rooms.$inferSelect;

export interface StationHierarchy extends StationSelect {
  buildings: (BuildingSelect & {
    rooms: RoomSelect[];
  })[];
}

export class StationsRepository {
  // ── Stations ───────────────────────────────────────────────

  async findAll(): Promise<StationSelect[]> {
    return db.select().from(stations);
  }

  async findById(idOrCode: string): Promise<StationSelect | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrCode);
    if (isUuid) {
      const rows = await db
        .select()
        .from(stations)
        .where(or(eq(stations.id, idOrCode), eq(stations.stationId, idOrCode.toUpperCase())))
        .limit(1);
      return rows[0] ?? null;
    }

    const rows = await db
      .select()
      .from(stations)
      .where(eq(stations.stationId, idOrCode.toUpperCase()))
      .limit(1);
    return rows[0] ?? null;
  }

  async findHierarchy(idOrCode: string): Promise<StationHierarchy | null> {
    const station = await this.findById(idOrCode);
    if (!station) return null;

    const stationBuildings = await db
      .select()
      .from(buildings)
      .where(eq(buildings.stationId, station.id));

    const buildingsWithRooms = await Promise.all(
      stationBuildings.map(async (b) => {
        const buildingRooms = await db
          .select()
          .from(rooms)
          .where(eq(rooms.buildingId, b.id));
        return {
          ...b,
          rooms: buildingRooms,
        };
      })
    );

    return {
      ...station,
      buildings: buildingsWithRooms,
    };
  }

  async create(data: StationInsert): Promise<StationSelect> {
    const [created] = await db
      .insert(stations)
      .values({
        ...data,
        stationId: data.stationId.toUpperCase(),
      })
      .returning();
    return created;
  }

  async update(id: string, data: Partial<StationInsert>): Promise<StationSelect | null> {
    const [updated] = await db
      .update(stations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(stations.id, id))
      .returning();
    return updated ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await db.delete(stations).where(eq(stations.id, id)).returning();
    return deleted.length > 0;
  }

  // ── Buildings ──────────────────────────────────────────────

  async findBuildingsByStationId(stationId: string): Promise<BuildingSelect[]> {
    return db.select().from(buildings).where(eq(buildings.stationId, stationId));
  }

  async findBuildingById(id: string): Promise<BuildingSelect | null> {
    const rows = await db.select().from(buildings).where(eq(buildings.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async createBuilding(data: BuildingInsert): Promise<BuildingSelect> {
    const [created] = await db.insert(buildings).values(data).returning();
    return created;
  }

  async updateBuilding(id: string, data: Partial<BuildingInsert>): Promise<BuildingSelect | null> {
    const [updated] = await db
      .update(buildings)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(buildings.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteBuilding(id: string): Promise<boolean> {
    const deleted = await db.delete(buildings).where(eq(buildings.id, id)).returning();
    return deleted.length > 0;
  }

  // ── Rooms ──────────────────────────────────────────────────

  async findRoomsByBuildingId(buildingId: string): Promise<RoomSelect[]> {
    return db.select().from(rooms).where(eq(rooms.buildingId, buildingId));
  }

  async findRoomById(id: string): Promise<RoomSelect | null> {
    const rows = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async createRoom(data: RoomInsert): Promise<RoomSelect> {
    const [created] = await db.insert(rooms).values(data).returning();
    return created;
  }

  async updateRoom(id: string, data: Partial<RoomInsert>): Promise<RoomSelect | null> {
    const [updated] = await db
      .update(rooms)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(rooms.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteRoom(id: string): Promise<boolean> {
    const deleted = await db.delete(rooms).where(eq(rooms.id, id)).returning();
    return deleted.length > 0;
  }
}

export const stationsRepository = new StationsRepository();
