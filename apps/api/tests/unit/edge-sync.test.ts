// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Edge Synchronization & Resilience Tests
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { edgeService } from '../../src/modules/edge/edge.service.js';
import { edgeRepository } from '../../src/modules/edge/edge.repository.js';
import { stationsRepository } from '../../src/modules/stations/stations.repository.js';
import { telemetryService } from '../../src/modules/telemetry/telemetry.service.js';
import { eventBus } from '../../src/lib/event-bus.js';
import {
  ConnectivityState,
  SyncStatus,
  DataProvenance,
  EventType,
} from '@repo/shared';

describe('Edge Synchronization & Offline Resilience Engine', () => {
  const stationId = '00000000-0000-0000-0000-000000000001';
  const edgeNodeId = 'maitri-edge-node-alpha';

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

  describe('1. Satellite Connectivity State Machine & Live Isolation Invariant', () => {
    it('defaults station connectivity to ONLINE without mutating production station status', async () => {
      const state = await edgeService.getConnectivity(stationId);
      expect(state.state).toBe(ConnectivityState.ONLINE);
      expect(mockStation.status).toBe('OPERATIONAL'); // Live operational status untouched
    });

    it('transitions to BLACKOUT, emits domain event, and preserves live station status', async () => {
      const eventSpy = vi.spyOn(eventBus, 'publish').mockResolvedValue();

      const updated = await edgeService.setConnectivity({
        stationId,
        state: 'BLACKOUT',
        reason: 'Severe solar storm geomagnetic scintillation',
      });

      expect(updated.state).toBe(ConnectivityState.BLACKOUT);
      expect(updated.previousState).toBe(ConnectivityState.ONLINE);
      expect(mockStation.status).toBe('OPERATIONAL'); // Unrelated station state is NOT mutated

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.EDGE_CONNECTIVITY_CHANGED,
          payload: expect.objectContaining({
            stationId,
            state: ConnectivityState.BLACKOUT,
            previousState: ConnectivityState.ONLINE,
          }),
        })
      );
    });

    it('restores connectivity to ONLINE upon link re-establishment', async () => {
      const updated = await edgeService.setConnectivity({
        stationId,
        state: 'ONLINE',
        reason: 'Satellite telemetry uplink restored',
      });

      expect(updated.state).toBe(ConnectivityState.ONLINE);
      const current = await edgeService.getConnectivity(stationId);
      expect(current.state).toBe(ConnectivityState.ONLINE);
    });
  });

  describe('2. Local Edge Outbox Buffering During Blackout', () => {
    it('enqueues telemetry reading in edge outbox with PENDING status', async () => {
      const mockOutboxRecord: any = {
        id: 'outbox-uuid-001',
        stationId,
        edgeNodeId,
        sequenceNumber: 101,
        idempotencyKey: 'idemp-outbox-101',
        eventType: 'telemetry.recorded',
        payload: { sensorId: 'sensor-gen-01', value: 45.2, unit: 'kW' },
        status: 'PENDING',
        observedAt: new Date('2026-09-16T10:00:00Z'),
        retryCount: 0,
        lastError: null,
        createdAt: new Date(),
        syncedAt: null,
      };

      vi.spyOn(edgeRepository, 'findOutboxByIdempotencyKey').mockResolvedValue(null);
      vi.spyOn(edgeRepository, 'enqueueOutbox').mockResolvedValue(mockOutboxRecord);

      const enqueued = await edgeService.enqueueOutbox({
        stationId,
        edgeNodeId,
        sequenceNumber: 101,
        idempotencyKey: 'idemp-outbox-101',
        eventType: 'telemetry.recorded',
        observedAt: '2026-09-16T10:00:00Z',
        payload: { sensorId: 'sensor-gen-01', value: 45.2, unit: 'kW' },
      });

      expect(enqueued.id).toBe('outbox-uuid-001');
      expect(enqueued.status).toBe(SyncStatus.PENDING);
      expect(enqueued.sequenceNumber).toBe(101);
      expect(enqueued.observedAt).toBe('2026-09-16T10:00:00.000Z');
    });

    it('returns existing outbox item without duplicate insertion if idempotencyKey already exists', async () => {
      const existingRecord: any = {
        id: 'outbox-uuid-001',
        stationId,
        edgeNodeId,
        sequenceNumber: 101,
        idempotencyKey: 'idemp-outbox-101',
        eventType: 'telemetry.recorded',
        payload: { sensorId: 'sensor-gen-01', value: 45.2, unit: 'kW' },
        status: 'PENDING',
        observedAt: new Date('2026-09-16T10:00:00Z'),
        retryCount: 0,
        lastError: null,
        createdAt: new Date(),
        syncedAt: null,
      };

      vi.spyOn(edgeRepository, 'findOutboxByIdempotencyKey').mockResolvedValue(existingRecord);
      const enqueueSpy = vi.spyOn(edgeRepository, 'enqueueOutbox');

      const result = await edgeService.enqueueOutbox({
        stationId,
        edgeNodeId,
        sequenceNumber: 101,
        idempotencyKey: 'idemp-outbox-101',
        eventType: 'telemetry.recorded',
        observedAt: '2026-09-16T10:00:00Z',
        payload: { sensorId: 'sensor-gen-01', value: 45.2, unit: 'kW' },
      });

      expect(result.id).toBe('outbox-uuid-001');
      expect(enqueueSpy).not.toHaveBeenCalled();
    });
  });

  describe('3. Batch Synchronization, Checksum Validation & Canonical Routing', () => {
    it('verifies checksum and routes offline readings through TelemetryService.ingestBatch() preserving observedAt', async () => {
      const observedTimestamp = '2026-09-16T10:00:00.000Z';

      const ingestBatchSpy = vi.spyOn(telemetryService, 'ingestBatch').mockResolvedValue({
        processed: 2,
        inserted: 2,
        duplicates: 0,
        alertsTriggered: 1,
      });

      const mockBatchRecord: any = {
        id: 'batch-uuid-001',
        stationId,
        edgeNodeId,
        batchNumber: 1,
        idempotencyKey: 'batch-idemp-001',
        firstSequence: 1,
        lastSequence: 2,
        recordCount: 2,
        reconciledCount: 2,
        duplicateCount: 0,
        conflictCount: 0,
        status: 'SYNCED',
        checksum: 'valid-checksum',
        errorInfo: null,
        metadata: null,
        receivedAt: new Date(),
        syncedAt: new Date(),
        createdAt: new Date(),
      };

      vi.spyOn(edgeRepository, 'findBatchByIdempotencyKey').mockResolvedValue(null);
      vi.spyOn(edgeRepository, 'createSyncBatch').mockResolvedValue(mockBatchRecord);

      const result = await edgeService.reconcileSyncBatch({
        stationId,
        edgeNodeId,
        batchNumber: 1,
        idempotencyKey: 'batch-idemp-001',
        firstSequence: 1,
        lastSequence: 2,
        checksum: 'valid-checksum',
        readings: [
          {
            sensorId: 'sensor-gen-01-kw',
            stationId,
            value: 48.5,
            unit: 'kW',
            timestamp: observedTimestamp, // 10:00 measurement
            status: 'NORMAL',
          },
          {
            sensorId: 'sensor-fuel-flow',
            stationId,
            value: 12.4,
            unit: 'L/h',
            timestamp: observedTimestamp,
            status: 'NORMAL',
          },
        ],
      });

      expect(result.status).toBe(SyncStatus.SYNCED);
      expect(result.reconciledCount).toBe(2);
      expect(result.duplicateCount).toBe(0);
      expect(result.isIdempotentReplay).toBe(false);

      // Verify canonical routing through TelemetryService with original timestamp and EDGE_SYNC provenance
      expect(ingestBatchSpy).toHaveBeenCalledTimes(1);
      expect(ingestBatchSpy).toHaveBeenCalledWith({
        readings: expect.arrayContaining([
          expect.objectContaining({
            sensorId: 'sensor-gen-01-kw',
            timestamp: observedTimestamp,
            provenance: DataProvenance.EDGE_SYNC,
          }),
        ]),
      });
    });

    it('rejects corrupted sync batch when checksum fails and prevents partial ingestion', async () => {
      const ingestBatchSpy = vi.spyOn(telemetryService, 'ingestBatch');

      const mockFailedBatch: any = {
        id: 'batch-uuid-corrupt',
        stationId,
        edgeNodeId,
        batchNumber: 2,
        idempotencyKey: 'batch-idemp-corrupt',
        firstSequence: 3,
        lastSequence: 4,
        recordCount: 2,
        reconciledCount: 0,
        duplicateCount: 0,
        conflictCount: 0,
        status: 'FAILED',
        checksum: 'corrupted-crc32',
        errorInfo: 'Batch checksum verification failed.',
        metadata: null,
        receivedAt: new Date(),
        syncedAt: null,
        createdAt: new Date(),
      };

      vi.spyOn(edgeRepository, 'findBatchByIdempotencyKey').mockResolvedValue(null);
      vi.spyOn(edgeRepository, 'createSyncBatch').mockResolvedValue(mockFailedBatch);

      const result = await edgeService.reconcileSyncBatch({
        stationId,
        edgeNodeId,
        batchNumber: 2,
        idempotencyKey: 'batch-idemp-corrupt',
        firstSequence: 3,
        lastSequence: 4,
        checksum: 'corrupted-crc32',
        readings: [
          {
            sensorId: 'sensor-gen-01-kw',
            stationId,
            value: 99.9,
            unit: 'kW',
            timestamp: '2026-09-16T10:05:00Z',
          },
        ],
      });

      expect(result.status).toBe(SyncStatus.FAILED);
      expect(result.reconciledCount).toBe(0);
      // Canonical telemetry ingestion must NOT be called for corrupted batch
      expect(ingestBatchSpy).not.toHaveBeenCalled();
    });
  });

  describe('4. Batch Idempotency & Out-of-Order Sequence Tolerance', () => {
    it('returns previously reconciled result when same batch idempotencyKey is resubmitted', async () => {
      const existingBatch: any = {
        id: 'batch-uuid-001',
        stationId,
        edgeNodeId,
        batchNumber: 1,
        idempotencyKey: 'batch-idemp-001',
        firstSequence: 1,
        lastSequence: 2,
        recordCount: 2,
        reconciledCount: 2,
        duplicateCount: 0,
        conflictCount: 0,
        status: 'SYNCED',
        checksum: 'valid-checksum',
        errorInfo: null,
        createdAt: new Date(),
        receivedAt: new Date(),
        syncedAt: new Date(),
      };

      vi.spyOn(edgeRepository, 'findBatchByIdempotencyKey').mockResolvedValue(existingBatch);
      const ingestBatchSpy = vi.spyOn(telemetryService, 'ingestBatch');

      const replayResult = await edgeService.reconcileSyncBatch({
        stationId,
        edgeNodeId,
        batchNumber: 1,
        idempotencyKey: 'batch-idemp-001',
        firstSequence: 1,
        lastSequence: 2,
        checksum: 'valid-checksum',
        readings: [
          {
            sensorId: 'sensor-gen-01-kw',
            stationId,
            value: 48.5,
            unit: 'kW',
            timestamp: '2026-09-16T10:00:00Z',
          },
        ],
      });

      expect(replayResult.isIdempotentReplay).toBe(true);
      expect(replayResult.reconciledCount).toBe(0);
      expect(replayResult.duplicateCount).toBe(2);
      expect(ingestBatchSpy).not.toHaveBeenCalled();
    });

    it('tolerates and safely reconciles out-of-order sequence records in a sync batch', async () => {
      vi.spyOn(edgeRepository, 'findBatchByIdempotencyKey').mockResolvedValue(null);
      vi.spyOn(telemetryService, 'ingestBatch').mockResolvedValue({
        processed: 3,
        inserted: 3,
        duplicates: 0,
        alertsTriggered: 0,
      });

      const mockBatchRecord: any = {
        id: 'batch-ooo-uuid',
        stationId,
        edgeNodeId,
        batchNumber: 3,
        idempotencyKey: 'batch-ooo-key',
        firstSequence: 101,
        lastSequence: 103,
        recordCount: 3,
        reconciledCount: 3,
        duplicateCount: 0,
        conflictCount: 0,
        status: 'SYNCED',
        checksum: 'valid-checksum',
        errorInfo: null,
        createdAt: new Date(),
        receivedAt: new Date(),
        syncedAt: new Date(),
      };
      vi.spyOn(edgeRepository, 'createSyncBatch').mockResolvedValue(mockBatchRecord);

      // Readings arrive out-of-order: seq 103, then 101, then 102
      const result = await edgeService.reconcileSyncBatch({
        stationId,
        edgeNodeId,
        batchNumber: 3,
        idempotencyKey: 'batch-ooo-key',
        firstSequence: 101,
        lastSequence: 103,
        checksum: 'valid-checksum',
        readings: [
          {
            sensorId: 'sensor-temp',
            stationId,
            value: -25.2,
            unit: '°C',
            timestamp: '2026-09-16T10:03:00Z',
            sequenceNumber: 103,
          },
          {
            sensorId: 'sensor-temp',
            stationId,
            value: -25.0,
            unit: '°C',
            timestamp: '2026-09-16T10:01:00Z',
            sequenceNumber: 101,
          },
          {
            sensorId: 'sensor-temp',
            stationId,
            value: -25.1,
            unit: '°C',
            timestamp: '2026-09-16T10:02:00Z',
            sequenceNumber: 102,
          },
        ],
      });

      expect(result.status).toBe(SyncStatus.SYNCED);
      expect(result.reconciledCount).toBe(3);
    });
  });
});
