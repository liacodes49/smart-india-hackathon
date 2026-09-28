// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Incidents Service
// ═══════════════════════════════════════════════════════════════
// Operational response workflow management.
// Enforces:
// 1. Strict lifecycle validation: OPEN -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED.
// 2. Idempotent alert-to-incident escalation.
// 3. Domain event emission on all state changes.
// ═══════════════════════════════════════════════════════════════

import {
  EventType,
  createDomainEvent,
  IncidentStatus,
  IncidentSeverity,
} from '@repo/shared';
import type {
  CreateIncidentInput,
  UpdateIncidentInput,
  EscalateAlertInput,
  IncidentQueryInput,
} from '@repo/schemas';
import { eventBus } from '../../lib/event-bus.js';
import { logger } from '../../config/logger.js';
import { stationsRepository } from '../stations/stations.repository.js';
import { alertsRepository } from '../alerts/alerts.repository.js';
import {
  incidentsRepository,
  type IncidentSelect,
} from './incidents.repository.js';

const VALID_TRANSITIONS: Record<string, string[]> = {
  OPEN: ['ASSIGNED', 'IN_PROGRESS'],
  ASSIGNED: ['IN_PROGRESS', 'OPEN'],
  IN_PROGRESS: ['RESOLVED', 'ASSIGNED'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
};

export class IncidentsService {
  /**
   * Create an operational incident manually
   */
  async createIncident(input: CreateIncidentInput, reportedByUserId: string): Promise<IncidentSelect> {
    const station = await stationsRepository.findById(input.stationId);
    if (!station) {
      throw new Error(`Station not found: ${input.stationId}`);
    }

    const incident = await incidentsRepository.create({
      stationId: input.stationId,
      title: input.title,
      description: input.description,
      severity: input.severity as any,
      status: IncidentStatus.OPEN as any,
      sourceAlertId: input.sourceAlertId,
      affectedAssetId: input.affectedAssetId,
      affectedZoneId: input.affectedZoneId,
      reportedBy: reportedByUserId,
      assignedTo: input.assignedTo,
      remediationSteps: input.remediationSteps,
      slaDueDate: input.slaDueDate ? new Date(input.slaDueDate) : undefined,
    });

    eventBus.publish(
      createDomainEvent({
        eventType: EventType.INCIDENT_REPORTED,
        source: 'incidents-service',
        entityId: incident.id,
        stationId: incident.stationId,
        payload: {
          incidentId: incident.id,
          title: incident.title,
          severity: incident.severity,
          status: incident.status,
        },
      })
    );

    return incident;
  }

  /**
   * Idempotently escalate an active alert to an operational incident
   */
  async escalateAlertToIncident(
    alertId: string,
    reportedByUserId: string,
    input?: EscalateAlertInput
  ): Promise<{ incident: IncidentSelect; isNewlyCreated: boolean }> {
    // 1. Verify alert exists
    const alert = await alertsRepository.findById(alertId);
    if (!alert) {
      throw new Error(`Alert '${alertId}' not found`);
    }

    // 2. Check for existing active incident (IDEMPOTENCY INVARIANT)
    const existing = await incidentsRepository.findActiveByAlertId(alertId);
    if (existing) {
      logger.info(`[Incidents] Idempotent alert escalation: Returning existing active incident '${existing.id}' for alert '${alertId}'.`);
      return { incident: existing, isNewlyCreated: false };
    }

    // 3. Map severity from alert if not provided
    const severity = input?.severity ?? (alert.severity === 'CRITICAL' || alert.severity === 'EMERGENCY'
      ? IncidentSeverity.CRITICAL
      : alert.severity === 'WARNING'
        ? IncidentSeverity.HIGH
        : IncidentSeverity.MEDIUM);

    // 4. Create new incident linked to source alert
    const incident = await incidentsRepository.create({
      stationId: alert.stationId,
      title: input?.title ?? `[Escalated Alert] ${alert.title}`,
      description: input?.description ?? alert.message,
      severity: severity as any,
      status: IncidentStatus.OPEN as any,
      sourceAlertId: alert.id,
      affectedAssetId: alert.assetId ?? undefined,
      reportedBy: reportedByUserId,
      assignedTo: input?.assignedTo,
      remediationSteps: input?.remediationSteps ?? [
        'Acknowledge escalated operational incident',
        'Dispatch technician to inspect affected asset/sensor',
        'Mitigate active alert condition and record root cause',
      ],
      slaDueDate: input?.slaDueDate ? new Date(input?.slaDueDate) : undefined,
    });

    // 5. Update originating alert status to ESCALATED
    await alertsRepository.update(alert.id, {
      status: 'ESCALATED' as any,
    });

    eventBus.publish(
      createDomainEvent({
        eventType: EventType.INCIDENT_REPORTED,
        source: 'incidents-service',
        entityId: incident.id,
        stationId: incident.stationId,
        causationId: alert.id,
        payload: {
          incidentId: incident.id,
          sourceAlertId: alert.id,
          title: incident.title,
          severity: incident.severity,
        },
      })
    );

    return { incident, isNewlyCreated: true };
  }

  /**
   * Transition incident through validated lifecycle
   */
  async updateIncident(
    id: string,
    input: UpdateIncidentInput,
    actorUserId?: string
  ): Promise<IncidentSelect> {
    const incident = await incidentsRepository.findById(id);
    if (!incident) {
      throw new Error(`Incident '${id}' not found`);
    }

    // Lifecycle validation
    if (input.status && input.status !== incident.status) {
      const allowedNextStates = VALID_TRANSITIONS[incident.status] ?? [];
      if (!allowedNextStates.includes(input.status)) {
        throw new Error(
          `Invalid incident status transition from '${incident.status}' to '${input.status}'. Allowed: [${allowedNextStates.join(', ')}]`
        );
      }
    }

    const updateData: any = { ...input };
    if (input.slaDueDate) {
      updateData.slaDueDate = new Date(input.slaDueDate);
    }
    if (input.status === IncidentStatus.RESOLVED && !incident.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    const updated = await incidentsRepository.update(id, updateData);

    if (input.status && input.status !== incident.status) {
      eventBus.publish(
        createDomainEvent({
          eventType: input.status === IncidentStatus.RESOLVED
            ? EventType.INCIDENT_RESOLVED
            : EventType.INCIDENT_STATUS_CHANGED,
          source: 'incidents-service',
          entityId: id,
          stationId: incident.stationId,
          payload: {
            incidentId: id,
            previousStatus: incident.status,
            newStatus: input.status,
            actorUserId,
          },
        })
      );
    }

    return updated!;
  }

  /**
   * Assign incident to a responder
   */
  async assignIncident(id: string, assignedToUserId: string, actorUserId: string): Promise<IncidentSelect> {
    const incident = await incidentsRepository.findById(id);
    if (!incident) {
      throw new Error(`Incident '${id}' not found`);
    }

    const updated = await incidentsRepository.update(id, {
      assignedTo: assignedToUserId,
      status: incident.status === 'OPEN' ? ('ASSIGNED' as any) : incident.status,
    });

    eventBus.publish(
      createDomainEvent({
        eventType: EventType.INCIDENT_ASSIGNED,
        source: 'incidents-service',
        entityId: id,
        stationId: incident.stationId,
        payload: { incidentId: id, assignedTo: assignedToUserId, assignedBy: actorUserId },
      })
    );

    return updated!;
  }

  /**
   * Resolve an incident with root cause analysis and resolution notes
   */
  async resolveIncident(
    id: string,
    rootCause: string,
    resolutionNotes: string,
    actorUserId: string
  ): Promise<IncidentSelect> {
    return this.updateIncident(
      id,
      {
        status: IncidentStatus.RESOLVED,
        rootCause,
        resolutionNotes,
      },
      actorUserId
    );
  }

  async getIncidentById(id: string): Promise<IncidentSelect | null> {
    return incidentsRepository.findById(id);
  }

  async listIncidents(filter?: IncidentQueryInput) {
    return incidentsRepository.findAll(filter);
  }
}

export const incidentsService = new IncidentsService();
