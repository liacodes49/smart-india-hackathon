import { Router } from 'express';
import { usersController } from './users.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';
import { UserRole } from '@repo/shared';

const router = Router();
router.get('/', authMiddleware, roleMiddleware(UserRole.SUPER_ADMIN, UserRole.STATION_ADMIN), usersController.list);
router.get('/:id', authMiddleware, usersController.getById);
router.put('/:id', authMiddleware, usersController.update);
router.delete('/:id', authMiddleware, roleMiddleware(UserRole.SUPER_ADMIN), usersController.delete);
export const usersRoutes: Router = router;
