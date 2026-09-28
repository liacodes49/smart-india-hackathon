// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Spatial Digital Twin Routes
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { digitalTwinController } from './digital-twin.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

// Full 2D/3D station spatial operational state
router.get('/:stationId', authMiddleware, digitalTwinController.getState);

// Focused zone sub-tree
router.get('/:stationId/zones/:zoneId', authMiddleware, digitalTwinController.getZone);

// SSE live operational delta stream
router.get('/:stationId/stream', authMiddleware, digitalTwinController.streamLiveEvents);

export const digitalTwinRoutes: Router = router;
