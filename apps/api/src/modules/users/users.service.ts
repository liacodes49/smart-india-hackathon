// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Users Service
// ═══════════════════════════════════════════════════════════════
// Business logic layer for user accounts and profiles
// ═══════════════════════════════════════════════════════════════

import { usersRepository, FindUsersFilter, UserSelect, UserInsert } from './users.repository.js';

export type SanitizedUser = Omit<UserSelect, 'passwordHash'>;

export class UsersService {
  /**
   * Strip sensitive fields from user record
   */
  sanitizeUser(user: UserSelect): SanitizedUser {
    const { passwordHash: _, ...sanitized } = user;
    return sanitized;
  }

  async getUsers(filters?: FindUsersFilter): Promise<SanitizedUser[]> {
    const users = await usersRepository.findAll(filters);
    return users.map(u => this.sanitizeUser(u));
  }

  async getUserById(id: string): Promise<SanitizedUser | null> {
    const user = await usersRepository.findById(id);
    if (!user) return null;
    return this.sanitizeUser(user);
  }

  async updateUser(id: string, data: Partial<UserInsert>): Promise<SanitizedUser | null> {
    const updated = await usersRepository.update(id, data);
    if (!updated) return null;
    return this.sanitizeUser(updated);
  }

  async deleteUser(id: string): Promise<boolean> {
    return usersRepository.delete(id);
  }
}

export const usersService = new UsersService();
