import { z } from 'zod';

export const predictionQuerySchema = z.object({
  stationId: z.string().min(1).optional(),
  type: z
    .enum([
      'ANOMALY_DETECTION',
      'FAILURE_PREDICTION',
      'ENERGY_FORECAST',
      'WEATHER_FORECAST',
      'MAINTENANCE_PREDICTION',
    ])
    .optional(),
  minConfidence: z.coerce.number().min(0).max(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PredictionQueryInput = z.infer<typeof predictionQuerySchema>;

export const evaluatePredictionSchema = z.object({
  stationId: z.string().min(1),
  assetId: z.string().uuid().optional(),
  type: z
    .enum([
      'ANOMALY_DETECTION',
      'FAILURE_PREDICTION',
      'ENERGY_FORECAST',
      'WEATHER_FORECAST',
      'MAINTENANCE_PREDICTION',
    ])
    .optional(),
});
export type EvaluatePredictionInput = z.infer<typeof evaluatePredictionSchema>;

export const fuelForecastQuerySchema = z.object({
  stationId: z.string().min(1).optional(),
  loadKwOverride: z.coerce.number().positive().optional(),
  ambientTempOverride: z.coerce.number().optional(),
});
export type FuelForecastQueryInput = z.infer<typeof fuelForecastQuerySchema>;
