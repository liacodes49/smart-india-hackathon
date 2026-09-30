import { Router } from 'express';
import { energyController } from './energy.controller.js';
import { optionalAuthMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/stations/:stationId/summary', optionalAuthMiddleware, energyController.getSummary);
router.get('/stations/:stationId/trends', optionalAuthMiddleware, energyController.getTrends);

export const energyRoutes: Router = router;
