import { Router } from 'express';
import { energyController } from './energy.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/stations/:stationId/summary', authMiddleware, energyController.getSummary);
router.get('/stations/:stationId/trends', authMiddleware, energyController.getTrends);

export const energyRoutes: Router = router;
