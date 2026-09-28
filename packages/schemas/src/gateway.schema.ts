import { z } from 'zod';

export const gatewayProtocolSchema = z.enum(['REST', 'MQTT', 'MODBUS', 'MANUAL']);
export type GatewayProtocolInput = z.infer<typeof gatewayProtocolSchema>;

export const gatewayIngestParamsSchema = z.object({
  protocol: gatewayProtocolSchema,
});

export const gatewayIngestBodySchema = z.object({
  stationId: z.string().min(1),
  deviceTag: z.string().optional(),
  timestamp: z.string().optional(),
  payload: z.unknown(),
});
export type GatewayIngestBodyInput = z.infer<typeof gatewayIngestBodySchema>;

export const gatewayQuerySchema = z.object({
  stationId: z.string().optional(),
  protocol: gatewayProtocolSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type GatewayQueryInput = z.infer<typeof gatewayQuerySchema>;
