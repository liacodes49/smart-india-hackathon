import { z } from 'zod';

export const createAlertSchema = z.object({
  stationId: z.string().uuid(),
  sensorId: z.string().uuid().optional(),
  assetId: z.string().uuid().optional(),
  title: z.string().min(5).max(200),
  message: z.string().min(10).max(2000),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL', 'EMERGENCY']),
  category: z.enum(['ENVIRONMENTAL', 'EQUIPMENT', 'POWER', 'STRUCTURAL', 'SAFETY', 'NETWORK']),
});
export type CreateAlertInput = z.infer<typeof createAlertSchema>;

export const acknowledgeAlertSchema = z.object({
  acknowledgedBy: z.string().uuid(),
  notes: z.string().max(1000).optional(),
});
export type AcknowledgeAlertInput = z.infer<typeof acknowledgeAlertSchema>;

export const alertQuerySchema = z.object({
  stationId: z.string().uuid().optional(),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL', 'EMERGENCY']).optional(),
  status: z.enum(['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'ESCALATED', 'DISMISSED']).optional(),
  category: z
    .enum(['ENVIRONMENTAL', 'EQUIPMENT', 'POWER', 'STRUCTURAL', 'SAFETY', 'NETWORK'])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type AlertQueryInput = z.infer<typeof alertQuerySchema>;
