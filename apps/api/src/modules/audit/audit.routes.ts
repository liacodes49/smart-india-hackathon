import { Router } from 'express';
import { auditController } from './audit.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';
import { UserRole } from '@repo/shared';

const router = Router();
router.get('/', authMiddleware, roleMiddleware(UserRole.SUPER_ADMIN, UserRole.STATION_ADMIN), auditController.list);
export const auditRoutes: Router = router;
