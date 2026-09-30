// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Weather Routes
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { weatherController } from './weather.controller.js';
import { optionalAuthMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { createWeatherObservationSchema, weatherForecastQuerySchema } from '@repo/schemas';

const router = Router();

router.get('/stations/:stationId/current', optionalAuthMiddleware, weatherController.getCurrent);

router.get(
  '/stations/:stationId/forecast',
  optionalAuthMiddleware,
  validate(weatherForecastQuerySchema, 'query'),
  weatherController.getForecast,
);

router.get('/stations/:stationId/history', optionalAuthMiddleware, weatherController.getHistory);

router.post(
  '/observations',
  optionalAuthMiddleware,
  validate(createWeatherObservationSchema),
  weatherController.recordObservation,
);

export const weatherRoutes: Router = router;
