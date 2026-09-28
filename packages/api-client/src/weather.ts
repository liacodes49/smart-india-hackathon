import type { ApiClient } from './client.js';
import { API_ROUTES } from '@repo/shared';

export function createWeatherApi(client: ApiClient) {
  return {
    getCurrent: (stationId: string) =>
      client.get(`${API_ROUTES.WEATHER}/stations/${stationId}/current`),

    getForecast: (stationId: string) =>
      client.get(`${API_ROUTES.WEATHER}/stations/${stationId}/forecast`),

    getHistory: (stationId: string, params?: Record<string, string | number | undefined>) =>
      client.get(`${API_ROUTES.WEATHER}/stations/${stationId}/history`, params),

    recordObservation: (data: unknown) =>
      client.post(API_ROUTES.WEATHER, data),
  };
}
