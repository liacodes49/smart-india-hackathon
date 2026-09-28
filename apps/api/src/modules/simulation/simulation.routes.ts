import { Router } from 'express';
import { simulationController } from './simulation.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
  createSimulationSchema,
  simulationQuerySchema,
  quickRunSimulationSchema,
} from '@repo/schemas';

const router = Router();
router.get('/', authMiddleware, validate(simulationQuerySchema, 'query'), simulationController.list);
router.post('/quick-run', authMiddleware, validate(quickRunSimulationSchema), simulationController.quickRun);
router.get('/:id', authMiddleware, simulationController.getById);
router.post('/', authMiddleware, validate(createSimulationSchema), simulationController.create);
router.post('/:id/run', authMiddleware, simulationController.run);
export const simulationRoutes: Router = router;

