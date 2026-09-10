import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@repo/shared';

/**
 * RBAC middleware factory.
 * Usage: roleMiddleware('SUPER_ADMIN', 'STATION_ADMIN')
 * Backend enforces permissions — never trust the frontend.
 */
export function roleMiddleware(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Role '${user.role}' does not have access to this resource`,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}
