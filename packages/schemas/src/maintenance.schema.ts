import { z } from 'zod';

export const createMaintenanceSchema = z.object({
  stationId: z.string().uuid(),
  assetId: z.string().uuid(),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  type: z.enum(['PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE', 'EMERGENCY']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  assignedTo: z.string().uuid().optional(),
  scheduledDate: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
});
export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;

export const updateMaintenanceSchema = createMaintenanceSchema.partial().extend({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD']).optional(),
  completedDate: z.string().datetime().optional(),
});
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;

export const maintenanceQuerySchema = z.object({
  stationId: z.string().uuid().optional(),
  assetId: z.string().uuid().optional(),
  type: z.enum(['PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE', 'EMERGENCY']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type MaintenanceQueryInput = z.infer<typeof maintenanceQuerySchema>;
