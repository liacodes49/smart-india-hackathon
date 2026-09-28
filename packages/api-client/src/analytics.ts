import type { ApiClient } from './client.js';
import {
  API_ROUTES,
  type HistoricalEnergyTrend,
  type HistoricalFuelTrend,
  type StationReliabilityMetrics,
  type StationReportExport,
} from '@repo/shared';

export function createAnalyticsApi(client: ApiClient) {
  return {
    getEnergyTrend: (stationId: string, params: { startTime: string; endTime: string; resolution?: 'hourly' | 'daily' }) =>
      client.get<HistoricalEnergyTrend>(`${API_ROUTES.ANALYTICS}/energy/${stationId}`, params),

    getFuelTrend: (stationId: string, params: { startTime: string; endTime: string; resolution?: 'hourly' | 'daily' }) =>
      client.get<HistoricalFuelTrend>(`${API_ROUTES.ANALYTICS}/fuel/${stationId}`, params),

    getReliability: (stationId: string, params?: { periodStart?: string; periodEnd?: string }) =>
      client.get<StationReliabilityMetrics>(`${API_ROUTES.ANALYTICS}/reliability/${stationId}`, params),

    generateReport: (data: unknown) =>
      client.post<StationReportExport>(`${API_ROUTES.ANALYTICS}/reports/generate`, data),

    exportReport: (params: { stationId: string; type: string; format: 'JSON' | 'CSV'; periodStart: string; periodEnd: string }) =>
      client.get<StationReportExport | string>(`${API_ROUTES.ANALYTICS}/reports/export`, params as any),
  };
}
