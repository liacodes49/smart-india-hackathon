// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Predictions Routes
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { predictionsController } from './predictions.controller.js';
import { optionalAuthMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
  predictionQuerySchema,
  evaluatePredictionSchema,
  fuelForecastQuerySchema,
} from '@repo/schemas';

const router = Router();

router.get(
  '/',
  optionalAuthMiddleware,
  validate(predictionQuerySchema, 'query'),
  predictionsController.list,
);

router.get('/assets/:assetId/health', optionalAuthMiddleware, predictionsController.getAssetHealth);

router.get(
  '/equipment/:assetId/health',
  optionalAuthMiddleware,
  predictionsController.getAssetHealth,
);

router.get(
  '/stations/:stationId/fuel',
  optionalAuthMiddleware,
  validate(fuelForecastQuerySchema, 'query'),
  predictionsController.getFuelForecast,
);

router.get(
  '/stations/:stationId/fuel-forecast',
  optionalAuthMiddleware,
  validate(fuelForecastQuerySchema, 'query'),
  predictionsController.getFuelForecast,
);

router.post(
  '/evaluate',
  optionalAuthMiddleware,
  validate(evaluatePredictionSchema),
  predictionsController.evaluate,
);

router.get('/:id', optionalAuthMiddleware, predictionsController.getById);

export const predictionsRoutes: Router = router;
