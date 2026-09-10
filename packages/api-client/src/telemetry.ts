import type { TelemetryReading, TelemetrySummary } from '@repo/shared';
import { API_ROUTES } from '@repo/shared';
import type { ApiClient } from './client.js';

export function createTelemetryApi(client: ApiClient) {
  return {
    list: (params?: Record<string, string | number | undefined>) =>
      client.get<TelemetryReading[]>(API_ROUTES.TELEMETRY, params),

    getById: (id: string) => client.get<TelemetryReading>(`${API_ROUTES.TELEMETRY}/${id}`),

    getSummary: (stationId: string) =>
      client.get<TelemetrySummary[]>(`${API_ROUTES.TELEMETRY}/summary`, { stationId }),

    ingest: (readings: unknown) => client.post(API_ROUTES.TELEMETRY, readings),
  };
}
