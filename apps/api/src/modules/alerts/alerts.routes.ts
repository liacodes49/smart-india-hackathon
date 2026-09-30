import { Router } from 'express';
import { alertsController } from './alerts.controller.js';
import { optionalAuthMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { createAlertSchema, alertQuerySchema } from '@repo/schemas';

const router = Router();

router.get('/', optionalAuthMiddleware, validate(alertQuerySchema, 'query'), alertsController.list);
router.get('/:id', optionalAuthMiddleware, alertsController.getById);
router.post('/', optionalAuthMiddleware, validate(createAlertSchema), alertsController.create);
router.post('/:id/acknowledge', optionalAuthMiddleware, alertsController.acknowledge);
router.patch('/:id/acknowledge', optionalAuthMiddleware, alertsController.acknowledge);
router.post('/:id/resolve', optionalAuthMiddleware, alertsController.resolve);
router.patch('/:id/resolve', optionalAuthMiddleware, alertsController.resolve);

export const alertsRoutes: Router = router;

