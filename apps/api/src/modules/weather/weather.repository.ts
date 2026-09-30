// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Weather Observations Repository
// ═══════════════════════════════════════════════════════════════
// Drizzle persistence layer for meteorological observations
// ═══════════════════════════════════════════════════════════════

import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { weatherObservations } from '../../db/schema/index.js';
import type { DataProvenance } from '@repo/shared';
import { resolveStationUuid } from '../../utils/index.js';

export type WeatherObservationInsert = typeof weatherObservations.$inferInsert;
export type WeatherObservationSelect = typeof weatherObservations.$inferSelect;

export interface FindWeatherObservationsFilter {
  stationId?: string;
  provenance?: DataProvenance;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export class WeatherRepository {
  async create(data: WeatherObservationInsert): Promise<WeatherObservationSelect> {
    const [record] = await db.insert(weatherObservations).values(data).returning();
    return record;
  }

  async createMany(data: WeatherObservationInsert[]): Promise<WeatherObservationSelect[]> {
    if (data.length === 0) return [];
    return db.insert(weatherObservations).values(data).returning();
  }

  async findLatestByStation(stationId: string): Promise<WeatherObservationSelect | null> {
    const resolvedStation = resolveStationUuid(stationId) ?? stationId;
    const [latest] = await db
      .select()
      .from(weatherObservations)
      .where(eq(weatherObservations.stationId, resolvedStation))
      .orderBy(desc(weatherObservations.recordedAt))
      .limit(1);

    return latest ?? null;
  }

  async findByStationAndRange(
    stationId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
  ): Promise<WeatherObservationSelect[]> {
    const resolvedStation = resolveStationUuid(stationId) ?? stationId;
    const conditions = [eq(weatherObservations.stationId, resolvedStation)];

    if (startDate) {
      conditions.push(gte(weatherObservations.recordedAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(weatherObservations.recordedAt, endDate));
    }

    return db
      .select()
      .from(weatherObservations)
      .where(and(...conditions))
      .orderBy(desc(weatherObservations.recordedAt))
      .limit(limit);
  }

  async findAll(
    filters?: FindWeatherObservationsFilter,
  ): Promise<{ data: WeatherObservationSelect[]; total: number }> {
    const conditions = [];

    const resolvedStation = resolveStationUuid(filters?.stationId);
    if (resolvedStation) {
      conditions.push(eq(weatherObservations.stationId, resolvedStation));
    }
    if (filters?.provenance) {
      conditions.push(eq(weatherObservations.provenance, filters.provenance));
    }
    if (filters?.startDate) {
      conditions.push(gte(weatherObservations.recordedAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(weatherObservations.recordedAt, filters.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
      db
        .select()
        .from(weatherObservations)
        .where(whereClause)
        .orderBy(desc(weatherObservations.recordedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(weatherObservations)
        .where(whereClause),
    ]);

    return {
      data,
      total: totalCount[0]?.count ?? 0,
    };
  }
}

export const weatherRepository = new WeatherRepository();
