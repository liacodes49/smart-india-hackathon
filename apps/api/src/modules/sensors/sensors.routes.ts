import { Router } from 'express';
import { sensorsController } from './sensors.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/auth.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { createSensorSchema, updateSensorSchema, sensorQuerySchema } from '@repo/schemas';
import { UserRole } from '@repo/shared';

const router = Router();

router.get('/', optionalAuthMiddleware, validate(sensorQuerySchema, 'query'), sensorsController.list);
router.post('/health-check', authMiddleware, roleMiddleware(UserRole.SUPER_ADMIN, UserRole.STATION_ADMIN), sensorsController.checkHealth);
router.get('/:id', optionalAuthMiddleware, sensorsController.getById);

router.post(
  '/',
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.STATION_ADMIN),
  validate(createSensorSchema),
  sensorsController.create
);
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.STATION_ADMIN),
  validate(updateSensorSchema),
  sensorsController.update
);
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN),
  sensorsController.delete
);

export const sensorsRoutes: Router = router;
