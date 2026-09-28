// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Edge Repository
// ═══════════════════════════════════════════════════════════════
// Drizzle persistence layer for edge outbox buffering and sync batches.
// ═══════════════════════════════════════════════════════════════

import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../config/database.js';
import {
  edgeSyncBatches,
  edgeOutbox,
  type EdgeSyncBatchRecord,
  type InsertEdgeSyncBatch,
  type EdgeOutboxTableRecord,
  type InsertEdgeOutboxRecord,
} from '../../db/schema/index.js';
import type { SyncStatus } from '@repo/shared';

export interface FindEdgeBatchesFilter {
  stationId?: string;
  status?: SyncStatus;
  page?: number;
  limit?: number;
}

export class EdgeRepository {
  // ── Sync Batches ─────────────────────────────────────────────

  async createSyncBatch(data: InsertEdgeSyncBatch): Promise<EdgeSyncBatchRecord> {
    const [record] = await db.insert(edgeSyncBatches).values(data).returning();
    return record;
  }

  async findBatchByIdempotencyKey(idempotencyKey: string): Promise<EdgeSyncBatchRecord | null> {
    const [record] = await db
      .select()
      .from(edgeSyncBatches)
      .where(eq(edgeSyncBatches.idempotencyKey, idempotencyKey));
    return record ?? null;
  }

  async findBatchById(id: string): Promise<EdgeSyncBatchRecord | null> {
    const [record] = await db
      .select()
      .from(edgeSyncBatches)
      .where(eq(edgeSyncBatches.id, id));
    return record ?? null;
  }

  async updateBatchStatus(
    id: string,
    update: Partial<InsertEdgeSyncBatch>
  ): Promise<EdgeSyncBatchRecord | null> {
    const [record] = await db
      .update(edgeSyncBatches)
      .set(update)
      .where(eq(edgeSyncBatches.id, id))
      .returning();
    return record ?? null;
  }

  async listBatchesByStation(
    filter: FindEdgeBatchesFilter
  ): Promise<{ data: EdgeSyncBatchRecord[]; total: number }> {
    const conditions = [];
    if (filter.stationId) {
      conditions.push(eq(edgeSyncBatches.stationId, filter.stationId));
    }
    if (filter.status) {
      conditions.push(eq(edgeSyncBatches.status, filter.status as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const offset = (page - 1) * limit;

    const data = await db
      .select()
      .from(edgeSyncBatches)
      .where(whereClause)
      .orderBy(desc(edgeSyncBatches.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(edgeSyncBatches)
      .where(whereClause);

    return { data, total: Number(count) };
  }

  // ── Outbox ───────────────────────────────────────────────────

  async enqueueOutbox(data: InsertEdgeOutboxRecord): Promise<EdgeOutboxTableRecord> {
    const [record] = await db.insert(edgeOutbox).values(data).returning();
    return record;
  }

  async findOutboxByIdempotencyKey(idempotencyKey: string): Promise<EdgeOutboxTableRecord | null> {
    const [record] = await db
      .select()
      .from(edgeOutbox)
      .where(eq(edgeOutbox.idempotencyKey, idempotencyKey));
    return record ?? null;
  }

  async listOutbox(
    stationId: string,
    status?: SyncStatus
  ): Promise<EdgeOutboxTableRecord[]> {
    const conditions = [eq(edgeOutbox.stationId, stationId)];
    if (status) {
      conditions.push(eq(edgeOutbox.status, status as any));
    }

    return db
      .select()
      .from(edgeOutbox)
      .where(and(...conditions))
      .orderBy(edgeOutbox.sequenceNumber);
  }

  async updateOutboxStatus(
    id: string,
    status: SyncStatus,
    lastError?: string
  ): Promise<EdgeOutboxTableRecord | null> {
    const update: Record<string, unknown> = { status: status as any };
    if (status === 'SYNCED') {
      update.syncedAt = new Date();
    }
    if (lastError !== undefined) {
      update.lastError = lastError;
      update.retryCount = sql`${edgeOutbox.retryCount} + 1`;
    }

    const [record] = await db
      .update(edgeOutbox)
      .set(update)
      .where(eq(edgeOutbox.id, id))
      .returning();
    return record ?? null;
  }
}

export const edgeRepository = new EdgeRepository();
