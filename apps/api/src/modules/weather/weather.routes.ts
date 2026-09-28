// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Weather Routes
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { weatherController } from './weather.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
  createWeatherObservationSchema,
  weatherForecastQuerySchema,
} from '@repo/schemas';

const router = Router();

router.get(
  '/stations/:stationId/current',
  authMiddleware,
  weatherController.getCurrent
);

router.get(
  '/stations/:stationId/forecast',
  authMiddleware,
  validate(weatherForecastQuerySchema, 'query'),
  weatherController.getForecast
);

router.get(
  '/stations/:stationId/history',
  authMiddleware,
  weatherController.getHistory
);

router.post(
  '/observations',
  authMiddleware,
  validate(createWeatherObservationSchema),
  weatherController.recordObservation
);

export const weatherRoutes: Router = router;
