import { z } from 'zod';

export const predictionQuerySchema = z.object({
  stationId: z.string().uuid().optional(),
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
