import type { ApiClient } from './client.js';
import { API_ROUTES } from '@repo/shared';

export function createIncidentsApi(client: ApiClient) {
  return {
    list: (params?: Record<string, string | number | undefined>) =>
      client.get(API_ROUTES.INCIDENTS, params),

    getById: (id: string) =>
      client.get(`${API_ROUTES.INCIDENTS}/${id}`),

    create: (data: unknown) =>
      client.post(API_ROUTES.INCIDENTS, data),

    update: (id: string, data: unknown) =>
      client.patch(`${API_ROUTES.INCIDENTS}/${id}`, data),

    escalateAlert: (alertId: string, data: unknown) =>
      client.post(`${API_ROUTES.INCIDENTS}/from-alert/${alertId}`, data),

    assign: (id: string, data: unknown) =>
      client.post(`${API_ROUTES.INCIDENTS}/${id}/assign`, data),

    resolve: (id: string, data: unknown) =>
      client.post(`${API_ROUTES.INCIDENTS}/${id}/resolve`, data),
  };
}
