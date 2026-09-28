import { z } from 'zod';

export const createInventoryItemSchema = z.object({
  stationId: z.string().uuid(),
  name: z.string().min(2).max(255),
  code: z.string().min(2).max(50),
  category: z.enum(['FUEL', 'FOOD', 'WATER', 'MEDICAL', 'SPARE_PARTS', 'CONSUMABLES']),
  currentStock: z.number().min(0),
  minimumThreshold: z.number().min(0),
  unit: z.string().min(1).max(50),
  location: z.string().max(255).optional().nullable(),
  expirationDate: z.string().datetime().optional().nullable(),
  resupplyDate: z.string().datetime().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;

export const updateInventoryItemSchema = createInventoryItemSchema.partial();
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;

export const consumeResourceSchema = z.object({
  quantity: z.number().positive('Quantity consumed must be greater than 0'),
  assetId: z.string().uuid().optional().nullable(),
  loggedBy: z.string().uuid().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export type ConsumeResourceInput = z.infer<typeof consumeResourceSchema>;

export const inventoryQuerySchema = z.object({
  stationId: z.string().uuid().optional(),
  category: z.enum(['FUEL', 'FOOD', 'WATER', 'MEDICAL', 'SPARE_PARTS', 'CONSUMABLES']).optional(),
  lowStockOnly: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type InventoryQueryInput = z.infer<typeof inventoryQuerySchema>;
