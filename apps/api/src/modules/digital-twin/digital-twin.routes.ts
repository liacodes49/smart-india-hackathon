import { Router } from 'express';
import { digitalTwinController } from './digital-twin.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();
router.get('/:stationId', authMiddleware, digitalTwinController.getState);
export const digitalTwinRoutes: Router = router;
