import { Router } from 'express';
import { stationsController } from './stations.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { createStationSchema, updateStationSchema } from '@repo/schemas';
import { UserRole } from '@repo/shared';

const router = Router();

router.get('/', authMiddleware, stationsController.list);
router.get('/:id', authMiddleware, stationsController.getById);
router.get('/:id/overview', authMiddleware, stationsController.getOverview);
router.post('/', authMiddleware, roleMiddleware(UserRole.SUPER_ADMIN, UserRole.STATION_ADMIN), validate(createStationSchema), stationsController.create);
router.put('/:id', authMiddleware, roleMiddleware(UserRole.SUPER_ADMIN, UserRole.STATION_ADMIN), validate(updateStationSchema), stationsController.update);
router.delete('/:id', authMiddleware, roleMiddleware(UserRole.SUPER_ADMIN), stationsController.delete);

export const stationsRoutes: Router = router;
