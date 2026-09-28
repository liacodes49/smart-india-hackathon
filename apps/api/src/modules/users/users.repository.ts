// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Users Repository
// ═══════════════════════════════════════════════════════════════
// Persistence layer for users table using Drizzle ORM
// ═══════════════════════════════════════════════════════════════

import { eq, and } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { users } from '../../db/schema/index.js';
import type { UserRole } from '@repo/shared';

export type UserInsert = typeof users.$inferInsert;
export type UserSelect = typeof users.$inferSelect;

export interface FindUsersFilter {
  role?: UserRole;
  stationId?: string;
  isActive?: boolean;
}

export class UsersRepository {
  async findAll(filters?: FindUsersFilter): Promise<UserSelect[]> {
    const conditions = [];

    if (filters?.role) {
      conditions.push(eq(users.role, filters.role));
    }
    if (filters?.stationId) {
      conditions.push(eq(users.stationId, filters.stationId));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(users.isActive, filters.isActive));
    }

    if (conditions.length > 0) {
      return db.select().from(users).where(and(...conditions));
    }

    return db.select().from(users);
  }

  async findById(id: string): Promise<UserSelect | null> {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async findByEmail(email: string): Promise<UserSelect | null> {
    const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
    return rows[0] ?? null;
  }

  async create(data: UserInsert): Promise<UserSelect> {
    const [created] = await db.insert(users).values({
      ...data,
      email: data.email.toLowerCase().trim(),
    }).returning();
    return created;
  }

  async update(id: string, data: Partial<UserInsert>): Promise<UserSelect | null> {
    const [updated] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return updated ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await db.delete(users).where(eq(users.id, id)).returning();
    return deleted.length > 0;
  }

  async updateLastLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }
}

export const usersRepository = new UsersRepository();
