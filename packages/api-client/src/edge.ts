import type { ApiClient } from './client.js';
import { API_ROUTES, type EdgeConnectivityState, type SyncBatchResult, type EdgeSyncBatchSummary, type EdgeOutboxRecord } from '@repo/shared';

export function createEdgeApi(client: ApiClient) {
  return {
    getConnectivity: (stationId: string) =>
      client.get<EdgeConnectivityState>(`${API_ROUTES.EDGE}/connectivity/${stationId}`),

    setConnectivity: (stationId: string, data: { state: 'ONLINE' | 'DEGRADED' | 'BLACKOUT'; reason?: string }) =>
      client.post<EdgeConnectivityState>(`${API_ROUTES.EDGE}/connectivity/${stationId}`, data),

    enqueueOutbox: (data: unknown) =>
      client.post<EdgeOutboxRecord>(`${API_ROUTES.EDGE}/outbox/enqueue`, data),

    pushSyncBatch: (data: unknown) =>
      client.post<SyncBatchResult>(`${API_ROUTES.EDGE}/sync/push`, data),

    listSyncBatches: (stationId: string, params?: Record<string, string | number | undefined>) =>
      client.get<{ data: EdgeSyncBatchSummary[]; total: number }>(`${API_ROUTES.EDGE}/sync/batches/${stationId}`, params),
  };
}
