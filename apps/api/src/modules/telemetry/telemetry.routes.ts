import { Router } from 'express';
import { telemetryController } from './telemetry.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { telemetryReadingSchema, telemetryBatchSchema, telemetryQuerySchema } from '@repo/schemas';
import { UserRole } from '@repo/shared';

const router = Router();

// Telemetry queries & stats
router.get('/', authMiddleware, validate(telemetryQuerySchema, 'query'), telemetryController.list);
router.get('/summary', authMiddleware, telemetryController.getSummary);
router.get('/stats/:sensorId', authMiddleware, telemetryController.getStats);
router.get('/:id', authMiddleware, telemetryController.getById);

// Ingestion endpoints
router.post('/', authMiddleware, validate(telemetryReadingSchema), telemetryController.ingest);
router.post('/batch', authMiddleware, validate(telemetryBatchSchema), telemetryController.ingestBatch);

// Simulator controls
router.post(
  '/simulator/start',
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.STATION_ADMIN, UserRole.OPERATOR),
  telemetryController.startSimulator
);
router.post(
  '/simulator/stop',
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.STATION_ADMIN, UserRole.OPERATOR),
  telemetryController.stopSimulator
);
router.get('/simulator/status', authMiddleware, telemetryController.getSimulatorStatus);

export const telemetryRoutes: Router = router;
