import type { ApiClient } from './client.js';
import { API_ROUTES, type GatewayIngestResult, type GatewayStats, type DeadLetterItem, type GatewayProtocol } from '@repo/shared';

export function createGatewayApi(client: ApiClient) {
  return {
    ingest: (protocol: GatewayProtocol | string, data: unknown) =>
      client.post<GatewayIngestResult>(`${API_ROUTES.GATEWAY}/ingest/${protocol}`, data),

    getStats: () =>
      client.get<GatewayStats>(`${API_ROUTES.GATEWAY}/stats`),

    getDeadLetter: (params?: Record<string, string | number | undefined>) =>
      client.get<DeadLetterItem[]>(`${API_ROUTES.GATEWAY}/dead-letter`, params),
  };
}
