import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';
import { verifyJwt } from '../lib/crypto.js';
import type { UserRole } from '@repo/shared';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token as string | undefined;

  if (!authHeader?.startsWith('Bearer ') && !queryToken) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7).trim() 
    : (queryToken as string);

  try {
    const claims = verifyJwt(token);
    req.user = {
      id: claims.id,
      email: claims.email,
      name: claims.name,
      role: claims.role as UserRole,
      stationId: claims.stationId ?? null,
    };
    next();
  } catch (error) {
    logger.warn('Authentication failed:', { error: error instanceof Error ? error.message : String(error) });
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired authentication token' },
      timestamp: new Date().toISOString(),
    });
  }
}

export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    try {
      const claims = verifyJwt(token);
      req.user = {
        id: claims.id,
        email: claims.email,
        name: claims.name,
        role: claims.role as UserRole,
        stationId: claims.stationId ?? null,
      };
    } catch {
      // Ignored for optional auth
    }
  }
  next();
}
