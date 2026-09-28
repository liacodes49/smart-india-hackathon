import { Router } from 'express';
import { inventoryController } from './inventory.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  consumeResourceSchema,
  inventoryQuerySchema,
} from '@repo/schemas';
import { UserRole } from '@repo/shared';

const router = Router();

router.get('/', authMiddleware, validate(inventoryQuerySchema, 'query'), inventoryController.list);
router.get('/stations/:stationId/low-stock', authMiddleware, inventoryController.getLowStock);
router.get('/:id', authMiddleware, inventoryController.getById);
router.get('/:id/history', authMiddleware, inventoryController.getHistory);

router.post(
  '/',
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.STATION_ADMIN, UserRole.OPERATOR),
  validate(createInventoryItemSchema),
  inventoryController.create
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.STATION_ADMIN, UserRole.OPERATOR),
  validate(updateInventoryItemSchema),
  inventoryController.update
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.STATION_ADMIN),
  inventoryController.delete
);

router.post(
  '/:id/consume',
  authMiddleware,
  validate(consumeResourceSchema),
  inventoryController.consume
);

export const inventoryRoutes: Router = router;
