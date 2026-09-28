import type { ApiClient } from './client.js';
import { API_ROUTES } from '@repo/shared';

export function createInventoryApi(client: ApiClient) {
  return {
    listItems: (params?: Record<string, string | number | undefined>) =>
      client.get(API_ROUTES.INVENTORY, params),

    getItemById: (id: string) =>
      client.get(`${API_ROUTES.INVENTORY}/${id}`),

    logConsumption: (data: unknown) =>
      client.post(`${API_ROUTES.INVENTORY}/consumption`, data),

    getFuelStatus: (stationId: string) =>
      client.get(`${API_ROUTES.INVENTORY}/stations/${stationId}/fuel`),
  };
}
