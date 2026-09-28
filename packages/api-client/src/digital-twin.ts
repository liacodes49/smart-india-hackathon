import type { ApiClient } from './client.js';
import { API_ROUTES } from '@repo/shared';

export function createDigitalTwinApi(client: ApiClient) {
  return {
    getStationTwin: (stationId: string) =>
      client.get(`${API_ROUTES.DIGITAL_TWIN}/stations/${stationId}`),

    getZoneTwin: (stationId: string, zoneId: string) =>
      client.get(`${API_ROUTES.DIGITAL_TWIN}/stations/${stationId}/zones/${zoneId}`),
  };
}
