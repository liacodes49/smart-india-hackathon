import type { ApiClient } from './client.js';
import { API_ROUTES } from '@repo/shared';

export function createPredictionsApi(client: ApiClient) {
  return {
    list: (params?: Record<string, string | number | undefined>) =>
      client.get(API_ROUTES.PREDICTIONS, params),

    getEquipmentHealth: (assetId: string) =>
      client.get(`${API_ROUTES.PREDICTIONS}/equipment/${assetId}/health`),

    getFuelDepletion: (stationId: string) =>
      client.get(`${API_ROUTES.PREDICTIONS}/stations/${stationId}/fuel-forecast`),
  };
}
