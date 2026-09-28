import { Router } from 'express';
import { alertsController } from './alerts.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { createAlertSchema, alertQuerySchema } from '@repo/schemas';

const router = Router();

router.get('/', authMiddleware, validate(alertQuerySchema, 'query'), alertsController.list);
router.get('/:id', authMiddleware, alertsController.getById);
router.post('/', authMiddleware, validate(createAlertSchema), alertsController.create);
router.post('/:id/acknowledge', authMiddleware, alertsController.acknowledge);
router.post('/:id/resolve', authMiddleware, alertsController.resolve);

export const alertsRoutes: Router = router;
