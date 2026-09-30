// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Analytics & Reports Routes
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { analyticsController } from './analytics.controller.js';
import { optionalAuthMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/energy/:stationId', optionalAuthMiddleware, analyticsController.getEnergyTrend);
router.get('/fuel/:stationId', optionalAuthMiddleware, analyticsController.getFuelTrend);
router.get('/reliability/:stationId', optionalAuthMiddleware, analyticsController.getReliability);
router.post('/reports/generate', optionalAuthMiddleware, analyticsController.generateReport);
router.get('/reports/export', optionalAuthMiddleware, analyticsController.exportReport);

export const analyticsRoutes: Router = router;

