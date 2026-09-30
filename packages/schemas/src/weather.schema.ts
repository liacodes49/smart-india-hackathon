// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Weather Schemas
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';

export const createWeatherObservationSchema = z.object({
  stationId: z.string().uuid(),
  temperature: z.number().min(-100).max(40),
  windSpeed: z.number().min(0).max(350),
  windGust: z.number().min(0).max(400),
  windDirection: z.string().min(1).max(10),
  windChill: z.number().min(-120).max(40).optional(),
  pressure: z.number().min(800).max(1150),
  humidity: z.number().min(0).max(100),
  visibilityMeters: z.number().int().min(0).max(100000),
  condition: z.enum(['CLEAR', 'PARTLY_CLOUDY', 'OVERCAST', 'SNOW', 'BLIZZARD', 'KATABATIC_GALE']),
  provenance: z.enum(['SIMULATED', 'SENSOR', 'EXTERNAL_API', 'MANUAL']).default('SIMULATED'),
  recordedAt: z.string().datetime().optional(),
});
export type CreateWeatherObservationInput = z.infer<typeof createWeatherObservationSchema>;

export const weatherQuerySchema = z.object({
  stationId: z.string().min(1).optional(),
  provenance: z.enum(['SIMULATED', 'SENSOR', 'EXTERNAL_API', 'MANUAL']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type WeatherQueryInput = z.infer<typeof weatherQuerySchema>;

export const weatherForecastQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(14).default(7),
});
export type WeatherForecastQueryInput = z.infer<typeof weatherForecastQuerySchema>;
