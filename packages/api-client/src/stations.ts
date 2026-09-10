import type { Station, StationOverview, PaginatedResponse } from '@repo/shared';
import { API_ROUTES } from '@repo/shared';
import type { ApiClient } from './client.js';

export function createStationsApi(client: ApiClient) {
  return {
    list: (params?: Record<string, string | number | undefined>) =>
      client.get<PaginatedResponse<Station>>(API_ROUTES.STATIONS, params),

    getById: (id: string) => client.get<Station>(`${API_ROUTES.STATIONS}/${id}`),

    getOverview: (id: string) =>
      client.get<StationOverview>(`${API_ROUTES.STATIONS}/${id}/overview`),

    getAssets: (id: string, params?: Record<string, string | number | undefined>) =>
      client.get(`${API_ROUTES.STATIONS}/${id}/assets`, params),

    getTelemetry: (id: string, params?: Record<string, string | number | undefined>) =>
      client.get(`${API_ROUTES.STATIONS}/${id}/telemetry`, params),
  };
}
