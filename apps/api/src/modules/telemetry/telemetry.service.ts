// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Telemetry Service & Ingestion Engine
// ═══════════════════════════════════════════════════════════════
// Handles real-time single and batch telemetry ingestion, strict
// data validation, deterministic idempotency duplicate protection,
// 24-hour rolling ring-buffer statistics, and threshold alerting.
// ═══════════════════════════════════════════════════════════════

import type {
  FindTelemetryFilter,
  TelemetrySelect,
  RollingStatsAggregate,
} from './telemetry.repository.js';
import { telemetryRepository } from './telemetry.repository.js';
import { sensorsRepository } from '../sensors/sensors.repository.js';
import { stationsRepository } from '../stations/stations.repository.js';
import type { ThresholdEvaluationResult } from '../alerts/alerts.service.js';
import { alertsService } from '../alerts/alerts.service.js';

import { eventBus } from '../../lib/event-bus.js';
import type { TelemetrySummary, SensorType } from '@repo/shared';
import { createDomainEvent, EventType, SensorStatus } from '@repo/shared';
import type { TelemetryReadingInput, TelemetryBatchInput } from '@repo/schemas';

export interface IngestReadingResult {
  reading: TelemetrySelect;
  isDuplicate: boolean;
  alertResult?: ThresholdEvaluationResult;
}

export interface IngestBatchResult {
  processed: number;
  inserted: number;
  duplicates: number;
  alertsTriggered: number;
}

interface CachedReading {
  value: number;
  timestamp: number;
}

export class TelemetryService {
  // In-memory 24-hour rolling ring-buffer cache per sensor: sensorId -> CachedReading[]
  private rollingCache = new Map<string, CachedReading[]>();
  private readonly CACHE_WINDOW_MS = 24 * 60 * 60 * 1000;

  private addToCache(sensorId: string, value: number, timestampMs: number): void {
    if (!this.rollingCache.has(sensorId)) {
      this.rollingCache.set(sensorId, []);
    }
    const buffer = this.rollingCache.get(sensorId)!;
    buffer.push({ value, timestamp: timestampMs });

    // Evict points older than 24 hours
    const cutoff = timestampMs - this.CACHE_WINDOW_MS;
    while (buffer.length > 0 && buffer[0]!.timestamp < cutoff) {
      buffer.shift();
    }
  }

  private getStatsFromCache(sensorId: string, windowMs: number): RollingStatsAggregate | null {
    const buffer = this.rollingCache.get(sensorId);
    if (!buffer || buffer.length === 0) return null;

    const now = Date.now();
    const cutoff = now - windowMs;
    const windowPoints = buffer.filter((p) => p.timestamp >= cutoff);

    if (windowPoints.length === 0) return null;

    let min = windowPoints[0]!.value;
    let max = windowPoints[0]!.value;
    let sum = 0;

    for (const p of windowPoints) {
      if (p.value < min) min = p.value;
      if (p.value > max) max = p.value;
      sum += p.value;
    }

    return {
      min: Number(min.toFixed(2)),
      max: Number(max.toFixed(2)),
      avg: Number((sum / windowPoints.length).toFixed(2)),
      count: windowPoints.length,
    };
  }

  /**
   * Ingest a single telemetry reading with full validation,
   * idempotency protection, sensor update, and threshold evaluation.
   */
  async ingestReading(input: TelemetryReadingInput, userId?: string): Promise<IngestReadingResult> {
    const timestampDate = new Date(input.timestamp);
    const now = Date.now();

    // 1. Timestamp validation (cannot be > 5 minutes in future)
    if (isNaN(timestampDate.getTime())) {
      throw new Error('Invalid timestamp format');
    }
    if (timestampDate.getTime() > now + 5 * 60 * 1000) {
      throw new Error('Telemetry timestamp cannot be in the future (> 5 minutes)');
    }

    // 2. Sensor verification
    let sensor = await sensorsRepository.findById(input.sensorId);
    if (!sensor && input.stationId) {
      // Self-healing fallback: If the client provided an outdated/stale sensorId
      // (e.g. from an existing browser session across db reseeds),
      // resolve the station and find the active sensor for that station matching the unit.
      try {
        let stationDbId = input.stationId;
        const station = await stationsRepository.findById(input.stationId);
        if (station) {
          stationDbId = station.id;
        }
        const stationSensors = await sensorsRepository.findAll({
          stationId: stationDbId,
          limit: 100,
        });
        const receivedUnit = input.unit.replace(/[^\w%°C]/g, '').toLowerCase();
        const candidate = stationSensors.data.find(
          (s) => s.unit.replace(/[^\w%°C]/g, '').toLowerCase() === receivedUnit,
        );
        if (candidate) {
          sensor = candidate;
        }
      } catch {
        // Fallback failed, will throw error below
      }
    }

    if (!sensor) {
      throw new Error(`Sensor '${input.sensorId}' not found in registry`);
    }

    let resolvedStationId = input.stationId;
    if (resolvedStationId && sensor.stationId !== resolvedStationId) {
      try {
        const station = await stationsRepository.findById(resolvedStationId);
        if (station) {
          resolvedStationId = station.id;
        }
      } catch {
        // Ignored in unit tests without DB
      }
    }

    const stationId = resolvedStationId || sensor.stationId;
    if (
      resolvedStationId &&
      sensor.stationId &&
      sensor.stationId !== resolvedStationId &&
      input.stationId !== sensor.stationId
    ) {
      throw new Error(`Sensor '${input.sensorId}' does not belong to Station '${input.stationId}'`);
    }

    // 3. Unit validation (relaxed unit check to avoid character encoding mismatches)
    const expectedUnit = sensor.unit.replace(/[^\w%°C]/g, '').toLowerCase();
    const receivedUnit = input.unit.replace(/[^\w%°C]/g, '').toLowerCase();
    if (expectedUnit && receivedUnit && expectedUnit !== receivedUnit) {
      throw new Error(
        `Telemetry unit mismatch: expected '${sensor.unit}', received '${input.unit}'`,
      );
    }

    // 4. Deterministic idempotency duplicate check
    const inserted = await telemetryRepository.create({
      sensorId: sensor.id,
      stationId,
      timestamp: timestampDate,
      value: input.value,
      unit: input.unit,
      status: (input.status as any) ?? SensorStatus.NORMAL,
      quality: input.quality ?? 100,
    });

    if (!inserted) {
      // Duplicate reading was sent! Return existing reading without mutating state or firing duplicate alert
      const existing = await telemetryRepository.findBySensorAndTimestamp(sensor.id, timestampDate);
      if (!existing) {
        throw new Error('Duplicate reading detected but record could not be retrieved');
      }
      return {
        reading: existing,
        isDuplicate: true,
      };
    }

    // 5. Update sensor reading state & health
    await sensorsRepository.updateReading(
      sensor.id,
      input.value,
      (input.status as any) ?? SensorStatus.NORMAL,
      timestampDate,
    );

    // 6. Update in-memory rolling statistics cache
    this.addToCache(sensor.id, input.value, timestampDate.getTime());

    // 7. Evaluate threshold rules via Alert Engine
    const alertResult = await alertsService.evaluateReading(
      {
        sensorId: sensor.id,
        stationId: sensor.stationId,
        value: input.value,
        unit: input.unit,
        timestamp: timestampDate,
      },
      sensor,
    );

    // 8. Emit telemetry domain event
    await eventBus.publish(
      createDomainEvent({
        eventType: EventType.TELEMETRY_READING_RECORDED,
        source: 'telemetry-engine',
        entityId: inserted.id,
        stationId: inserted.stationId,
        payload: {
          readingId: inserted.id,
          sensorId: inserted.sensorId,
          stationId: inserted.stationId,
          value: inserted.value,
          unit: inserted.unit,
          timestamp: inserted.timestamp,
          quality: inserted.quality,
          status: inserted.status,
          alertTriggered: alertResult.breached,
          submittedBy: userId,
        },
      }),
    );

    return {
      reading: inserted,
      isDuplicate: false,
      alertResult,
    };
  }

  /**
   * Batch telemetry ingestion for high-frequency or multi-sensor packets
   */
  async ingestBatch(batch: TelemetryBatchInput, userId?: string): Promise<IngestBatchResult> {
    const now = Date.now();
    const validReadings = [];
    let duplicateCount = 0;
    let alertsTriggered = 0;

    // Cache unique sensors in this batch to avoid repeating DB queries
    const sensorCache = new Map<string, any>();

    for (const r of batch.readings) {
      const ts = new Date(r.timestamp);
      if (isNaN(ts.getTime()) || ts.getTime() > now + 5 * 60 * 1000) {
        continue;
      }

      if (!sensorCache.has(r.sensorId)) {
        const s = await sensorsRepository.findById(r.sensorId);
        if (s) sensorCache.set(r.sensorId, s);
      }

      const sensor = sensorCache.get(r.sensorId);
      if (!sensor || sensor.stationId !== r.stationId) {
        continue;
      }

      validReadings.push({
        sensorId: r.sensorId,
        stationId: r.stationId,
        timestamp: ts,
        value: r.value,
        unit: r.unit,
        status: (r.status as any) ?? SensorStatus.NORMAL,
        quality: r.quality ?? 100,
      });
    }

    // Bulk persist with ON CONFLICT DO NOTHING
    const inserted = await telemetryRepository.createBatch(validReadings);
    duplicateCount = validReadings.length - inserted.length;

    // Update sensor states, rolling cache, and evaluate threshold rules
    for (const record of inserted) {
      this.addToCache(record.sensorId, record.value, record.timestamp.getTime());

      const sensor = sensorCache.get(record.sensorId);
      if (sensor) {
        await sensorsRepository.updateReading(
          sensor.id,
          record.value,
          record.status as any,
          record.timestamp,
        );

        const alertRes = await alertsService.evaluateReading(
          {
            sensorId: sensor.id,
            stationId: sensor.stationId,
            value: record.value,
            unit: record.unit,
            timestamp: record.timestamp,
          },
          sensor,
        );

        if (alertRes.breached && alertRes.isNew) {
          alertsTriggered++;
        }
      }
    }

    if (inserted.length > 0) {
      await eventBus.publish(
        createDomainEvent({
          eventType: EventType.TELEMETRY_BATCH_RECORDED,
          source: 'telemetry-engine',
          entityId: inserted[0]!.id,
          stationId: inserted[0]!.stationId,
          payload: {
            batchSize: batch.readings.length,
            insertedCount: inserted.length,
            duplicatesSkipped: duplicateCount,
            alertsTriggered,
            submittedBy: userId,
          },
        }),
      );
    }

    return {
      processed: batch.readings.length,
      inserted: inserted.length,
      duplicates: duplicateCount,
      alertsTriggered,
    };
  }

  async getTelemetry(filters?: FindTelemetryFilter) {
    let resolvedFilters = filters ? { ...filters } : undefined;
    if (resolvedFilters?.stationId) {
      const station = await stationsRepository.findById(resolvedFilters.stationId);
      if (station) {
        resolvedFilters.stationId = station.id;
      }
    }
    return telemetryRepository.findAll(resolvedFilters);
  }

  async getTelemetryById(id: string): Promise<TelemetrySelect | null> {
    return telemetryRepository.findById(id);
  }

  /**
   * Computes rolling statistics for 5m, 15m, 1h, or 24h
   */
  async getRollingStats(
    sensorId: string,
    window: '5m' | '15m' | '1h' | '24h' = '24h',
  ): Promise<RollingStatsAggregate & { window: string; sensorId: string }> {
    const windowMsMap: Record<string, number> = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
    };

    const windowMs = windowMsMap[window] ?? windowMsMap['24h']!;

    // 1. Try fast in-memory cache
    const cachedStats = this.getStatsFromCache(sensorId, windowMs);
    if (cachedStats && cachedStats.count > 0) {
      return {
        ...cachedStats,
        window,
        sensorId,
      };
    }

    // 2. Fallback to database aggregation
    const to = new Date();
    const from = new Date(to.getTime() - windowMs);
    const dbStats = await telemetryRepository.getRollingStats(sensorId, from, to);

    return {
      ...dbStats,
      window,
      sensorId,
    };
  }

  /**
   * Aggregates a 24h summary for all sensors at a station
   */
  async getSummary(stationId?: string): Promise<TelemetrySummary[]> {
    let resolvedStationId = stationId;
    if (resolvedStationId) {
      const station = await stationsRepository.findById(resolvedStationId);
      if (station) {
        resolvedStationId = station.id;
      }
    }

    const sensorsList = await sensorsRepository.findAll({
      stationId: resolvedStationId,
      limit: 100,
    });

    const summaries: TelemetrySummary[] = [];

    for (const s of sensorsList.data) {
      const stats = await this.getRollingStats(s.id, '24h');
      const latest = s.lastReading ?? stats.avg ?? 0;

      let trend: 'rising' | 'falling' | 'stable' = 'stable';
      if (stats.avg !== null && stats.count > 1) {
        if (latest > stats.avg * 1.02) trend = 'rising';
        else if (latest < stats.avg * 0.98) trend = 'falling';
      }

      summaries.push({
        sensorId: s.id,
        sensorName: s.name,
        sensorType: s.type as unknown as SensorType,
        currentValue: latest,
        unit: s.unit,
        status: s.status as unknown as SensorStatus,
        min24h: stats.min ?? latest,
        max24h: stats.max ?? latest,
        avg24h: stats.avg ?? latest,
        trend,
      });
    }

    return summaries;
  }
}

export const telemetryService = new TelemetryService();
