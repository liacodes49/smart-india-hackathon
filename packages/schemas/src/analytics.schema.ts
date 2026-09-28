import { z } from 'zod';

export const historicalAnalyticsQuerySchema = z.object({
  stationId: z.string().min(1).optional(),
  startTime: z.string().datetime().or(z.string().min(1)),
  endTime: z.string().datetime().or(z.string().min(1)),
  resolution: z.enum(['hourly', 'daily']).default('hourly'),
});
export type HistoricalAnalyticsQueryInput = z.infer<typeof historicalAnalyticsQuerySchema>;

export const reliabilityQuerySchema = z.object({
  stationId: z.string().min(1).optional(),
  periodStart: z.string().datetime().or(z.string().min(1)).optional(),
  periodEnd: z.string().datetime().or(z.string().min(1)).optional(),
});
export type ReliabilityQueryInput = z.infer<typeof reliabilityQuerySchema>;

export const reportGenerateSchema = z.object({
  stationId: z.string().min(1),
  type: z.enum(['DAILY_SITREP', 'WEEKLY_ENERGY', 'FUEL_AUDIT', 'INCIDENT_SUMMARY']),
  format: z.enum(['JSON', 'CSV']).default('JSON'),
  title: z.string().min(1).optional(),
  periodStart: z.string().datetime().or(z.string().min(1)),
  periodEnd: z.string().datetime().or(z.string().min(1)),
  author: z.string().optional(),
});
export type ReportGenerateInput = z.infer<typeof reportGenerateSchema>;

export const reportExportQuerySchema = z.object({
  stationId: z.string().min(1),
  type: z.enum(['DAILY_SITREP', 'WEEKLY_ENERGY', 'FUEL_AUDIT', 'INCIDENT_SUMMARY']),
  format: z.enum(['JSON', 'CSV']).default('CSV'),
  periodStart: z.string().datetime().or(z.string().min(1)),
  periodEnd: z.string().datetime().or(z.string().min(1)),
});
export type ReportExportQueryInput = z.infer<typeof reportExportQuerySchema>;
