// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Maintenance Routes
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { maintenanceController } from './maintenance.controller.js';
import { optionalAuthMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
  createMaintenanceSchema,
  updateMaintenanceSchema,
  maintenanceQuerySchema,
} from '@repo/schemas';

const router = Router();

router.get(
  '/',
  optionalAuthMiddleware,
  validate(maintenanceQuerySchema, 'query'),
  maintenanceController.list
);

router.get('/:id', optionalAuthMiddleware, maintenanceController.getById);

router.post(
  '/',
  optionalAuthMiddleware,
  validate(createMaintenanceSchema),
  maintenanceController.create
);

router.put(
  '/:id',
  optionalAuthMiddleware,
  validate(updateMaintenanceSchema),
  maintenanceController.update
);

router.post(
  '/:id/approve',
  optionalAuthMiddleware,
  maintenanceController.approve
);

export const maintenanceRoutes: Router = router;

