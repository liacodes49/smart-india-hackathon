// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Industrial Gateway Ingestion Service
// ═══════════════════════════════════════════════════════════════
// Multi-protocol ingestion router, backpressure bounding, dead-letter
// quarantine buffer, and delegation to TelemetryService.ingestBatch.
// ═══════════════════════════════════════════════════════════════

import crypto from 'node:crypto';
import {
  GatewayProtocol,
  type GatewayStats,
  type DeadLetterItem,
  type GatewayIngestResult,
  EventType,
  createDomainEvent,
} from '@repo/shared';
import {
  type IGatewayAdapter,
  RestGatewayAdapter,
  MqttGatewayAdapter,
  ModbusGatewayAdapter,
  ManualGatewayAdapter,
} from './gateway.adapter.js';
import { stationsRepository } from '../stations/stations.repository.js';
import { telemetryService, type TelemetryService } from '../telemetry/telemetry.service.js';
import { eventBus } from '../../lib/event-bus.js';
import { logger } from '../../config/logger.js';
import type { GatewayIngestBodyInput } from '@repo/schemas';

export class GatewayService {
  private adapters = new Map<GatewayProtocol, IGatewayAdapter>();

  // Bounded in-memory dead-letter buffer (max 100 items to prevent memory leaks)
  private deadLetterQueue: DeadLetterItem[] = [];
  private readonly MAX_DEAD_LETTER_CAPACITY = 100;
  private readonly MAX_BATCH_CAPACITY = 500;

  // Ingestion metrics counters
  private stats: GatewayStats = {
    totalIngested: 0,
    totalAccepted: 0,
    totalQuarantined: 0,
    byProtocol: {
      [GatewayProtocol.REST]: 0,
      [GatewayProtocol.MQTT]: 0,
      [GatewayProtocol.MODBUS]: 0,
      [GatewayProtocol.MANUAL]: 0,
    },
    lastIngestAt: undefined,
  };

  constructor(private readonly telService: TelemetryService = telemetryService) {
    this.registerAdapter(new RestGatewayAdapter());
    this.registerAdapter(new MqttGatewayAdapter());
    this.registerAdapter(new ModbusGatewayAdapter());
    this.registerAdapter(new ManualGatewayAdapter());
  }

  registerAdapter(adapter: IGatewayAdapter): void {
    this.adapters.set(adapter.protocol, adapter);
  }

  /**
   * Ingest multi-protocol payload, normalize to canonical contract,
   * enforce backpressure limits, and route to TelemetryService.ingestBatch.
   */
  async ingest(
    protocol: GatewayProtocol,
    input: GatewayIngestBodyInput
  ): Promise<GatewayIngestResult> {
    const adapter = this.adapters.get(protocol);
    if (!adapter) {
      throw new Error(`Unsupported gateway protocol: '${protocol}'`);
    }

    const station = await stationsRepository.findById(input.stationId);
    if (!station) {
      throw new Error(`Station '${input.stationId}' not found in registry`);
    }

    const batchId = crypto.randomUUID();
    const now = new Date().toISOString();

    logger.info(`[GatewayService] Ingesting ${protocol} payload for station '${station.stationId}'`, {
      batchId,
      stationId: station.id,
      protocol,
    });

    // 1. Normalize payload using protocol-specific adapter
    const normResult = adapter.normalize(input.payload, station.id);

    // 2. Enforce batch size backpressure limit
    if (normResult.readings.length > this.MAX_BATCH_CAPACITY) {
      throw new Error(
        `Batch exceeds maximum allowable backpressure threshold (${this.MAX_BATCH_CAPACITY} readings)`
      );
    }

    // 3. Handle quarantined records safely
    if (normResult.quarantined.length > 0) {
      for (const q of normResult.quarantined) {
        const dlItem: DeadLetterItem = {
          id: crypto.randomUUID(),
          protocol,
          stationId: station.id,
          reason: q.reason,
          code: q.code,
          rawPayload: q.raw,
          quarantinedAt: now,
        };

        this.deadLetterQueue.push(dlItem);
        if (this.deadLetterQueue.length > this.MAX_DEAD_LETTER_CAPACITY) {
          this.deadLetterQueue.shift(); // FIFO eviction for bounded memory
        }

        logger.warn(`[GatewayService] Quarantined malformed ${protocol} reading: [${q.code}] ${q.reason}`);
      }

      await eventBus.publish(
        createDomainEvent({
          eventType: EventType.GATEWAY_PAYLOAD_QUARANTINED,
          source: `gateway-${protocol.toLowerCase()}`,
          entityId: batchId,
          stationId: station.id,
          payload: {
            batchId,
            protocol,
            quarantinedCount: normResult.quarantined.length,
          },
        })
      );
    }

    // 4. Ingest valid readings via Canonical Telemetry Pipeline
    let acceptedCount = 0;
    let duplicateCount = 0;
    let alertsTriggered = 0;

    if (normResult.readings.length > 0) {
      const batchResult = await this.telService.ingestBatch({
        readings: normResult.readings.map((r) => ({
          sensorId: r.sensorId,
          stationId: station.id,
          timestamp: r.timestamp,
          value: r.value,
          unit: r.unit,
          status: r.status ?? 'NORMAL',
          quality: r.quality ?? 100,
        })),
      });

      acceptedCount = batchResult.inserted;
      duplicateCount = batchResult.duplicates;
      alertsTriggered = batchResult.alertsTriggered;

      await eventBus.publish(
        createDomainEvent({
          eventType: EventType.GATEWAY_TELEMETRY_INGESTED,
          source: `gateway-${protocol.toLowerCase()}`,
          entityId: batchId,
          stationId: station.id,
          payload: {
            batchId,
            protocol,
            acceptedCount,
            duplicateCount,
            alertsTriggered,
          },
        })
      );
    }

    // 5. Update Ingestion Statistics
    this.stats.totalIngested += normResult.readings.length + normResult.quarantined.length;
    this.stats.totalAccepted += acceptedCount;
    this.stats.totalQuarantined += normResult.quarantined.length;
    this.stats.byProtocol[protocol] = (this.stats.byProtocol[protocol] ?? 0) + 1;
    this.stats.lastIngestAt = now;

    return {
      protocol,
      stationId: station.id,
      acceptedCount,
      quarantinedCount: normResult.quarantined.length,
      duplicateCount,
      alertsTriggered,
      batchId,
      timestamp: now,
    };
  }

  /**
   * Return gateway ingestion metrics
   */
  getStats(): GatewayStats {
    return { ...this.stats };
  }

  /**
   * Return quarantined dead-letter items
   */
  getDeadLetter(stationId?: string, protocol?: GatewayProtocol): DeadLetterItem[] {
    return this.deadLetterQueue.filter((item) => {
      if (stationId && item.stationId !== stationId) return false;
      if (protocol && item.protocol !== protocol) return false;
      return true;
    });
  }

  /**
   * Clear dead letter queue (useful for test teardown)
   */
  clearDeadLetter(): void {
    this.deadLetterQueue = [];
  }
}

export const gatewayService = new GatewayService();
