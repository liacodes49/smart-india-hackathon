// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Alerts Repository
// ═══════════════════════════════════════════════════════════════
// Drizzle persistence layer for active & historical station alerts
// ═══════════════════════════════════════════════════════════════

import { eq, and, sql, desc } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { alerts, users } from '../../db/schema/index.js';
import type { AlertSeverity, AlertStatus, AlertCategory } from '@repo/shared';

export type AlertInsert = typeof alerts.$inferInsert;
export type AlertSelect = typeof alerts.$inferSelect;

export interface FindAlertsFilter {
  stationId?: string;
  sensorId?: string;
  assetId?: string;
  severity?: AlertSeverity;
  status?: AlertStatus;
  category?: AlertCategory;
  page?: number;
  limit?: number;
}

export class AlertsRepository {
  private async resolveValidUserId(userId?: string): Promise<string | null> {
    if (userId) {
      const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
      if (existingUser.length > 0) {
        return existingUser[0].id;
      }
    }
    const firstUser = await db.select({ id: users.id }).from(users).limit(1);
    return firstUser[0]?.id ?? null;
  }

  async findAll(filters?: FindAlertsFilter): Promise<{ data: AlertSelect[]; total: number }> {
    const conditions = [];

    if (filters?.stationId) {
      conditions.push(eq(alerts.stationId, filters.stationId));
    }
    if (filters?.sensorId) {
      conditions.push(eq(alerts.sensorId, filters.sensorId));
    }
    if (filters?.assetId) {
      conditions.push(eq(alerts.assetId, filters.assetId));
    }
    if (filters?.severity) {
      conditions.push(eq(alerts.severity, filters.severity));
    }
    if (filters?.status) {
      conditions.push(eq(alerts.status, filters.status));
    }
    if (filters?.category) {
      conditions.push(eq(alerts.category, filters.category));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const offset = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
      db
        .select()
        .from(alerts)
        .where(whereClause)
        .orderBy(desc(alerts.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(alerts)
        .where(whereClause),
    ]);

    return {
      data,
      total: totalCount[0]?.count ?? 0,
    };
  }

  async findById(id: string): Promise<AlertSelect | null> {
    const rows = await db.select().from(alerts).where(eq(alerts.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async findActiveBySensor(sensorId: string): Promise<AlertSelect | null> {
    const rows = await db
      .select()
      .from(alerts)
      .where(and(eq(alerts.sensorId, sensorId), eq(alerts.status, 'ACTIVE')))
      .orderBy(desc(alerts.createdAt))
      .limit(1);
    return rows[0] ?? null;
  }

  async create(data: AlertInsert): Promise<AlertSelect> {
    const [created] = await db.insert(alerts).values(data).returning();
    return created;
  }

  async update(id: string, data: Partial<AlertInsert>): Promise<AlertSelect | null> {
    const [updated] = await db
      .update(alerts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(alerts.id, id))
      .returning();
    return updated ?? null;
  }

  async acknowledge(id: string, userId?: string, notes?: string): Promise<AlertSelect | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const validUserId = await this.resolveValidUserId(userId);

    const metadata = {
      ...(existing.metadata as Record<string, unknown> ?? {}),
      acknowledgementNotes: notes,
    };

    const [updated] = await db
      .update(alerts)
      .set({
        status: 'ACKNOWLEDGED',
        acknowledgedBy: validUserId,
        acknowledgedAt: new Date(),
        metadata,
        updatedAt: new Date(),
      })
      .where(eq(alerts.id, id))
      .returning();
    return updated ?? null;
  }

  async resolve(id: string, userId?: string, notes?: string): Promise<AlertSelect | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const validUserId = await this.resolveValidUserId(userId);

    const metadata = {
      ...(existing.metadata as Record<string, unknown> ?? {}),
      resolutionNotes: notes,
    };

    const [updated] = await db
      .update(alerts)
      .set({
        status: 'RESOLVED',
        resolvedBy: validUserId,
        resolvedAt: new Date(),
        metadata,
        updatedAt: new Date(),
      })
      .where(eq(alerts.id, id))
      .returning();
    return updated ?? null;
  }
}

export const alertsRepository = new AlertsRepository();
