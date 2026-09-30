import { Router } from 'express';
import { assetsController } from './assets.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/auth.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { createAssetSchema, updateAssetSchema, assetQuerySchema } from '@repo/schemas';
import { UserRole } from '@repo/shared';

const router = Router();

router.get('/', optionalAuthMiddleware, validate(assetQuerySchema, 'query'), assetsController.list);
router.get('/:id', optionalAuthMiddleware, assetsController.getById);
router.post(
  '/',
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.STATION_ADMIN),
  validate(createAssetSchema),
  assetsController.create,
);
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.STATION_ADMIN),
  validate(updateAssetSchema),
  assetsController.update,
);
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN),
  assetsController.delete,
);

export const assetsRoutes: Router = router;
