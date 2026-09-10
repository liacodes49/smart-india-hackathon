import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';

/**
 * Global error handler — catches all unhandled errors and returns
 * a consistent JSON error response.
 */
export function errorMiddleware(err: Error, _req: Request, res: Response, _next: NextFunction) {
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
  });

  // Zod validation errors
  if (err.name === 'ZodError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: (err as any).errors,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Default 500
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    },
    timestamp: new Date().toISOString(),
  });
}
