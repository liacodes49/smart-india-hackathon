// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Assets Repository
// ═══════════════════════════════════════════════════════════════
// Drizzle persistence layer for physical assets and hierarchy check
// ═══════════════════════════════════════════════════════════════

import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { assets, buildings, rooms, stations } from '../../db/schema/index.js';
import type { AssetCategory, AssetCriticality, SensorStatus } from '@repo/shared';

export type AssetInsert = typeof assets.$inferInsert;
export type AssetSelect = typeof assets.$inferSelect;

export interface FindAssetsFilter {
  stationId?: string;
  buildingId?: string;
  roomId?: string;
  category?: AssetCategory;
  criticality?: AssetCriticality;
  status?: SensorStatus;
  page?: number;
  limit?: number;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class AssetsRepository {
  async findAll(filters?: FindAssetsFilter): Promise<{ data: AssetSelect[]; total: number }> {
    const conditions = [];

    if (filters?.stationId && UUID_REGEX.test(filters.stationId)) {
      conditions.push(eq(assets.stationId, filters.stationId));
    }
    if (filters?.buildingId && UUID_REGEX.test(filters.buildingId)) {
      conditions.push(eq(assets.buildingId, filters.buildingId));
    }
    if (filters?.roomId && UUID_REGEX.test(filters.roomId)) {
      conditions.push(eq(assets.roomId, filters.roomId));
    }
    if (filters?.category) {
      conditions.push(eq(assets.category, filters.category));
    }
    if (filters?.criticality) {
      conditions.push(eq(assets.criticality, filters.criticality));
    }
    if (filters?.status) {
      conditions.push(eq(assets.status, filters.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const offset = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
      db.select().from(assets).where(whereClause).limit(limit).offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(assets)
        .where(whereClause),
    ]);

    return {
      data,
      total: totalCount[0]?.count ?? 0,
    };
  }

  async findById(id: string): Promise<AssetSelect | null> {
    if (!id || !UUID_REGEX.test(id)) return null;
    const rows = await db.select().from(assets).where(eq(assets.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async findByCode(code: string): Promise<AssetSelect | null> {
    const rows = await db
      .select()
      .from(assets)
      .where(eq(assets.code, code.toUpperCase().trim()))
      .limit(1);
    return rows[0] ?? null;
  }

  async create(data: AssetInsert): Promise<AssetSelect> {
    const [created] = await db
      .insert(assets)
      .values({
        ...data,
        code: data.code.toUpperCase().trim(),
      })
      .returning();
    return created;
  }

  async update(id: string, data: Partial<AssetInsert>): Promise<AssetSelect | null> {
    if (!id || !UUID_REGEX.test(id)) return null;
    const [updated] = await db
      .update(assets)
      .set({
        ...data,
        code: data.code ? data.code.toUpperCase().trim() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(assets.id, id))
      .returning();
    return updated ?? null;
  }

  async delete(id: string): Promise<boolean> {
    if (!id || !UUID_REGEX.test(id)) return false;
    const deleted = await db.delete(assets).where(eq(assets.id, id)).returning();
    return deleted.length > 0;
  }

  /**
   * Validate physical hierarchy:
   * 1. Station must exist.
   * 2. If buildingId is provided, building must exist and belong to stationId.
   * 3. If roomId is provided, room must exist, buildingId must be provided, and room must belong to buildingId.
   */
  async validateHierarchy(
    stationId: string,
    buildingId?: string | null,
    roomId?: string | null,
  ): Promise<{ valid: boolean; error?: string }> {
    const station = await db.select().from(stations).where(eq(stations.id, stationId)).limit(1);
    if (!station[0]) {
      return { valid: false, error: `Station with ID '${stationId}' does not exist` };
    }

    if (buildingId) {
      const building = await db
        .select()
        .from(buildings)
        .where(eq(buildings.id, buildingId))
        .limit(1);
      if (!building[0]) {
        return { valid: false, error: `Building with ID '${buildingId}' does not exist` };
      }
      if (building[0].stationId !== stationId) {
        return {
          valid: false,
          error: `Building '${buildingId}' does not belong to Station '${stationId}'`,
        };
      }
    }

    if (roomId) {
      if (!buildingId) {
        return { valid: false, error: 'A roomId cannot be assigned without a valid buildingId' };
      }
      const room = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
      if (!room[0]) {
        return { valid: false, error: `Room with ID '${roomId}' does not exist` };
      }
      if (room[0].buildingId !== buildingId) {
        return {
          valid: false,
          error: `Room '${roomId}' does not belong to Building '${buildingId}'`,
        };
      }
    }

    return { valid: true };
  }
}

export const assetsRepository = new AssetsRepository();
