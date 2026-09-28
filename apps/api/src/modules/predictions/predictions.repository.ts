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

export class PredictionsRepository {
  async create(data: PredictionInsert): Promise<PredictionSelect> {
    const [record] = await db.insert(predictions).values(data).returning();
    return record!;
  }

  async createMany(data: PredictionInsert[]): Promise<PredictionSelect[]> {
    if (data.length === 0) return [];
    return db.insert(predictions).values(data).returning();
  }

  async findById(id: string): Promise<PredictionSelect | null> {
    const [record] = await db
      .select()
      .from(predictions)
      .where(eq(predictions.id, id))
      .limit(1);

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

  async findLatestByStation(
    stationId: string,
    type?: PredictionType
  ): Promise<PredictionSelect[]> {
    const conditions = [eq(predictions.stationId, stationId)];
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
    filters?: FindPredictionsFilter
  ): Promise<{ data: PredictionSelect[]; total: number }> {
    const conditions = [];

    if (filters?.stationId) {
      conditions.push(eq(predictions.stationId, filters.stationId));
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
