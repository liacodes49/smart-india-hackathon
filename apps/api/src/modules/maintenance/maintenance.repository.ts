// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Maintenance Records Repository
// ═══════════════════════════════════════════════════════════════

import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { maintenanceRecords } from '../../db/schema/index.js';
import type { MaintenanceType, MaintenancePriority, MaintenanceStatus } from '@repo/shared';

export type MaintenanceRecordInsert = typeof maintenanceRecords.$inferInsert;
export type MaintenanceRecordSelect = typeof maintenanceRecords.$inferSelect;

export interface FindMaintenanceFilter {
  stationId?: string;
  assetId?: string;
  type?: MaintenanceType;
  priority?: MaintenancePriority;
  status?: MaintenanceStatus;
  page?: number;
  limit?: number;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class MaintenanceRepository {
  async create(data: MaintenanceRecordInsert): Promise<MaintenanceRecordSelect> {
    const [record] = await db.insert(maintenanceRecords).values(data).returning();
    return record!;
  }

  async findById(id: string): Promise<MaintenanceRecordSelect | null> {
    if (!id || !UUID_REGEX.test(id)) return null;
    const [record] = await db
      .select()
      .from(maintenanceRecords)
      .where(eq(maintenanceRecords.id, id))
      .limit(1);

    return record ?? null;
  }

  async findActiveRecommendation(assetId: string): Promise<MaintenanceRecordSelect | null> {
    if (!assetId || !UUID_REGEX.test(assetId)) return null;
    const [record] = await db
      .select()
      .from(maintenanceRecords)
      .where(
        and(
          eq(maintenanceRecords.assetId, assetId),
          inArray(maintenanceRecords.status, ['RECOMMENDED', 'PENDING']),
        ),
      )
      .limit(1);

    return record ?? null;
  }

  async update(
    id: string,
    data: Partial<MaintenanceRecordInsert>,
  ): Promise<MaintenanceRecordSelect | null> {
    if (!id || !UUID_REGEX.test(id)) return null;
    const [record] = await db
      .update(maintenanceRecords)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(maintenanceRecords.id, id))
      .returning();

    return record ?? null;
  }

  async findAll(
    filters?: FindMaintenanceFilter,
  ): Promise<{ data: MaintenanceRecordSelect[]; total: number }> {
    const conditions = [];

    if (filters?.stationId && UUID_REGEX.test(filters.stationId)) {
      conditions.push(eq(maintenanceRecords.stationId, filters.stationId));
    }
    if (filters?.assetId && UUID_REGEX.test(filters.assetId)) {
      conditions.push(eq(maintenanceRecords.assetId, filters.assetId));
    }
    if (filters?.type) {
      conditions.push(eq(maintenanceRecords.type, filters.type));
    }
    if (filters?.priority) {
      conditions.push(eq(maintenanceRecords.priority, filters.priority));
    }
    if (filters?.status) {
      conditions.push(eq(maintenanceRecords.status, filters.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
      db
        .select()
        .from(maintenanceRecords)
        .where(whereClause)
        .orderBy(desc(maintenanceRecords.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(maintenanceRecords)
        .where(whereClause),
    ]);

    return {
      data,
      total: totalCount[0]?.count ?? 0,
    };
  }
}

export const maintenanceRepository = new MaintenanceRepository();
