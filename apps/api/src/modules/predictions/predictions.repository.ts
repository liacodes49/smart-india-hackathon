// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Predictions Repository
// ═══════════════════════════════════════════════════════════════

import { eq, and, desc, gte, sql } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { predictions } from '../../db/schema/index.js';
import type { PredictionType } from '@repo/shared';

export type PredictionInsert = typeof predictions.$inferInsert;
export type PredictionSelect = typeof predictions.$inferSelect;

export interface FindPredictionsFilter {
  stationId?: string;
  sensorId?: string;
  assetId?: string;
  type?: PredictionType;
  minConfidence?: number;
  page?: number;
  limit?: number;
}

function resolveStationId(id: string | undefined): string | undefined {
  if (!id) return undefined;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;
  const upper = id.toUpperCase();
  if (upper === 'MAITRI') return '00000000-0000-0000-0000-000000000001';
  if (upper === 'BHARATI') return '00000000-0000-0000-0000-000000000002';
  return id;
}

export class PredictionsRepository {
  async create(data: PredictionInsert): Promise<PredictionSelect> {
    const stationId = resolveStationId(data.stationId) ?? data.stationId;
    const [record] = await db
      .insert(predictions)
      .values({ ...data, stationId })
      .returning();
    return record!;
  }

  async createMany(data: PredictionInsert[]): Promise<PredictionSelect[]> {
    if (data.length === 0) return [];
    const sanitized = data.map((d) => ({
      ...d,
      stationId: resolveStationId(d.stationId) ?? d.stationId,
    }));
    return db.insert(predictions).values(sanitized).returning();
  }

  async findById(id: string): Promise<PredictionSelect | null> {
    const [record] = await db.select().from(predictions).where(eq(predictions.id, id)).limit(1);

    return record ?? null;
  }

  async findLatestByAsset(assetId: string): Promise<PredictionSelect | null> {
    const [record] = await db
      .select()
      .from(predictions)
      .where(eq(predictions.assetId, assetId))
      .orderBy(desc(predictions.predictedAt))
      .limit(1);

    return record ?? null;
  }

  async findLatestByStation(stationId: string, type?: PredictionType): Promise<PredictionSelect[]> {
    const resolvedStation = resolveStationId(stationId) ?? stationId;
    const conditions = [eq(predictions.stationId, resolvedStation)];
    if (type) {
      conditions.push(eq(predictions.type, type));
    }

    return db
      .select()
      .from(predictions)
      .where(and(...conditions))
      .orderBy(desc(predictions.predictedAt))
      .limit(20);
  }

  async findAll(
    filters?: FindPredictionsFilter,
  ): Promise<{ data: PredictionSelect[]; total: number }> {
    const conditions = [];

    if (filters?.stationId) {
      const resolvedStation = resolveStationId(filters.stationId);
      if (resolvedStation) {
        conditions.push(eq(predictions.stationId, resolvedStation));
      }
    }
    if (filters?.sensorId) {
      conditions.push(eq(predictions.sensorId, filters.sensorId));
    }
    if (filters?.assetId) {
      conditions.push(eq(predictions.assetId, filters.assetId));
    }
    if (filters?.type) {
      conditions.push(eq(predictions.type, filters.type));
    }
    if (filters?.minConfidence !== undefined) {
      conditions.push(gte(predictions.confidence, filters.minConfidence));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
      db
        .select()
        .from(predictions)
        .where(whereClause)
        .orderBy(desc(predictions.predictedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(predictions)
        .where(whereClause),
    ]);

    return {
      data,
      total: totalCount[0]?.count ?? 0,
    };
  }
}

export const predictionsRepository = new PredictionsRepository();
