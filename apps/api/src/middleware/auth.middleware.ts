import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';

// TODO: Replace with actual JWT verification via Supabase Auth
export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    _res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' },
      timestamp: new Date().toISOString(),
    });
    return;
  }



  try {
    // TODO: Verify JWT token with Supabase
    // For now, attach a mock user for development
    (req as any).user = {
      id: 'dev-user-id',
      email: 'dev@antarctic.in',
      role: 'SUPER_ADMIN',
    };
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    _res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
      timestamp: new Date().toISOString(),
    });
  }
}
