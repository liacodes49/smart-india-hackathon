// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Spatial Digital Twin Routes
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { digitalTwinController } from './digital-twin.controller.js';
import { optionalAuthMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

// Full 2D/3D station spatial operational state (supports both /stations/:stationId and /:stationId)
router.get('/stations/:stationId', optionalAuthMiddleware, digitalTwinController.getState);
router.get('/:stationId', optionalAuthMiddleware, digitalTwinController.getState);

// Focused zone sub-tree
router.get('/stations/:stationId/zones/:zoneId', optionalAuthMiddleware, digitalTwinController.getZone);
router.get('/:stationId/zones/:zoneId', optionalAuthMiddleware, digitalTwinController.getZone);

// SSE live operational delta stream
router.get('/stations/:stationId/stream', optionalAuthMiddleware, digitalTwinController.streamLiveEvents);
router.get('/:stationId/stream', optionalAuthMiddleware, digitalTwinController.streamLiveEvents);

export const digitalTwinRoutes: Router = router;
