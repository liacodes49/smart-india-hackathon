import type { ApiClient } from './client.js';
import { API_ROUTES } from '@repo/shared';

export function createSimulationApi(client: ApiClient) {
  return {
    list: (params?: Record<string, string | number | undefined>) =>
      client.get(API_ROUTES.SIMULATIONS, params),

    getById: (id: string) =>
      client.get(`${API_ROUTES.SIMULATIONS}/${id}`),

    create: (data: unknown) =>
      client.post(API_ROUTES.SIMULATIONS, data),

    run: (id: string) =>
      client.post(`${API_ROUTES.SIMULATIONS}/${id}/run`),

    quickRun: (data: unknown) =>
      client.post(`${API_ROUTES.SIMULATIONS}/quick-run`, data),
  };
}
