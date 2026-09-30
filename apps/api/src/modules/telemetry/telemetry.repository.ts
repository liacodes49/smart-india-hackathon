// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Telemetry Repository
// ═══════════════════════════════════════════════════════════════
// High-throughput time-series persistence, bulk batch insertion,
// deterministic idempotency, and rolling window aggregations.
// ═══════════════════════════════════════════════════════════════

import { eq, and, sql, gte, lte, desc, asc } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { telemetry, sensors } from '../../db/schema/index.js';
import type { SensorStatus } from '@repo/shared';

export type TelemetryInsert = typeof telemetry.$inferInsert;
export type TelemetrySelect = typeof telemetry.$inferSelect;

export interface FindTelemetryFilter {
  stationId?: string;
  sensorId?: string;
  assetId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: SensorStatus;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface RollingStatsAggregate {
  min: number | null;
  max: number | null;
  avg: number | null;
  count: number;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class TelemetryRepository {
  /**
   * Deterministic idempotent insertion.
   * If a packet with (sensorId, timestamp) was already received, does nothing.
   */
  async create(data: TelemetryInsert): Promise<TelemetrySelect | null> {
    const [inserted] = await db
      .insert(telemetry)
      .values(data)
      .onConflictDoNothing({
        target: [telemetry.sensorId, telemetry.timestamp],
      })
      .returning();

    return inserted ?? null;
  }

  async findBySensorAndTimestamp(
    sensorId: string,
    timestamp: Date,
  ): Promise<TelemetrySelect | null> {
    const rows = await db
      .select()
      .from(telemetry)
      .where(and(eq(telemetry.sensorId, sensorId), eq(telemetry.timestamp, timestamp)))
      .limit(1);
    return rows[0] ?? null;
  }

  /**
   * High-frequency batch insertion.
   * Uses ON CONFLICT DO NOTHING for atomic idempotent bulk load.
   */
  async createBatch(readings: TelemetryInsert[]): Promise<TelemetrySelect[]> {
    if (readings.length === 0) return [];

    return db
      .insert(telemetry)
      .values(readings)
      .onConflictDoNothing({
        target: [telemetry.sensorId, telemetry.timestamp],
      })
      .returning();
  }

  async findAll(
    filters?: FindTelemetryFilter,
  ): Promise<{ data: TelemetrySelect[]; total: number }> {
    const conditions = [];

    if (filters?.stationId && UUID_REGEX.test(filters.stationId)) {
      conditions.push(eq(telemetry.stationId, filters.stationId));
    }
    if (filters?.sensorId && UUID_REGEX.test(filters.sensorId)) {
      conditions.push(eq(telemetry.sensorId, filters.sensorId));
    }
    if (filters?.startDate) {
      conditions.push(gte(telemetry.timestamp, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(telemetry.timestamp, filters.endDate));
    }
    if (filters?.status) {
      conditions.push(eq(telemetry.status, filters.status));
    }

    // If assetId filter is requested, join to sensors table
    if (filters?.assetId && UUID_REGEX.test(filters.assetId)) {
      const assetSensors = await db
        .select({ id: sensors.id })
        .from(sensors)
        .where(eq(sensors.assetId, filters.assetId));
      const sensorIds = assetSensors.map((s) => s.id);
      if (sensorIds.length === 0) {
        return { data: [], total: 0 };
      }
      conditions.push(sql`${telemetry.sensorId} IN ${sensorIds}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const offset = (page - 1) * limit;
    const orderDirection =
      filters?.order === 'asc' ? asc(telemetry.timestamp) : desc(telemetry.timestamp);

    const [data, totalCount] = await Promise.all([
      db
        .select()
        .from(telemetry)
        .where(whereClause)
        .orderBy(orderDirection)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(telemetry)
        .where(whereClause),
    ]);

    return {
      data,
      total: totalCount[0]?.count ?? 0,
    };
  }

  async findById(id: string): Promise<TelemetrySelect | null> {
    if (!id || !UUID_REGEX.test(id)) return null;
    const rows = await db.select().from(telemetry).where(eq(telemetry.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async getLatestBySensor(sensorId: string): Promise<TelemetrySelect | null> {
    if (!sensorId || !UUID_REGEX.test(sensorId)) return null;
    const rows = await db
      .select()
      .from(telemetry)
      .where(eq(telemetry.sensorId, sensorId))
      .orderBy(desc(telemetry.timestamp))
      .limit(1);
    return rows[0] ?? null;
  }

  /**
   * Database SQL aggregation across any historical time window.
   */
  async getRollingStats(sensorId: string, from: Date, to: Date): Promise<RollingStatsAggregate> {
    const [row] = await db
      .select({
        min: sql<number | null>`min(${telemetry.value})::float`,
        max: sql<number | null>`max(${telemetry.value})::float`,
        avg: sql<number | null>`avg(${telemetry.value})::float`,
        count: sql<number>`count(*)::int`,
      })
      .from(telemetry)
      .where(
        and(
          eq(telemetry.sensorId, sensorId),
          gte(telemetry.timestamp, from),
          lte(telemetry.timestamp, to),
        ),
      );

    return {
      min: row?.min !== null && row?.min !== undefined ? Number(row.min.toFixed(2)) : null,
      max: row?.max !== null && row?.max !== undefined ? Number(row.max.toFixed(2)) : null,
      avg: row?.avg !== null && row?.avg !== undefined ? Number(row.avg.toFixed(2)) : null,
      count: row?.count ?? 0,
    };
  }
}

export const telemetryRepository = new TelemetryRepository();
