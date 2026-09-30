// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Sensors Service
// ═══════════════════════════════════════════════════════════════
// Business logic for sensor configuration, health tracking,
// and lifecycle domain events.
// ═══════════════════════════════════════════════════════════════

import { sensorsRepository, FindSensorsFilter, SensorSelect } from './sensors.repository.js';
import { stationsRepository } from '../stations/stations.repository.js';
import { eventBus } from '../../lib/event-bus.js';
import { createDomainEvent, EventType, SensorStatus } from '@repo/shared';
import type { CreateSensorInput, UpdateSensorInput } from '@repo/schemas';

// Default sensor offline threshold: 5 minutes of silence
export const SENSOR_OFFLINE_THRESHOLD_MS = 5 * 60 * 1000;

export class SensorsService {
  async getSensors(filters?: FindSensorsFilter) {
    let resolvedFilters = filters ? { ...filters } : undefined;
    if (resolvedFilters?.stationId) {
      const station = await stationsRepository.findById(resolvedFilters.stationId);
      if (station) {
        resolvedFilters.stationId = station.id;
      }
    }
    return sensorsRepository.findAll(resolvedFilters);
  }


  async getSensorById(id: string): Promise<SensorSelect | null> {
    return sensorsRepository.findById(id);
  }

  async getSensorsByAssetId(assetId: string): Promise<SensorSelect[]> {
    return sensorsRepository.findByAssetId(assetId);
  }

  async createSensor(input: CreateSensorInput, userId?: string): Promise<SensorSelect> {
    // 1. Verify asset association
    const isValid = await sensorsRepository.validateAssetAssociation(input.assetId, input.stationId);
    if (!isValid) {
      throw new Error(`Asset '${input.assetId}' does not belong to Station '${input.stationId}' or does not exist`);
    }

    // 2. Persist
    const created = await sensorsRepository.create({
      assetId: input.assetId,
      stationId: input.stationId,
      name: input.name,
      type: input.type as any,
      unit: input.unit,
      minThreshold: input.minThreshold ?? null,
      maxThreshold: input.maxThreshold ?? null,
      warningThreshold: input.warningThreshold ?? null,
      criticalThreshold: input.criticalThreshold ?? null,
      status: (input.status as any) ?? SensorStatus.NORMAL,
    });

    // 3. Emit domain event
    await eventBus.publish(
      createDomainEvent({
        eventType: EventType.SENSOR_REGISTERED,
        source: 'sensors-service',
        entityId: created.id,
        stationId: created.stationId,
        payload: {
          sensorId: created.id,
          assetId: created.assetId,
          stationId: created.stationId,
          name: created.name,
          type: created.type,
          unit: created.unit,
          thresholds: {
            min: created.minThreshold,
            max: created.maxThreshold,
            warning: created.warningThreshold,
            critical: created.criticalThreshold,
          },
          createdBy: userId,
        },
      })
    );

    return created;
  }

  async updateSensor(id: string, input: UpdateSensorInput, userId?: string): Promise<SensorSelect | null> {
    const existing = await sensorsRepository.findById(id);
    if (!existing) return null;

    if (input.assetId || input.stationId) {
      const targetAssetId = input.assetId ?? existing.assetId;
      const targetStationId = input.stationId ?? existing.stationId;
      const isValid = await sensorsRepository.validateAssetAssociation(targetAssetId, targetStationId);
      if (!isValid) {
        throw new Error(`Asset '${targetAssetId}' does not belong to Station '${targetStationId}'`);
      }
    }

    const updated = await sensorsRepository.update(id, {
      ...input,
      type: input.type as any,
      status: input.status as any,
    });

    if (!updated) return null;

    if (input.status && input.status !== existing.status) {
      await eventBus.publish(
        createDomainEvent({
          eventType: EventType.SENSOR_STATUS_CHANGED,
          source: 'sensors-service',
          entityId: updated.id,
          stationId: updated.stationId,
          payload: {
            sensorId: updated.id,
            oldStatus: existing.status,
            newStatus: updated.status,
            updatedBy: userId,
          },
        })
      );
    } else {
      await eventBus.publish(
        createDomainEvent({
          eventType: EventType.SENSOR_UPDATED,
          source: 'sensors-service',
          entityId: updated.id,
          stationId: updated.stationId,
          payload: {
            sensorId: updated.id,
            changes: input,
            updatedBy: userId,
          },
        })
      );
    }

    return updated;
  }

  async deleteSensor(id: string): Promise<boolean> {
    return sensorsRepository.delete(id);
  }

  /**
   * Evaluate health and detect stale sensors that have gone silent
   */
  async checkStaleSensors(): Promise<number> {
    const cutoff = new Date(Date.now() - SENSOR_OFFLINE_THRESHOLD_MS);
    const stale = await sensorsRepository.findStaleSensors(cutoff);

    for (const sensor of stale) {
      await sensorsRepository.update(sensor.id, { status: SensorStatus.OFFLINE });
      await eventBus.publish(
        createDomainEvent({
          eventType: EventType.SENSOR_STATUS_CHANGED,
          source: 'sensors-service',
          entityId: sensor.id,
          stationId: sensor.stationId,
          payload: {
            sensorId: sensor.id,
            oldStatus: sensor.status,
            newStatus: SensorStatus.OFFLINE,
            reason: `No telemetry received for > ${SENSOR_OFFLINE_THRESHOLD_MS / 1000}s`,
          },
        })
      );
    }

    return stale.length;
  }
}

export const sensorsService = new SensorsService();
