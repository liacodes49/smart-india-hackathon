// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Analytics & Expedition Reports Tests
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyticsService } from '../../src/modules/analytics/analytics.service.js';
import { analyticsRepository } from '../../src/modules/analytics/analytics.repository.js';
import { stationsRepository } from '../../src/modules/stations/stations.repository.js';
import { ReportType, ReportFormat } from '@repo/shared';

describe('Historical Analytics, Reliability & NCPOR Reports Engine', () => {
  const stationId = '00000000-0000-0000-0000-000000000001';

  const mockStation: any = {
    id: stationId,
    stationId: 'MAITRI',
    name: 'Maitri Research Station',
    latitude: -70.767,
    longitude: 11.733,
    altitude: 117,
    status: 'OPERATIONAL',
    timezone: 'UTC+5:30',
    description: 'Central Antarctic Station',
    imageUrl: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(stationsRepository, 'findById').mockResolvedValue(mockStation);
  });

  describe('1. Bounded Historical Energy Analytics', () => {
    it('computes hourly rollups, load factors, and summary metrics', async () => {
      vi.spyOn(analyticsRepository, 'getEnergyRollups').mockResolvedValue([
        {
          bucket: '2026-09-16T10:00:00Z',
          avgPowerDemandKw: 55.4,
          peakPowerDemandKw: 68.2,
          minPowerDemandKw: 42.1,
          totalGenerationKwh: 55.4,
          avgGeneratorLoadFactor: 0.46,
          sampleCount: 60,
          dataQualityPercent: 100,
        },
        {
          bucket: '2026-09-16T11:00:00Z',
          avgPowerDemandKw: 58.1,
          peakPowerDemandKw: 72.0,
          minPowerDemandKw: 45.0,
          totalGenerationKwh: 58.1,
          avgGeneratorLoadFactor: 0.48,
          sampleCount: 60,
          dataQualityPercent: 100,
        },
      ]);

      const result = await analyticsService.getEnergyTrend({
        stationId,
        startTime: '2026-09-16T10:00:00Z',
        endTime: '2026-09-16T12:00:00Z',
        resolution: 'hourly',
      });

      expect(result.points.length).toBe(2);
      expect(result.summary.totalGenerationKwh).toBe(113.5);
      expect(result.summary.peakDemandKw).toBe(72.0);
      expect(result.summary.avgLoadFactor).toBe(0.47);
      expect(result.summary.dataCompletenessPercent).toBe(100);
    });

    it('enforces bounded query window and rejects time range > 90 days', async () => {
      await expect(
        analyticsService.getEnergyTrend({
          stationId,
          startTime: '2026-01-01T00:00:00Z',
          endTime: '2026-06-01T00:00:00Z', // > 90 days
          resolution: 'daily',
        })
      ).rejects.toThrow(/cannot exceed 90 days/);
    });

    it('rejects invalid query when startTime is after endTime', async () => {
      await expect(
        analyticsService.getEnergyTrend({
          stationId,
          startTime: '2026-09-16T12:00:00Z',
          endTime: '2026-09-16T10:00:00Z',
          resolution: 'hourly',
        })
      ).rejects.toThrow(/startTime must precede endTime/);
    });
  });

  describe('2. Historical Fuel Analytics', () => {
    it('aggregates measured consumption and exposes provenance distinctions', async () => {
      vi.spyOn(analyticsRepository, 'getFuelRollups').mockResolvedValue([
        {
          bucket: '2026-09-15T00:00:00Z',
          measuredConsumptionLiters: 320.0,
          estimatedConsumptionLiters: 336.0,
          burnRateLph: 13.33,
          ambientTempC: -28.5,
          thermalPenaltyPercent: 12.0,
          provenance: 'SENSOR' as any,
        },
      ]);

      const result = await analyticsService.getFuelTrend({
        stationId,
        startTime: '2026-09-15T00:00:00Z',
        endTime: '2026-09-16T00:00:00Z',
        resolution: 'daily',
      });

      expect(result.totalMeasuredLiters).toBe(320.0);
      expect(result.totalEstimatedLiters).toBe(336.0);
      expect(result.provenanceSummary.SENSOR).toBe(320.0);
    });
  });

  describe('3. Operational Reliability Metrics (MTBF & MTTR)', () => {
    it('calculates MTBF and MTTR strictly grounded in verified incident and maintenance records', async () => {
      vi.spyOn(analyticsRepository, 'getIncidentAndMaintenanceStats').mockResolvedValue({
        verifiedIncidentCount: 4,
        verifiedFailureCount: 2, // 2 critical failures
        completedRepairsCount: 2, // 2 completed repairs
        totalRepairDurationHours: 6.0, // 6 total repair hours
      });

      const metrics = await analyticsService.getReliabilityMetrics({
        stationId,
        periodStart: '2026-08-16T00:00:00Z',
        periodEnd: '2026-09-16T00:00:00Z', // 744 total hours (31 days)
      });

      expect(metrics.verifiedFailureCount).toBe(2);
      expect(metrics.completedRepairsCount).toBe(2);
      // MTBF = 744 / 2 = 372 hours
      expect(metrics.mtbfHours).toBeCloseTo(372, 0);
      // MTTR = 6.0 / 2 = 3.0 hours
      expect(metrics.mttrHours).toBe(3.0);
      expect(metrics.availabilityPercent).toBeGreaterThan(99);
      expect(metrics.assumptions.length).toBeGreaterThan(0);
    });
  });

  describe('4. NCPOR Expedition Reports & CSV Exporter', () => {
    it('generates an official NCPOR weekly energy report', async () => {
      vi.spyOn(analyticsRepository, 'getEnergyRollups').mockResolvedValue([
        {
          bucket: '2026-09-16T00:00:00Z',
          avgPowerDemandKw: 52.0,
          peakPowerDemandKw: 65.0,
          minPowerDemandKw: 40.0,
          totalGenerationKwh: 1248.0,
          avgGeneratorLoadFactor: 0.43,
          sampleCount: 1440,
          dataQualityPercent: 100,
        },
      ]);

      vi.spyOn(analyticsRepository, 'createReport').mockResolvedValue({
        id: 'rep-uuid-001',
        stationId,
        type: 'WEEKLY_ENERGY',
        format: 'JSON',
        title: 'NCPOR WEEKLY_ENERGY - MAITRI',
        periodStart: new Date('2026-09-09T00:00:00Z'),
        periodEnd: new Date('2026-09-16T00:00:00Z'),
        generatedBy: null,
        dataCompletenessPercent: 100,
        summaryMetrics: { totalGenerationKwh: 1248.0 },
        content: null,
        createdAt: new Date(),
      });

      const report = await analyticsService.generateReport({
        stationId,
        type: ReportType.WEEKLY_ENERGY,
        format: ReportFormat.JSON,
        periodStart: '2026-09-09T00:00:00Z',
        periodEnd: '2026-09-16T00:00:00Z',
      });

      expect(report.type).toBe(ReportType.WEEKLY_ENERGY);
      expect(report.metrics).toHaveProperty('totalGenerationKwh');
    });

    it('generates a formatted CSV report export with metadata headers', async () => {
      vi.spyOn(analyticsRepository, 'getIncidentAndMaintenanceStats').mockResolvedValue({
        verifiedIncidentCount: 1,
        verifiedFailureCount: 1,
        completedRepairsCount: 1,
        totalRepairDurationHours: 2.5,
      });

      vi.spyOn(analyticsRepository, 'createReport').mockResolvedValue({
        id: 'rep-uuid-csv',
        stationId,
        type: 'INCIDENT_SUMMARY',
        format: 'CSV',
        title: 'NCPOR INCIDENT_SUMMARY - MAITRI',
        periodStart: new Date('2026-09-01T00:00:00Z'),
        periodEnd: new Date('2026-09-16T00:00:00Z'),
        generatedBy: null,
        dataCompletenessPercent: 100,
        summaryMetrics: { mtbfHours: 360, mttrHours: 2.5 },
        content: 'CSV CONTENT',
        createdAt: new Date(),
      });

      const report = await analyticsService.generateReport({
        stationId,
        type: ReportType.INCIDENT_SUMMARY,
        format: ReportFormat.CSV,
        periodStart: '2026-09-01T00:00:00Z',
        periodEnd: '2026-09-16T00:00:00Z',
      });

      expect(report.format).toBe(ReportFormat.CSV);
      expect(typeof report.content).toBe('string');
      expect(report.content).toContain('# NCPOR Antarctic Expedition Report');
      expect(report.content).toContain('Station ID,MAITRI');
    });
  });
});
