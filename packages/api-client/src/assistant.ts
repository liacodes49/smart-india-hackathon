import type { ApiClient } from './client.js';
import { API_ROUTES } from '@repo/shared';

export function createAssistantApi(client: ApiClient) {
  return {
    query: (data: { query: string; stationId?: string; sessionId?: string }) =>
      client.post(`${API_ROUTES.ASSISTANT}/query`, data),
  };
}
