// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Incidents Routes
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { incidentsController } from './incidents.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
  createIncidentSchema,
  updateIncidentSchema,
  escalateAlertSchema,
  incidentQuerySchema,
} from '@repo/schemas';

const router = Router();

router.get(
  '/',
  optionalAuthMiddleware,
  validate(incidentQuerySchema, 'query'),
  incidentsController.list,
);
router.post('/', authMiddleware, validate(createIncidentSchema), incidentsController.create);
router.post(
  '/from-alert/:alertId',
  authMiddleware,
  validate(escalateAlertSchema),
  incidentsController.escalateFromAlert,
);
router.get('/:id', optionalAuthMiddleware, incidentsController.getById);
router.patch('/:id', authMiddleware, validate(updateIncidentSchema), incidentsController.update);
router.post('/:id/assign', authMiddleware, incidentsController.assign);
router.post('/:id/resolve', authMiddleware, incidentsController.resolve);

export const incidentRoutes: Router = router;
