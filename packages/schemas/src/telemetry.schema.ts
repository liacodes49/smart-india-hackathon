import { z } from 'zod';

export const telemetryReadingSchema = z.object({
  sensorId: z.string().uuid(),
  stationId: z.string().uuid(),
  timestamp: z.string().datetime(),
  value: z.number(),
  unit: z.string().min(1),
  status: z.enum(['NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE', 'MAINTENANCE']),
  quality: z.number().min(0).max(100).optional(),
});
export type TelemetryReadingInput = z.infer<typeof telemetryReadingSchema>;

export const telemetryBatchSchema = z.object({
  readings: z.array(telemetryReadingSchema).min(1).max(1000),
});
export type TelemetryBatchInput = z.infer<typeof telemetryBatchSchema>;

export const telemetryQuerySchema = z.object({
  stationId: z.string().uuid().optional(),
  sensorId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE', 'MAINTENANCE']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type TelemetryQueryInput = z.infer<typeof telemetryQuerySchema>;
