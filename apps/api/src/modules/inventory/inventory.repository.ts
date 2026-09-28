// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Inventory Repository
// ═══════════════════════════════════════════════════════════════
// Drizzle persistence layer for station consumables, stockpiles,
// and consumption auditing.
// ═══════════════════════════════════════════════════════════════

import { eq, and, sql, desc, lt } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { inventoryItems, resourceConsumption } from '../../db/schema/index.js';
import type { InventoryCategory } from '@repo/shared';

export type InventoryItemInsert = typeof inventoryItems.$inferInsert;
export type InventoryItemSelect = typeof inventoryItems.$inferSelect;
export type ResourceConsumptionInsert = typeof resourceConsumption.$inferInsert;
export type ResourceConsumptionSelect = typeof resourceConsumption.$inferSelect;

export interface FindInventoryFilter {
  stationId?: string;
  category?: InventoryCategory;
  lowStockOnly?: boolean;
  page?: number;
  limit?: number;
}

export class InventoryRepository {
  async findAll(filters?: FindInventoryFilter): Promise<{ data: InventoryItemSelect[]; total: number }> {
    const conditions = [];

    if (filters?.stationId) {
      conditions.push(eq(inventoryItems.stationId, filters.stationId));
    }
    if (filters?.category) {
      conditions.push(eq(inventoryItems.category, filters.category));
    }
    if (filters?.lowStockOnly) {
      conditions.push(lt(inventoryItems.currentStock, inventoryItems.minimumThreshold));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const offset = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
      db
        .select()
        .from(inventoryItems)
        .where(whereClause)
        .orderBy(desc(inventoryItems.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(inventoryItems)
        .where(whereClause),
    ]);

    return {
      data,
      total: totalCount[0]?.count ?? 0,
    };
  }

  async findById(id: string): Promise<InventoryItemSelect | null> {
    const rows = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async findByCode(code: string): Promise<InventoryItemSelect | null> {
    const rows = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.code, code.toUpperCase().trim()))
      .limit(1);
    return rows[0] ?? null;
  }

  async create(data: InventoryItemInsert): Promise<InventoryItemSelect> {
    const [created] = await db
      .insert(inventoryItems)
      .values({
        ...data,
        code: data.code.toUpperCase().trim(),
      })
      .returning();
    return created;
  }

  async update(id: string, data: Partial<InventoryItemInsert>): Promise<InventoryItemSelect | null> {
    const [updated] = await db
      .update(inventoryItems)
      .set({
        ...data,
        code: data.code ? data.code.toUpperCase().trim() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, id))
      .returning();
    return updated ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await db.delete(inventoryItems).where(eq(inventoryItems.id, id)).returning();
    return deleted.length > 0;
  }

  /**
   * Atomic stock adjustment with strict negative stock prevention.
   * Returns updated item, or null if insufficient stock.
   */
  async adjustStock(id: string, delta: number): Promise<InventoryItemSelect | null> {
    const [updated] = await db
      .update(inventoryItems)
      .set({
        currentStock: sql`${inventoryItems.currentStock} + ${delta}`,
        updatedAt: new Date(),
      })
      .where(and(eq(inventoryItems.id, id), sql`${inventoryItems.currentStock} + ${delta} >= 0`))
      .returning();

    return updated ?? null;
  }

  async recordConsumption(data: ResourceConsumptionInsert): Promise<ResourceConsumptionSelect> {
    const [created] = await db.insert(resourceConsumption).values(data).returning();
    return created;
  }

  async getConsumptionHistory(inventoryItemId: string, limit = 50): Promise<ResourceConsumptionSelect[]> {
    return db
      .select()
      .from(resourceConsumption)
      .where(eq(resourceConsumption.inventoryItemId, inventoryItemId))
      .orderBy(desc(resourceConsumption.loggedAt))
      .limit(limit);
  }

  async findLowStock(stationId: string): Promise<InventoryItemSelect[]> {
    return db
      .select()
      .from(inventoryItems)
      .where(
        and(
          eq(inventoryItems.stationId, stationId),
          lt(inventoryItems.currentStock, inventoryItems.minimumThreshold)
        )
      );
  }
}

export const inventoryRepository = new InventoryRepository();
