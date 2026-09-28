import { z } from 'zod';

export const connectivityTransitionSchema = z.object({
  stationId: z.string().min(1),
  state: z.enum(['ONLINE', 'DEGRADED', 'BLACKOUT']),
  reason: z.string().optional(),
  updatedBy: z.string().optional(),
});
export type ConnectivityTransitionInput = z.infer<typeof connectivityTransitionSchema>;

export const edgeOutboxEnqueueSchema = z.object({
  stationId: z.string().min(1),
  edgeNodeId: z.string().min(1),
  sequenceNumber: z.number().int().nonnegative(),
  idempotencyKey: z.string().min(1),
  eventType: z.string().min(1),
  observedAt: z.string().datetime().or(z.string().min(1)),
  payload: z.record(z.unknown()),
});
export type EdgeOutboxEnqueueInput = z.infer<typeof edgeOutboxEnqueueSchema>;

export const syncBatchReadingItemSchema = z.object({
  sensorId: z.string().min(1),
  stationId: z.string().min(1),
  value: z.number(),
  unit: z.string().min(1),
  timestamp: z.string().min(1), // observedAt timestamp (ISO string)
  status: z.enum(['NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE', 'MAINTENANCE']).optional(),
  quality: z.number().min(0).max(100).optional(),
  sequenceNumber: z.number().int().nonnegative().optional(),
  idempotencyKey: z.string().optional(),
  provenance: z.enum(['SIMULATED', 'SENSOR', 'EXTERNAL_API', 'MANUAL', 'EDGE_SYNC']).optional(),
});
export type SyncBatchReadingItemInput = z.infer<typeof syncBatchReadingItemSchema>;

export const syncBatchEventItemSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.string().min(1),
  stationId: z.string().min(1),
  observedAt: z.string().min(1),
  sequenceNumber: z.number().int().nonnegative().optional(),
  payload: z.record(z.unknown()),
});
export type SyncBatchEventItemInput = z.infer<typeof syncBatchEventItemSchema>;

export const edgeSyncPushBatchSchema = z.object({
  stationId: z.string().min(1),
  edgeNodeId: z.string().min(1),
  batchNumber: z.number().int().positive(),
  idempotencyKey: z.string().min(1),
  firstSequence: z.number().int().nonnegative(),
  lastSequence: z.number().int().nonnegative(),
  checksum: z.string().min(1),
  readings: z.array(syncBatchReadingItemSchema).optional().default([]),
  events: z.array(syncBatchEventItemSchema).optional().default([]),
});
export type EdgeSyncPushBatchInput = z.input<typeof edgeSyncPushBatchSchema>;
export type EdgeSyncPushBatchOutput = z.output<typeof edgeSyncPushBatchSchema>;

export const edgeSyncQuerySchema = z.object({
  stationId: z.string().min(1).optional(),
  status: z.enum(['PENDING', 'SYNCING', 'SYNCED', 'FAILED', 'CONFLICT']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type EdgeSyncQueryInput = z.infer<typeof edgeSyncQuerySchema>;
