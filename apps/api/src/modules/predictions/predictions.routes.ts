import { Router } from 'express';
import { predictionsController } from './predictions.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { predictionQuerySchema } from '@repo/schemas';

const router = Router();
router.get('/', authMiddleware, validate(predictionQuerySchema, 'query'), predictionsController.list);
router.get('/:id', authMiddleware, predictionsController.getById);
export const predictionsRoutes: Router = router;
