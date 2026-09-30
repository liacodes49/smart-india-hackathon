// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Incidents Repository
// ═══════════════════════════════════════════════════════════════
// Drizzle persistence layer for operational incidents and alert escalations.
// ═══════════════════════════════════════════════════════════════

import { eq, and, sql, desc, ne } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { incidents } from '../../db/schema/index.js';
import type { IncidentSeverity, IncidentStatus } from '@repo/shared';
import { resolveStationUuid } from '../../utils/index.js';

export type IncidentInsert = typeof incidents.$inferInsert;
export type IncidentSelect = typeof incidents.$inferSelect;

export interface FindIncidentsFilter {
  stationId?: string;
  severity?: IncidentSeverity | string;
  status?: IncidentStatus | string;
  assignedTo?: string;
  sourceAlertId?: string;
  page?: number;
  limit?: number;
}

export class IncidentsRepository {
  async create(data: IncidentInsert): Promise<IncidentSelect> {
    const [record] = await db.insert(incidents).values(data).returning();
    return record;
  }

  async findById(id: string): Promise<IncidentSelect | null> {
    const [record] = await db.select().from(incidents).where(eq(incidents.id, id));
    return record ?? null;
  }

  async findActiveByAlertId(alertId: string): Promise<IncidentSelect | null> {
    const [record] = await db
      .select()
      .from(incidents)
      .where(and(eq(incidents.sourceAlertId, alertId), ne(incidents.status, 'CLOSED')))
      .orderBy(desc(incidents.createdAt))
      .limit(1);
    return record ?? null;
  }

  async findAll(filter?: FindIncidentsFilter): Promise<{ data: IncidentSelect[]; total: number }> {
    const conditions = [];

    const resolvedStation = resolveStationUuid(filter?.stationId);
    if (resolvedStation) {
      conditions.push(eq(incidents.stationId, resolvedStation));
    }
    if (filter?.severity) {
      conditions.push(eq(incidents.severity, filter.severity as any));
    }
    if (filter?.status) {
      conditions.push(eq(incidents.status, filter.status as any));
    }
    if (filter?.assignedTo) {
      conditions.push(eq(incidents.assignedTo, filter.assignedTo));
    }
    if (filter?.sourceAlertId) {
      conditions.push(eq(incidents.sourceAlertId, filter.sourceAlertId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const page = filter?.page ?? 1;
    const limit = filter?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [countResult] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(incidents)
      .where(whereClause);

    const data = await db
      .select()
      .from(incidents)
      .where(whereClause)
      .orderBy(desc(incidents.createdAt))
      .limit(limit)
      .offset(offset);

    return { data, total: countResult?.count ?? 0 };
  }

  async update(id: string, data: Partial<IncidentInsert>): Promise<IncidentSelect | null> {
    const [updated] = await db
      .update(incidents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(incidents.id, id))
      .returning();
    return updated ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(incidents).where(eq(incidents.id, id)).returning();
    return result.length > 0;
  }
}

export const incidentsRepository = new IncidentsRepository();
