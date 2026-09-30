import { z } from 'zod';

export const createSensorSchema = z.object({
  assetId: z.string().uuid(),
  stationId: z.string().uuid(),
  name: z.string().min(2).max(255),
  type: z.enum([
    'TEMPERATURE',
    'HUMIDITY',
    'PRESSURE',
    'WIND_SPEED',
    'WIND_DIRECTION',
    'POWER',
    'FUEL',
    'BATTERY',
    'CO2',
    'WATER',
    'NETWORK',
    'STRUCTURAL',
    'VIBRATION',
    'SOLAR_RADIATION',
  ]),
  unit: z.string().min(1).max(50),
  minThreshold: z.number().optional().nullable(),
  maxThreshold: z.number().optional().nullable(),
  warningThreshold: z.number().optional().nullable(),
  criticalThreshold: z.number().optional().nullable(),
  status: z.enum(['NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE', 'MAINTENANCE']).optional().default('NORMAL'),
});

export type CreateSensorInput = z.infer<typeof createSensorSchema>;

export const updateSensorSchema = createSensorSchema.partial();
export type UpdateSensorInput = z.infer<typeof updateSensorSchema>;

export const sensorQuerySchema = z.object({
  stationId: z.string().min(1).optional(),
  assetId: z.string().uuid().optional(),

  type: z.enum([
    'TEMPERATURE',
    'HUMIDITY',
    'PRESSURE',
    'WIND_SPEED',
    'WIND_DIRECTION',
    'POWER',
    'FUEL',
    'BATTERY',
    'CO2',
    'WATER',
    'NETWORK',
    'STRUCTURAL',
    'VIBRATION',
    'SOLAR_RADIATION',
  ]).optional(),
  status: z.enum(['NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE', 'MAINTENANCE']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type SensorQueryInput = z.infer<typeof sensorQuerySchema>;
