import type { ApiClient } from './client.js';
import { API_ROUTES } from '@repo/shared';

export function createEnergyApi(client: ApiClient) {
  return {
    getSummary: (stationId: string) =>
      client.get(`${API_ROUTES.ENERGY}/stations/${stationId}/summary`),

    getGenerators: (stationId: string) =>
      client.get(`${API_ROUTES.ENERGY}/stations/${stationId}/generators`),

    getBatteries: (stationId: string) =>
      client.get(`${API_ROUTES.ENERGY}/stations/${stationId}/batteries`),
  };
}
