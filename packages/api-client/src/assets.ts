import type { ApiClient } from './client.js';
import { API_ROUTES } from '@repo/shared';

export function createAssetsApi(client: ApiClient) {
  return {
    list: (params?: Record<string, string | number | undefined>) =>
      client.get(API_ROUTES.ASSETS, params),

    getById: (id: string) => client.get(`${API_ROUTES.ASSETS}/${id}`),

    create: (data: unknown) => client.post(API_ROUTES.ASSETS, data),

    update: (id: string, data: unknown) => client.put(`${API_ROUTES.ASSETS}/${id}`, data),

    delete: (id: string) => client.delete(`${API_ROUTES.ASSETS}/${id}`),
  };
}
