// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Industrial Gateway Routes
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { gatewayController } from './gateway.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/ingest/:protocol', authMiddleware, gatewayController.ingest);
router.get('/stats', authMiddleware, gatewayController.getStats);
router.get('/dead-letter', authMiddleware, gatewayController.getDeadLetter);

export const gatewayRoutes: Router = router;
