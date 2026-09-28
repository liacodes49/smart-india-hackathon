// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Analytics & Reports Routes
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { analyticsController } from './analytics.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/energy/:stationId', authMiddleware, analyticsController.getEnergyTrend);
router.get('/fuel/:stationId', authMiddleware, analyticsController.getFuelTrend);
router.get('/reliability/:stationId', authMiddleware, analyticsController.getReliability);
router.post('/reports/generate', authMiddleware, analyticsController.generateReport);
router.get('/reports/export', authMiddleware, analyticsController.exportReport);

export const analyticsRoutes: Router = router;
