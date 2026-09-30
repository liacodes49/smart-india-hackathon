import { Router } from 'express';
import { stationsController } from './stations.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/auth.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { createStationSchema, updateStationSchema } from '@repo/schemas';
import { UserRole } from '@repo/shared';

const router = Router();

// Station core routes
router.get('/', optionalAuthMiddleware, stationsController.list);
router.get('/:id', optionalAuthMiddleware, stationsController.getById);
router.get('/:id/hierarchy', optionalAuthMiddleware, stationsController.getHierarchy);
router.get('/:id/overview', optionalAuthMiddleware, stationsController.getOverview);
router.post(
  '/',
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.STATION_ADMIN),
  validate(createStationSchema),
  stationsController.create,
);
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.STATION_ADMIN),
  validate(updateStationSchema),
  stationsController.update,
);
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN),
  stationsController.delete,
);

// Station building sub-resources
router.get('/:id/buildings', optionalAuthMiddleware, stationsController.getBuildings);
router.post(
  '/:id/buildings',
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.STATION_ADMIN),
  stationsController.createBuilding,
);

// Building room sub-resources
router.get('/buildings/:buildingId/rooms', optionalAuthMiddleware, stationsController.getRooms);
router.post(
  '/buildings/:buildingId/rooms',
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.STATION_ADMIN),
  stationsController.createRoom,
);

export const stationsRoutes: Router = router;
