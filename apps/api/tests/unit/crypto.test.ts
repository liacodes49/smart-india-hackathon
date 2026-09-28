import { describe, it, expect } from 'vitest';
import { signJwt, verifyJwt, hashPassword, verifyPassword } from '../../src/lib/crypto.js';

describe('Crypto & JWT Utilities', () => {
  const mockUser = {
    id: 'usr-1234',
    email: 'admin@antarctic.gov.in',
    name: 'Dr. Sharma',
    role: 'SUPER_ADMIN',
    stationId: 'MAITRI',
  };

  it('should sign and verify valid HS256 JWT tokens', () => {
    const token = signJwt(mockUser);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const claims = verifyJwt(token);
    expect(claims.id).toBe(mockUser.id);
    expect(claims.email).toBe(mockUser.email);
    expect(claims.role).toBe(mockUser.role);
    expect(claims.stationId).toBe(mockUser.stationId);
    expect(claims.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('should reject tampered JWT tokens', () => {
    const token = signJwt(mockUser);
    const parts = token.split('.');
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...mockUser, role: 'HACKED' })
    ).toString('base64url');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    expect(() => verifyJwt(tamperedToken)).toThrow();
  });

  it('should reject expired JWT tokens', () => {
    const expiredToken = signJwt(mockUser, -10); // Expired 10 seconds ago
    expect(() => verifyJwt(expiredToken)).toThrow('Token has expired');
  });

  it('should hash and verify passwords using scrypt', () => {
    const password = 'AntarcticSecret2026!';
    const hashed = hashPassword(password);

    expect(hashed).toContain(':');
    expect(verifyPassword(password, hashed)).toBe(true);
    expect(verifyPassword('WrongPassword', hashed)).toBe(false);
  });
});
