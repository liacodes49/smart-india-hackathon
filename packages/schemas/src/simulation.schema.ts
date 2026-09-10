import { z } from 'zod';

export const createSimulationSchema = z.object({
  stationId: z.string().uuid(),
  name: z.string().min(3).max(200),
  type: z.enum([
    'POWER_FAILURE',
    'EQUIPMENT_FAILURE',
    'WEATHER_EXTREME',
    'EVACUATION',
    'SUPPLY_SHORTAGE',
    'CUSTOM',
  ]),
  description: z.string().min(10).max(2000),
  parameters: z.record(z.unknown()),
});
export type CreateSimulationInput = z.infer<typeof createSimulationSchema>;

export const simulationQuerySchema = z.object({
  stationId: z.string().uuid().optional(),
  type: z
    .enum([
      'POWER_FAILURE',
      'EQUIPMENT_FAILURE',
      'WEATHER_EXTREME',
      'EVACUATION',
      'SUPPLY_SHORTAGE',
      'CUSTOM',
    ])
    .optional(),
  status: z.enum(['DRAFT', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type SimulationQueryInput = z.infer<typeof simulationQuerySchema>;
