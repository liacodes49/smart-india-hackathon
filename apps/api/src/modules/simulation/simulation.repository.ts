// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Simulations Repository
// ═══════════════════════════════════════════════════════════════
// Drizzle persistence layer for simulation scenario records & results.
// ═══════════════════════════════════════════════════════════════

import { eq, and, sql, desc } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { simulations } from '../../db/schema/index.js';
import type { SimulationType, SimulationStatus } from '@repo/shared';

export type SimulationInsert = typeof simulations.$inferInsert;
export type SimulationSelect = typeof simulations.$inferSelect;

export interface FindSimulationsFilter {
  stationId?: string;
  type?: SimulationType | string;
  status?: SimulationStatus | string;
  page?: number;
  limit?: number;
}

export class SimulationRepository {
  async create(data: SimulationInsert): Promise<SimulationSelect> {
    const [record] = await db.insert(simulations).values(data).returning();
    return record;
  }

  async findById(id: string): Promise<SimulationSelect | null> {
    const [record] = await db.select().from(simulations).where(eq(simulations.id, id));
    return record ?? null;
  }

  async findAll(filter?: FindSimulationsFilter): Promise<{ data: SimulationSelect[]; total: number }> {
    const conditions = [];

    if (filter?.stationId) {
      conditions.push(eq(simulations.stationId, filter.stationId));
    }
    if (filter?.type) {
      conditions.push(eq(simulations.type, filter.type as any));
    }
    if (filter?.status) {
      conditions.push(eq(simulations.status, filter.status as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const page = filter?.page ?? 1;
    const limit = filter?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [countResult] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(simulations)
      .where(whereClause);

    const data = await db
      .select()
      .from(simulations)
      .where(whereClause)
      .orderBy(desc(simulations.createdAt))
      .limit(limit)
      .offset(offset);

    return { data, total: countResult?.count ?? 0 };
  }

  async update(id: string, data: Partial<SimulationInsert>): Promise<SimulationSelect | null> {
    const [updated] = await db
      .update(simulations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(simulations.id, id))
      .returning();
    return updated ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(simulations).where(eq(simulations.id, id)).returning();
    return result.length > 0;
  }
}

export const simulationRepository = new SimulationRepository();
