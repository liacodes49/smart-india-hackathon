import type { Alert } from '@repo/shared';
import { API_ROUTES } from '@repo/shared';
import type { ApiClient } from './client.js';

export function createAlertsApi(client: ApiClient) {
  return {
    list: (params?: Record<string, string | number | undefined>) =>
      client.get<Alert[]>(API_ROUTES.ALERTS, params),

    getById: (id: string) => client.get<Alert>(`${API_ROUTES.ALERTS}/${id}`),

    acknowledge: (id: string, body: unknown) =>
      client.patch(`${API_ROUTES.ALERTS}/${id}/acknowledge`, body),

    resolve: (id: string, body?: unknown) =>
      client.patch(`${API_ROUTES.ALERTS}/${id}/resolve`, body),

    dismiss: (id: string) => client.patch(`${API_ROUTES.ALERTS}/${id}/dismiss`),
  };
}
