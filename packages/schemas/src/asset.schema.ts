import { z } from 'zod';

export const createAssetSchema = z.object({
  stationId: z.string().uuid(),
  buildingId: z.string().uuid().optional().nullable(),
  roomId: z.string().uuid().optional().nullable(),
  name: z.string().min(2).max(255),
  code: z.string().min(2).max(50),
  category: z.enum([
    'GENERATOR',
    'HVAC',
    'COMMUNICATION',
    'WATER_TREATMENT',
    'FIRE_SAFETY',
    'RESEARCH_EQUIPMENT',
    'VEHICLE',
    'STORAGE',
    'STRUCTURAL',
  ]),
  manufacturer: z.string().max(255).optional().nullable(),
  model: z.string().max(255).optional().nullable(),
  serialNumber: z.string().max(255).optional().nullable(),
  installDate: z.string().datetime().optional().nullable(),
  status: z.enum(['NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE', 'MAINTENANCE']).optional().default('NORMAL'),
  criticality: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('MEDIUM'),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;

export const updateAssetSchema = createAssetSchema.partial();
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;

export const assetQuerySchema = z.object({
  stationId: z.string().uuid().optional(),
  buildingId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  category: z.enum([
    'GENERATOR',
    'HVAC',
    'COMMUNICATION',
    'WATER_TREATMENT',
    'FIRE_SAFETY',
    'RESEARCH_EQUIPMENT',
    'VEHICLE',
    'STORAGE',
    'STRUCTURAL',
  ]).optional(),
  criticality: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE', 'MAINTENANCE']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AssetQueryInput = z.infer<typeof assetQuerySchema>;
