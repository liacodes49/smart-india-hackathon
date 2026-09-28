// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Cryptography & JWT Helpers
// ═══════════════════════════════════════════════════════════════
// Pure Node.js crypto implementation for HS256 JWT sign/verify
// and scrypt-based password hashing. Zero external dependencies.
// ═══════════════════════════════════════════════════════════════

import crypto from 'node:crypto';
import { env } from '../config/env.js';

export interface JwtUserPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  stationId?: string | null;
  [key: string]: unknown;
}

export interface JwtTokenClaims extends JwtUserPayload {
  iat: number;
  exp: number;
}

function base64UrlEncode(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Sign a JWT token using HS256 with the configured secret
 */
export function signJwt(payload: JwtUserPayload, expiresInSeconds = 7 * 24 * 60 * 60): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const claims: JwtTokenClaims = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(claims));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(data)
    .digest();

  const encodedSignature = base64UrlEncode(signature);
  return `${data}.${encodedSignature}`;
}

/**
 * Verify an HS256 JWT token. Throws if invalid or expired.
 */
export function verifyJwt(token: string): JwtTokenClaims {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed token');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(data)
    .digest();

  const expectedEncodedSig = base64UrlEncode(expectedSignature);

  // Timing safe comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(encodedSignature);
  const expectedBuffer = Buffer.from(expectedEncodedSig);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid signature');
  }

  const payload: JwtTokenClaims = JSON.parse(base64UrlDecode(encodedPayload));
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && payload.exp < now) {
    throw new Error('Token has expired');
  }

  return payload;
}

/**
 * Hash a password using scrypt with a random 16-byte salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

/**
 * Verify a password against a stored scrypt hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;

  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);

  if (keyBuffer.length !== derivedKey.length) return false;
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}
