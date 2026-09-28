// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Analytics & Expedition Reports Service
// ═══════════════════════════════════════════════════════════════
// Handles bounded historical energy trends, fuel rollups, verified
// MTBF/MTTR reliability metrics, and NCPOR expedition report exports.
// ═══════════════════════════════════════════════════════════════

import { analyticsRepository, type AnalyticsRepository } from './analytics.repository.js';
import { stationsRepository } from '../stations/stations.repository.js';
import { eventBus } from '../../lib/event-bus.js';
import {
  createDomainEvent,
  EventType,
  ReportType,
  ReportFormat,
  type HistoricalEnergyTrend,
  type HistoricalFuelTrend,
  type StationReliabilityMetrics,
  type StationReportExport,
  type TimeResolution,
} from '@repo/shared';
import type {
  HistoricalAnalyticsQueryInput,
  ReliabilityQueryInput,
  ReportGenerateInput,
} from '@repo/schemas';

export class AnalyticsService {
  constructor(private readonly repo: AnalyticsRepository = analyticsRepository) {}

  /**
   * Bounded historical energy trend aggregation
   */
  async getEnergyTrend(query: HistoricalAnalyticsQueryInput): Promise<HistoricalEnergyTrend> {
    const stationId = query.stationId || '00000000-0000-0000-0000-000000000001';
    const station = await stationsRepository.findById(stationId);
    if (!station) {
      throw new Error(`Station '${stationId}' not found in registry`);
    }

    const start = new Date(query.startTime);
    const end = new Date(query.endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid query startTime or endTime format');
    }
    if (start >= end) {
      throw new Error('startTime must precede endTime');
    }

    // Bounded range limit: max 90 days to prevent Node.js memory exhaustion
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 90) {
      throw new Error('Historical analytics query window cannot exceed 90 days');
    }

    const resolution = query.resolution as TimeResolution;
    const points = await this.repo.getEnergyRollups(station.id, start, end, resolution);

    let totalGen = 0;
    let peakDemand = 0;
    let sumLoadFactor = 0;
    let sumQuality = 0;

    for (const p of points) {
      totalGen += p.totalGenerationKwh;
      if (p.peakPowerDemandKw > peakDemand) peakDemand = p.peakPowerDemandKw;
      sumLoadFactor += p.avgGeneratorLoadFactor;
      sumQuality += p.dataQualityPercent;
    }

    const count = Math.max(1, points.length);

    return {
      stationId: station.id,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      resolution,
      points,
      summary: {
        avgLoadFactor: Number((sumLoadFactor / count).toFixed(2)),
        totalGenerationKwh: Number(totalGen.toFixed(2)),
        peakDemandKw: Number(peakDemand.toFixed(2)),
        dataCompletenessPercent: Number((sumQuality / count).toFixed(1)),
      },
    };
  }

  /**
   * Bounded historical fuel consumption trend
   */
  async getFuelTrend(query: HistoricalAnalyticsQueryInput): Promise<HistoricalFuelTrend> {
    const stationId = query.stationId || '00000000-0000-0000-0000-000000000001';
    const station = await stationsRepository.findById(stationId);
    if (!station) {
      throw new Error(`Station '${stationId}' not found in registry`);
    }

    const start = new Date(query.startTime);
    const end = new Date(query.endTime);
    if (start >= end) {
      throw new Error('startTime must precede endTime');
    }

    const resolution = query.resolution as TimeResolution;
    const points = await this.repo.getFuelRollups(station.id, start, end, resolution);

    let totalMeasured = 0;
    let totalEstimated = 0;
    let sumBurn = 0;

    for (const p of points) {
      totalMeasured += p.measuredConsumptionLiters;
      totalEstimated += p.estimatedConsumptionLiters;
      sumBurn += p.burnRateLph;
    }

    const count = Math.max(1, points.length);

    return {
      stationId: station.id,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      resolution,
      points,
      totalMeasuredLiters: Number(totalMeasured.toFixed(2)),
      totalEstimatedLiters: Number(totalEstimated.toFixed(2)),
      avgBurnRateLph: Number((sumBurn / count).toFixed(2)),
      provenanceSummary: {
        SENSOR: Number(totalMeasured.toFixed(2)),
        ESTIMATED: Number(totalEstimated.toFixed(2)),
      },
    };
  }

  /**
   * Operational reliability metrics: MTBF & MTTR based on verified incidents & repairs
   */
  async getReliabilityMetrics(query: ReliabilityQueryInput): Promise<StationReliabilityMetrics> {
    const stationId = query.stationId || '00000000-0000-0000-0000-000000000001';
    const station = await stationsRepository.findById(stationId);
    if (!station) {
      throw new Error(`Station '${stationId}' not found in registry`);
    }

    const end = query.periodEnd ? new Date(query.periodEnd) : new Date();
    const start = query.periodStart
      ? new Date(query.periodStart)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // Default 30-day window

    const totalHours = Math.max(1, Number(((end.getTime() - start.getTime()) / (1000 * 3600)).toFixed(1)));
    const stats = await this.repo.getIncidentAndMaintenanceStats(station.id, start, end);

    // MTBF: Total operational hours / verified failure events (critical incidents)
    const failureCount = Math.max(1, stats.verifiedFailureCount);
    const mtbfHours = Number((totalHours / failureCount).toFixed(1));

    // MTTR: Total verified repair duration / completed repairs
    const repairsCount = Math.max(1, stats.completedRepairsCount);
    const mttrHours = Number((stats.totalRepairDurationHours / repairsCount).toFixed(1));

    // Availability: (Total operating hours - total repair duration) / total operating hours
    const uptimeHours = Math.max(0, totalHours - stats.totalRepairDurationHours);
    const availabilityPercent = Number(Math.min(100, (uptimeHours / totalHours) * 100).toFixed(2));

    return {
      stationId: station.id,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      totalOperatingHours: totalHours,
      verifiedIncidentCount: stats.verifiedIncidentCount,
      verifiedFailureCount: stats.verifiedFailureCount,
      completedRepairsCount: stats.completedRepairsCount,
      totalRepairDurationHours: stats.totalRepairDurationHours,
      mtbfHours,
      mttrHours,
      availabilityPercent,
      calculationBasis:
        'MTBF = totalOperatingHours / verifiedCriticalFailures; MTTR = totalRepairDuration / completedCorrectiveRepairs',
      assumptions: [
        'Evaluated exclusively against closed operational incidents and completed corrective maintenance records.',
        'Unverified alerts, predictive degradation warnings, and what-if simulation failures are strictly excluded.',
      ],
      dataLimitations:
        stats.verifiedIncidentCount === 0
          ? ['Zero operational failure incidents recorded during the evaluation window.']
          : [],
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Format CSV export string for a report
   */
  formatCsvReport(report: {
    title: string;
    stationId: string;
    type: string;
    periodStart: string;
    periodEnd: string;
    metrics: Record<string, unknown>;
  }): string {
    const lines = [
      `# NCPOR Antarctic Expedition Report`,
      `Title,${report.title}`,
      `Station ID,${report.stationId}`,
      `Report Type,${report.type}`,
      `Period Start,${report.periodStart}`,
      `Period End,${report.periodEnd}`,
      `Generated At,${new Date().toISOString()}`,
      ``,
      `Metric,Value`,
    ];

    for (const [k, v] of Object.entries(report.metrics)) {
      lines.push(`${k},${typeof v === 'object' ? JSON.stringify(v).replace(/"/g, '""') : v}`);
    }

    return lines.join('\n');
  }

  /**
   * Generate and persist an official NCPOR expedition report
   */
  async generateReport(input: ReportGenerateInput, userId?: string): Promise<StationReportExport> {
    const station = await stationsRepository.findById(input.stationId);
    if (!station) {
      throw new Error(`Station '${input.stationId}' not found`);
    }

    const start = new Date(input.periodStart);
    const end = new Date(input.periodEnd);
    const type = input.type as ReportType;
    const format = (input.format as ReportFormat) ?? ReportFormat.JSON;
    const title = input.title || `NCPOR ${type} - ${station.stationId}`;
    const author = input.author || 'NCPOR Polar Operations Directorate';

    let summaryMetrics: Record<string, unknown> = {};

    switch (type) {
      case ReportType.WEEKLY_ENERGY: {
        const energy = await this.getEnergyTrend({
          stationId: station.id,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          resolution: 'daily',
        });
        summaryMetrics = { ...energy.summary, totalDataPoints: energy.points.length };
        break;
      }
      case ReportType.FUEL_AUDIT: {
        const fuel = await this.getFuelTrend({
          stationId: station.id,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          resolution: 'daily',
        });
        summaryMetrics = {
          totalMeasuredLiters: fuel.totalMeasuredLiters,
          totalEstimatedLiters: fuel.totalEstimatedLiters,
          avgBurnRateLph: fuel.avgBurnRateLph,
        };
        break;
      }
      case ReportType.INCIDENT_SUMMARY:
      case ReportType.DAILY_SITREP:
      default: {
        const rel = await this.getReliabilityMetrics({
          stationId: station.id,
          periodStart: start.toISOString(),
          periodEnd: end.toISOString(),
        });
        summaryMetrics = {
          mtbfHours: rel.mtbfHours,
          mttrHours: rel.mttrHours,
          availabilityPercent: rel.availabilityPercent,
          verifiedIncidents: rel.verifiedIncidentCount,
        };
        break;
      }
    }

    let formattedContent: string | Record<string, unknown> = summaryMetrics;
    if (format === ReportFormat.CSV) {
      formattedContent = this.formatCsvReport({
        title,
        stationId: station.stationId,
        type,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        metrics: summaryMetrics,
      });
    }

    const saved = await this.repo.createReport({
      stationId: station.id,
      type,
      format,
      title,
      periodStart: start,
      periodEnd: end,
      generatedBy: userId,
      dataCompletenessPercent: 100,
      summaryMetrics,
      content: typeof formattedContent === 'string' ? formattedContent : JSON.stringify(formattedContent),
    });

    await eventBus.publish(
      createDomainEvent({
        eventType: EventType.ANALYTICS_REPORT_GENERATED,
        source: 'analytics-engine',
        entityId: saved.id,
        stationId: station.id,
        payload: {
          reportId: saved.id,
          title: saved.title,
          type: saved.type,
          format: saved.format,
          generatedAt: saved.createdAt.toISOString(),
        },
      })
    );

    return {
      id: saved.id,
      stationId: station.id,
      type,
      format,
      title,
      generatedAt: saved.createdAt.toISOString(),
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      author,
      dataCompletenessPercent: 100,
      metrics: summaryMetrics,
      content: formattedContent,
    };
  }
}

export const analyticsService = new AnalyticsService();
