// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Sensors Repository
// ═══════════════════════════════════════════════════════════════
// Drizzle persistence layer for sensors and telemetry thresholds
// ═══════════════════════════════════════════════════════════════

import { eq, and, sql, lt } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { sensors, assets } from '../../db/schema/index.js';
import type { SensorType, SensorStatus } from '@repo/shared';

export type SensorInsert = typeof sensors.$inferInsert;
export type SensorSelect = typeof sensors.$inferSelect;

export interface FindSensorsFilter {
  stationId?: string;
  assetId?: string;
  type?: SensorType;
  status?: SensorStatus;
  page?: number;
  limit?: number;
}

export class SensorsRepository {
  async findAll(filters?: FindSensorsFilter): Promise<{ data: SensorSelect[]; total: number }> {
    const conditions = [];

    if (filters?.stationId) {
      conditions.push(eq(sensors.stationId, filters.stationId));
    }
    if (filters?.assetId) {
      conditions.push(eq(sensors.assetId, filters.assetId));
    }
    if (filters?.type) {
      conditions.push(eq(sensors.type, filters.type));
    }
    if (filters?.status) {
      conditions.push(eq(sensors.status, filters.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const offset = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
      db
        .select()
        .from(sensors)
        .where(whereClause)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(sensors)
        .where(whereClause),
    ]);

    return {
      data,
      total: totalCount[0]?.count ?? 0,
    };
  }

  async findById(id: string): Promise<SensorSelect | null> {
    const rows = await db.select().from(sensors).where(eq(sensors.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async findByAssetId(assetId: string): Promise<SensorSelect[]> {
    return db.select().from(sensors).where(eq(sensors.assetId, assetId));
  }

  async create(data: SensorInsert): Promise<SensorSelect> {
    const [created] = await db.insert(sensors).values(data).returning();
    return created;
  }

  async update(id: string, data: Partial<SensorInsert>): Promise<SensorSelect | null> {
    const [updated] = await db
      .update(sensors)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(sensors.id, id))
      .returning();
    return updated ?? null;
  }

  async updateReading(
    id: string,
    value: number,
    status: SensorStatus,
    timestamp: Date
  ): Promise<SensorSelect | null> {
    const [updated] = await db
      .update(sensors)
      .set({
        lastReading: value,
        status,
        lastReadingAt: timestamp,
        updatedAt: new Date(),
      })
      .where(eq(sensors.id, id))
      .returning();
    return updated ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await db.delete(sensors).where(eq(sensors.id, id)).returning();
    return deleted.length > 0;
  }

  async findStaleSensors(cutoff: Date): Promise<SensorSelect[]> {
    return db
      .select()
      .from(sensors)
      .where(and(lt(sensors.lastReadingAt, cutoff), sql`${sensors.status} != 'OFFLINE'`));
  }

  async validateAssetAssociation(assetId: string, stationId: string): Promise<boolean> {
    const rows = await db
      .select()
      .from(assets)
      .where(and(eq(assets.id, assetId), eq(assets.stationId, stationId)))
      .limit(1);
    return rows.length > 0;
  }
}

export const sensorsRepository = new SensorsRepository();
