// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Risk Routes
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { riskController } from './risk.controller.js';
import { optionalAuthMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/overview', optionalAuthMiddleware, riskController.getOverview);
router.get('/stations/:stationId', optionalAuthMiddleware, riskController.getStationRisk);

export const riskRoutes: Router = router;
