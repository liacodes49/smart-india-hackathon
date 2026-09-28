// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Alerts Service & Rules Engine
// ═══════════════════════════════════════════════════════════════
// Deterministic threshold evaluation, alert storm deduplication,
// auto-recovery, and alert lifecycle event dispatching.
// ═══════════════════════════════════════════════════════════════

import { alertsRepository, FindAlertsFilter, AlertSelect } from './alerts.repository.js';
import { eventBus } from '../../lib/event-bus.js';
import { createDomainEvent, EventType, AlertSeverity, AlertCategory, SensorType } from '@repo/shared';
import type { CreateAlertInput, AcknowledgeAlertInput } from '@repo/schemas';
import type { SensorSelect } from '../sensors/sensors.repository.js';

export interface TelemetryEvaluationInput {
  sensorId: string;
  stationId: string;
  value: number;
  unit: string;
  timestamp: string | Date;
}

export interface ThresholdEvaluationResult {
  breached: boolean;
  severity?: AlertSeverity;
  alert?: AlertSelect;
  isNew?: boolean;
  recovered?: boolean;
  recoveredAlert?: AlertSelect;
}

function mapSensorTypeToAlertCategory(type: SensorType | string): AlertCategory {
  switch (type) {
    case 'TEMPERATURE':
    case 'HUMIDITY':
    case 'PRESSURE':
    case 'WIND_SPEED':
    case 'WIND_DIRECTION':
    case 'SOLAR_RADIATION':
      return AlertCategory.ENVIRONMENTAL;
    case 'POWER':
    case 'FUEL':
    case 'BATTERY':
      return AlertCategory.POWER;
    case 'WATER':
    case 'CO2':
      return AlertCategory.SAFETY;
    case 'STRUCTURAL':
    case 'VIBRATION':
      return AlertCategory.STRUCTURAL;
    case 'NETWORK':
      return AlertCategory.NETWORK;
    default:
      return AlertCategory.EQUIPMENT;
  }
}

export class AlertsService {
  async getAlerts(filters?: FindAlertsFilter) {
    return alertsRepository.findAll(filters);
  }

  async getAlertById(id: string): Promise<AlertSelect | null> {
    return alertsRepository.findById(id);
  }

  async createAlert(input: CreateAlertInput, userId?: string): Promise<AlertSelect> {
    const created = await alertsRepository.create({
      stationId: input.stationId,
      sensorId: input.sensorId ?? null,
      assetId: input.assetId ?? null,
      title: input.title,
      message: input.message,
      severity: input.severity as any,
      status: 'ACTIVE',
      category: input.category as any,
    });

    await eventBus.publish(
      createDomainEvent({
        eventType: EventType.ALERT_TRIGGERED,
        source: 'alerts-engine',
        entityId: created.id,
        stationId: created.stationId,
        payload: {
          alertId: created.id,
          title: created.title,
          severity: created.severity,
          category: created.category,
          sensorId: created.sensorId,
          assetId: created.assetId,
          stationId: created.stationId,
          createdBy: userId,
        },
      })
    );

    return created;
  }

  async acknowledgeAlert(id: string, input: AcknowledgeAlertInput): Promise<AlertSelect | null> {
    const updated = await alertsRepository.acknowledge(id, input.acknowledgedBy, input.notes);
    if (!updated) return null;

    await eventBus.publish(
      createDomainEvent({
        eventType: EventType.ALERT_ACKNOWLEDGED,
        source: 'alerts-engine',
        entityId: updated.id,
        stationId: updated.stationId,
        payload: {
          alertId: updated.id,
          acknowledgedBy: input.acknowledgedBy,
          notes: input.notes,
          acknowledgedAt: updated.acknowledgedAt,
        },
      })
    );

    return updated;
  }

  async resolveAlert(id: string, userId?: string, notes?: string): Promise<AlertSelect | null> {
    const updated = await alertsRepository.resolve(id, userId, notes);
    if (!updated) return null;

    await eventBus.publish(
      createDomainEvent({
        eventType: EventType.ALERT_RESOLVED,
        source: 'alerts-engine',
        entityId: updated.id,
        stationId: updated.stationId,
        payload: {
          alertId: updated.id,
          resolvedBy: userId,
          notes,
          resolvedAt: updated.resolvedAt,
        },
      })
    );

    return updated;
  }

  /**
   * Evaluates telemetry reading against sensor thresholds deterministically.
   * Performs deduplication and auto-recovery.
   */
  async evaluateReading(
    reading: TelemetryEvaluationInput,
    sensor: SensorSelect
  ): Promise<ThresholdEvaluationResult> {
    const { value, unit } = reading;
    let breached = false;
    let severity: AlertSeverity = AlertSeverity.INFO;
    let breachReason = '';

    // Deterministic threshold rule evaluation:
    if (sensor.criticalThreshold !== null && value >= sensor.criticalThreshold) {
      breached = true;
      severity = AlertSeverity.CRITICAL;
      breachReason = `exceeded critical limit (${value} ${unit} >= ${sensor.criticalThreshold} ${unit})`;
    } else if (sensor.warningThreshold !== null && value >= sensor.warningThreshold) {
      breached = true;
      severity = AlertSeverity.WARNING;
      breachReason = `exceeded warning limit (${value} ${unit} >= ${sensor.warningThreshold} ${unit})`;
    } else if (sensor.minThreshold !== null && value <= sensor.minThreshold) {
      breached = true;
      severity = AlertSeverity.CRITICAL;
      breachReason = `fell below safe minimum limit (${value} ${unit} <= ${sensor.minThreshold} ${unit})`;
    }

    const existingActiveAlert = await alertsRepository.findActiveBySensor(sensor.id);

    if (breached) {
      if (existingActiveAlert) {
        // Check if severity escalated
        if (existingActiveAlert.severity === AlertSeverity.WARNING && severity === AlertSeverity.CRITICAL) {
          const escalated = await alertsRepository.update(existingActiveAlert.id, {
            severity: AlertSeverity.CRITICAL,
            title: `[ESCALATED] ${sensor.name} critical threshold breach`,
            message: `${sensor.name} has escalated: ${breachReason}`,
            metadata: {
              ...(existingActiveAlert.metadata as Record<string, unknown> ?? {}),
              escalatedAt: new Date().toISOString(),
              escalatedReading: value,
            },
          });

          if (escalated) {
            await eventBus.publish(
              createDomainEvent({
                eventType: EventType.ALERT_ESCALATED,
                source: 'alerts-engine',
                entityId: escalated.id,
                stationId: escalated.stationId,
                payload: {
                  alertId: escalated.id,
                  oldSeverity: AlertSeverity.WARNING,
                  newSeverity: AlertSeverity.CRITICAL,
                  value,
                },
              })
            );
          }

          return { breached: true, severity, alert: escalated ?? existingActiveAlert, isNew: false };
        }

        // Deduplication: Update metadata with latest reading without creating duplicate alert
        await alertsRepository.update(existingActiveAlert.id, {
          metadata: {
            ...(existingActiveAlert.metadata as Record<string, unknown> ?? {}),
            lastBreachedReading: value,
            lastBreachedAt: new Date().toISOString(),
          },
        });

        return { breached: true, severity: existingActiveAlert.severity as any, alert: existingActiveAlert, isNew: false };
      }

      // Create new active alert
      const category = mapSensorTypeToAlertCategory(sensor.type);
      const newAlert = await alertsRepository.create({
        stationId: sensor.stationId,
        sensorId: sensor.id,
        assetId: sensor.assetId,
        title: `${sensor.name} ${severity} alert`,
        message: `${sensor.name} reading of ${value} ${unit} ${breachReason}.`,
        severity: severity as any,
        status: 'ACTIVE',
        category: category as any,
        metadata: {
          readingValue: value,
          readingUnit: unit,
          sensorType: sensor.type,
          readingTimestamp: reading.timestamp,
        },
      });

      await eventBus.publish(
        createDomainEvent({
          eventType: EventType.ALERT_TRIGGERED,
          source: 'alerts-engine',
          entityId: newAlert.id,
          stationId: newAlert.stationId,
          payload: {
            alertId: newAlert.id,
            title: newAlert.title,
            severity: newAlert.severity,
            category: newAlert.category,
            sensorId: newAlert.sensorId,
            assetId: newAlert.assetId,
            stationId: newAlert.stationId,
            value,
            unit,
          },
        })
      );

      return { breached: true, severity, alert: newAlert, isNew: true };
    }

    // If reading is within normal range and an active alert exists: AUTO-RECOVERY
    if (existingActiveAlert) {
      const resolved = await alertsRepository.resolve(
        existingActiveAlert.id,
        undefined,
        `Auto-recovered: Reading returned to normal (${value} ${unit})`
      );

      if (resolved) {
        await eventBus.publish(
          createDomainEvent({
            eventType: EventType.ALERT_RESOLVED,
            source: 'alerts-engine',
            entityId: resolved.id,
            stationId: resolved.stationId,
            payload: {
              alertId: resolved.id,
              autoRecovered: true,
              value,
              unit,
            },
          })
        );
      }

      return { breached: false, recovered: true, recoveredAlert: resolved ?? existingActiveAlert };
    }

    return { breached: false };
  }
}

export const alertsService = new AlertsService();
