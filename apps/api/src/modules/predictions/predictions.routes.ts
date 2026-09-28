// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Predictions Routes
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { predictionsController } from './predictions.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
  predictionQuerySchema,
  evaluatePredictionSchema,
  fuelForecastQuerySchema,
} from '@repo/schemas';

const router = Router();

router.get(
  '/',
  authMiddleware,
  validate(predictionQuerySchema, 'query'),
  predictionsController.list
);

router.get(
  '/assets/:assetId/health',
  authMiddleware,
  predictionsController.getAssetHealth
);

router.get(
  '/equipment/:assetId/health',
  authMiddleware,
  predictionsController.getAssetHealth
);

router.get(
  '/stations/:stationId/fuel',
  authMiddleware,
  validate(fuelForecastQuerySchema, 'query'),
  predictionsController.getFuelForecast
);

router.get(
  '/stations/:stationId/fuel-forecast',
  authMiddleware,
  validate(fuelForecastQuerySchema, 'query'),
  predictionsController.getFuelForecast
);

router.post(
  '/evaluate',
  authMiddleware,
  validate(evaluatePredictionSchema),
  predictionsController.evaluate
);

router.get('/:id', authMiddleware, predictionsController.getById);

export const predictionsRoutes: Router = router;
