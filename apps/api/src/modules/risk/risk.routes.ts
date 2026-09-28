// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Risk Routes
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { riskController } from './risk.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/overview', authMiddleware, riskController.getOverview);
router.get('/stations/:stationId', authMiddleware, riskController.getStationRisk);

export const riskRoutes: Router = router;
