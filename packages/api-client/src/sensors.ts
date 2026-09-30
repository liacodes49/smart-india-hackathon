import { API_ROUTES } from '@repo/shared';
import type { ApiClient } from './client.js';

export interface Sensor {
  id: string;
  assetId: string;
  stationId: string;
  name: string;
  type: string;
  unit: string;
  minThreshold: number | null;
  maxThreshold: number | null;
  warningThreshold: number | null;
  criticalThreshold: number | null;
  status: string;
  lastReading: number | null;
  lastReadingAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export function createSensorsApi(client: ApiClient) {
  return {
    list: (params?: Record<string, string | number | undefined>) =>
      client.get<Sensor[]>(API_ROUTES.SENSORS, params),

    getById: (id: string) =>
      client.get<Sensor>(`${API_ROUTES.SENSORS}/${id}`),

    create: (data: unknown) =>
      client.post<Sensor>(API_ROUTES.SENSORS, data),

    update: (id: string, data: unknown) =>
      client.put<Sensor>(`${API_ROUTES.SENSORS}/${id}`, data),
  };
}
