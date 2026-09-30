import { Router } from 'express';
import { telemetryController } from './telemetry.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/auth.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { telemetryReadingSchema, telemetryBatchSchema, telemetryQuerySchema } from '@repo/schemas';
import { UserRole } from '@repo/shared';

const router = Router();

// Telemetry queries & stats
router.get('/', optionalAuthMiddleware, validate(telemetryQuerySchema, 'query'), telemetryController.list);
router.get('/summary', optionalAuthMiddleware, telemetryController.getSummary);
router.get('/stats/:sensorId', optionalAuthMiddleware, telemetryController.getStats);
router.get('/:id', optionalAuthMiddleware, telemetryController.getById);

// Realtime Stream
router.get('/stream', optionalAuthMiddleware, telemetryController.stream);


// Ingestion endpoints
router.post('/', optionalAuthMiddleware, validate(telemetryReadingSchema), telemetryController.ingest);
router.post('/batch', optionalAuthMiddleware, validate(telemetryBatchSchema), telemetryController.ingestBatch);


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
