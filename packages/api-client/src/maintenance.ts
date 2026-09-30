import type { MaintenanceRecord } from '@repo/shared';
import { API_ROUTES } from '@repo/shared';
import type { ApiClient } from './client.js';

export function createMaintenanceApi(client: ApiClient) {
  return {
    list: (params?: Record<string, string | number | undefined>) =>
      client.get<MaintenanceRecord[]>(API_ROUTES.MAINTENANCE, params),

    getById: (id: string) =>
      client.get<MaintenanceRecord>(`${API_ROUTES.MAINTENANCE}/${id}`),

    create: (data: unknown) =>
      client.post<MaintenanceRecord>(API_ROUTES.MAINTENANCE, data),

    update: (id: string, data: unknown) =>
      client.put<MaintenanceRecord>(`${API_ROUTES.MAINTENANCE}/${id}`, data),

    approve: (id: string, data?: unknown) =>
      client.post<MaintenanceRecord>(`${API_ROUTES.MAINTENANCE}/${id}/approve`, data),
  };
}
