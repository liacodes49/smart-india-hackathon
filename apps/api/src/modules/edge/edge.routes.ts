// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Edge Synchronization Routes
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { edgeController } from './edge.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

// Connectivity transitions & telemetry sync
router.get('/connectivity/:stationId', optionalAuthMiddleware, edgeController.getConnectivity);
router.post('/connectivity/:stationId', optionalAuthMiddleware, edgeController.setConnectivity);
router.post('/outbox/enqueue', authMiddleware, edgeController.enqueueOutbox);
router.post('/sync/push', authMiddleware, edgeController.pushBatch);
router.get('/sync/batches/:stationId', optionalAuthMiddleware, edgeController.listBatches);

export const edgeRoutes: Router = router;
