import { Router } from 'express';
import { telemetryController } from './telemetry.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { telemetryReadingSchema, telemetryQuerySchema } from '@repo/schemas';

const router = Router();

router.get('/', authMiddleware, validate(telemetryQuerySchema, 'query'), telemetryController.list);
router.get('/summary', authMiddleware, telemetryController.getSummary);
router.get('/:id', authMiddleware, telemetryController.getById);
router.post('/', authMiddleware, validate(telemetryReadingSchema), telemetryController.ingest);

export const telemetryRoutes: Router = router;
