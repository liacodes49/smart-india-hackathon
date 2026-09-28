// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Auth Service
// ═══════════════════════════════════════════════════════════════
// Handles authentication, JWT issuance, password verification,
// and session token refresh.
// ═══════════════════════════════════════════════════════════════

import { usersRepository } from '../users/users.repository.js';
import { usersService, SanitizedUser } from '../users/users.service.js';
import { signJwt, verifyJwt, hashPassword, verifyPassword } from '../../lib/crypto.js';
import type { LoginInput, RegisterInput } from '@repo/schemas';
import type { UserRole } from '@repo/shared';

export interface AuthTokens {
  token: string;
  refreshToken: string;
  user: SanitizedUser;
}

export class AuthService {
  async login(input: LoginInput): Promise<AuthTokens> {
    const user = await usersRepository.findByEmail(input.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account has been deactivated. Please contact an administrator.');
    }

    if (!user.passwordHash) {
      throw new Error('Password authentication is not configured for this account');
    }

    const isValid = verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    await usersRepository.updateLastLogin(user.id);

    const token = signJwt({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      stationId: user.stationId,
    }, 7 * 24 * 60 * 60);

    const refreshToken = signJwt({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      stationId: user.stationId,
      tokenType: 'refresh',
    }, 30 * 24 * 60 * 60);

    return {
      token,
      refreshToken,
      user: usersService.sanitizeUser(user),
    };
  }

  async register(input: RegisterInput): Promise<AuthTokens> {
    const existing = await usersRepository.findByEmail(input.email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const passwordHash = hashPassword(input.password);
    const createdUser = await usersRepository.create({
      email: input.email,
      name: input.name,
      passwordHash,
      role: (input.role as UserRole) ?? 'VIEWER',
      isActive: true,
    });

    const token = signJwt({
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name,
      role: createdUser.role,
      stationId: createdUser.stationId,
    }, 7 * 24 * 60 * 60);

    const refreshToken = signJwt({
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name,
      role: createdUser.role,
      stationId: createdUser.stationId,
      tokenType: 'refresh',
    }, 30 * 24 * 60 * 60);

    return {
      token,
      refreshToken,
      user: usersService.sanitizeUser(createdUser),
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const claims = verifyJwt(refreshToken);
    const user = await usersRepository.findById(claims.id);

    if (!user || !user.isActive) {
      throw new Error('User not found or deactivated');
    }

    const token = signJwt({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      stationId: user.stationId,
    }, 7 * 24 * 60 * 60);

    const newRefreshToken = signJwt({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      stationId: user.stationId,
      tokenType: 'refresh',
    }, 30 * 24 * 60 * 60);

    return {
      token,
      refreshToken: newRefreshToken,
      user: usersService.sanitizeUser(user),
    };
  }

  async me(userId: string): Promise<SanitizedUser | null> {
    return usersService.getUserById(userId);
  }
}

export const authService = new AuthService();
