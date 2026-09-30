import { Router } from 'express';
import { simulationController } from './simulation.controller.js';
import { optionalAuthMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
  createSimulationSchema,
  simulationQuerySchema,
  quickRunSimulationSchema,
} from '@repo/schemas';

const router = Router();
router.get('/', optionalAuthMiddleware, validate(simulationQuerySchema, 'query'), simulationController.list);
router.post('/quick-run', optionalAuthMiddleware, validate(quickRunSimulationSchema), simulationController.quickRun);
router.get('/:id', optionalAuthMiddleware, simulationController.getById);
router.post('/', optionalAuthMiddleware, validate(createSimulationSchema), simulationController.create);
router.post('/:id/run', optionalAuthMiddleware, simulationController.run);
export const simulationRoutes: Router = router;

