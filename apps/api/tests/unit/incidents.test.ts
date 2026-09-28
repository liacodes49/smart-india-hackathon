// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Incidents Unit & Idempotency Tests
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { incidentsService } from '../../src/modules/incidents/incidents.service.js';
import { incidentsRepository } from '../../src/modules/incidents/incidents.repository.js';
import { alertsRepository } from '../../src/modules/alerts/alerts.repository.js';
import { stationsRepository } from '../../src/modules/stations/stations.repository.js';
import { IncidentStatus, IncidentSeverity } from '@repo/shared';

describe('Incidents Service — Workflow & Lifecycle Validation', () => {
  const stationId = '00000000-0000-0000-0000-000000000001';
  const userId = '99999999-9999-9999-9999-999999999999';
  const incidentId = 'inc-123';

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(stationsRepository, 'findById').mockResolvedValue({
      id: stationId,
      stationId: 'MAITRI',
      name: 'Maitri Station',
      latitude: -70.767,
      longitude: 11.733,
      altitude: 117,
      status: 'OPERATIONAL',
      timezone: 'UTC+5:30',
      description: 'Maitri',
      imageUrl: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it('allows valid sequential status transitions: OPEN -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED', async () => {
    let currentIncident: any = {
      id: incidentId,
      stationId,
      title: 'Generator Coolant Overheat',
      description: 'High temperature warning',
      severity: IncidentSeverity.HIGH,
      status: IncidentStatus.OPEN,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(incidentsRepository, 'findById').mockImplementation(async () => currentIncident);
    vi.spyOn(incidentsRepository, 'update').mockImplementation(async (_id, data) => {
      currentIncident = { ...currentIncident, ...data };
      return currentIncident;
    });

    // 1. OPEN -> ASSIGNED
    const assigned = await incidentsService.assignIncident(incidentId, userId, userId);
    expect(assigned.status).toBe(IncidentStatus.ASSIGNED);

    // 2. ASSIGNED -> IN_PROGRESS
    const inProgress = await incidentsService.updateIncident(incidentId, { status: IncidentStatus.IN_PROGRESS });
    expect(inProgress.status).toBe(IncidentStatus.IN_PROGRESS);

    // 3. IN_PROGRESS -> RESOLVED
    const resolved = await incidentsService.resolveIncident(
      incidentId,
      'Coolant pump blockage due to ice buildup',
      'Cleaned intake strainer and tested flow rate',
      userId
    );
    expect(resolved.status).toBe(IncidentStatus.RESOLVED);
    expect(resolved.rootCause).toContain('pump blockage');

    // 4. RESOLVED -> CLOSED
    const closed = await incidentsService.updateIncident(incidentId, { status: IncidentStatus.CLOSED });
    expect(closed.status).toBe(IncidentStatus.CLOSED);
  });

  it('rejects invalid status transitions (e.g. OPEN directly to RESOLVED or CLOSED)', async () => {
    const currentIncident: any = {
      id: incidentId,
      stationId,
      title: 'Test Incident',
      status: IncidentStatus.OPEN,
    };

    vi.spyOn(incidentsRepository, 'findById').mockResolvedValue(currentIncident);

    // Attempt invalid jump: OPEN -> RESOLVED
    await expect(
      incidentsService.updateIncident(incidentId, { status: IncidentStatus.RESOLVED })
    ).rejects.toThrow(/Invalid incident status transition/);

    // Attempt invalid jump: OPEN -> CLOSED
    await expect(
      incidentsService.updateIncident(incidentId, { status: IncidentStatus.CLOSED })
    ).rejects.toThrow(/Invalid incident status transition/);
  });
});

describe('Incidents Service — Idempotent Alert Escalation', () => {
  const stationId = '00000000-0000-0000-0000-000000000001';
  const alertId = 'alert-987';
  const userId = '99999999-9999-9999-9999-999999999999';

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(alertsRepository, 'findById').mockResolvedValue({
      id: alertId,
      stationId,
      sensorId: null,
      assetId: 'asset-1',
      title: 'Generator High Exhaust Temp',
      message: 'Exhaust gas exceeded 480°C',
      severity: 'CRITICAL',
      status: 'ACTIVE',
      category: 'EQUIPMENT',
      acknowledgedBy: null,
      acknowledgedAt: null,
      resolvedBy: null,
      resolvedAt: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    vi.spyOn(alertsRepository, 'update').mockResolvedValue({} as any);
  });

  it('creates new incident on first escalation and returns isNewlyCreated: true', async () => {
    // First call: no existing incident
    vi.spyOn(incidentsRepository, 'findActiveByAlertId').mockResolvedValue(null);
    vi.spyOn(incidentsRepository, 'create').mockResolvedValue({
      id: 'inc-new-1',
      stationId,
      title: '[Escalated Alert] Generator High Exhaust Temp',
      description: 'Exhaust gas exceeded 480°C',
      severity: 'CRITICAL' as any,
      status: 'OPEN' as any,
      sourceAlertId: alertId,
      affectedAssetId: 'asset-1',
      affectedZoneId: null,
      reportedBy: userId,
      assignedTo: null,
      rootCause: null,
      remediationSteps: [],
      slaDueDate: null,
      resolvedAt: null,
      resolutionNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await incidentsService.escalateAlertToIncident(alertId, userId);
    expect(result.isNewlyCreated).toBe(true);
    expect(result.incident.id).toBe('inc-new-1');
  });

  it('returns existing incident when escalated a second time (IDEMPOTENT INVARIANT)', async () => {
    const existingIncident: any = {
      id: 'inc-existing-1',
      stationId,
      sourceAlertId: alertId,
      title: '[Escalated Alert] Generator High Exhaust Temp',
      status: 'OPEN',
      severity: 'CRITICAL',
    };

    // Second call: active incident already exists for alertId
    vi.spyOn(incidentsRepository, 'findActiveByAlertId').mockResolvedValue(existingIncident);
    const createSpy = vi.spyOn(incidentsRepository, 'create');

    const result = await incidentsService.escalateAlertToIncident(alertId, userId);

    // Assert: returns existing incident, flags isNewlyCreated as false, and DOES NOT call create
    expect(result.isNewlyCreated).toBe(false);
    expect(result.incident.id).toBe('inc-existing-1');
    expect(createSpy).not.toHaveBeenCalled();
  });
});
