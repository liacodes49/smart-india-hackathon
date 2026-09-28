// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Domain Event Envelopes & Types
// ═══════════════════════════════════════════════════════════════
// Standard envelope contract for all inter-module and broadcast
// events across the Antarctic Digital Twin architecture.
// ═══════════════════════════════════════════════════════════════

/**
 * Canonical domain event types across the modular monolith
 */
export enum EventType {
  // Station Domain
  STATION_CREATED = 'station.created',
  STATION_UPDATED = 'station.updated',
  STATION_STATUS_CHANGED = 'station.status_changed',
  BUILDING_CREATED = 'building.created',
  BUILDING_UPDATED = 'building.updated',
  ROOM_CREATED = 'room.created',
  ROOM_UPDATED = 'room.updated',

  // Asset Domain
  ASSET_REGISTERED = 'asset.registered',
  ASSET_CREATED = 'asset.created',
  ASSET_UPDATED = 'asset.updated',
  ASSET_STATUS_CHANGED = 'asset.status_changed',

  // Telemetry & Sensor Domain
  SENSOR_REGISTERED = 'sensor.registered',
  SENSOR_UPDATED = 'sensor.updated',
  SENSOR_STATUS_CHANGED = 'sensor.status_changed',
  TELEMETRY_RECEIVED = 'telemetry.received',
  TELEMETRY_BATCH_RECEIVED = 'telemetry.batch_received',
  TELEMETRY_READING_RECORDED = 'telemetry.reading_recorded',
  TELEMETRY_BATCH_RECORDED = 'telemetry.batch_recorded',

  // Alert & Incident Domain
  ALERT_RAISED = 'alert.raised',
  ALERT_TRIGGERED = 'alert.triggered',
  ALERT_ACKNOWLEDGED = 'alert.acknowledged',
  ALERT_RESOLVED = 'alert.resolved',
  ALERT_ESCALATED = 'alert.escalated',
  INCIDENT_REPORTED = 'incident.reported',
  INCIDENT_ASSIGNED = 'incident.assigned',
  INCIDENT_STATUS_CHANGED = 'incident.status_changed',
  INCIDENT_UPDATED = 'incident.updated',
  INCIDENT_RESOLVED = 'incident.resolved',

  // Energy Domain
  ENERGY_STATE_UPDATED = 'energy.state_updated',
  ENERGY_THRESHOLD_EXCEEDED = 'energy.threshold_exceeded',

  // Inventory & Resource Domain
  INVENTORY_ITEM_CREATED = 'inventory.item_created',
  INVENTORY_LEVEL_CHANGED = 'inventory.level_changed',
  INVENTORY_THRESHOLD_CROSSED = 'inventory.threshold_crossed',
  RESOURCE_CONSUMPTION_RECORDED = 'inventory.consumption_recorded',

  // Weather Domain
  WEATHER_OBSERVATION_RECORDED = 'weather.observation_recorded',
  WEATHER_FORECAST_UPDATED = 'weather.forecast_updated',

  // Prediction & ML Domain
  PREDICTION_GENERATED = 'prediction.generated',
  ANOMALY_DETECTED = 'anomaly.detected',
  EQUIPMENT_HEALTH_DEGRADED = 'prediction.equipment_health_degraded',
  FAILURE_RISK_ELEVATED = 'prediction.failure_risk_elevated',
  FUEL_DEPLETION_FORECASTED = 'prediction.fuel_depletion_forecasted',

  // Risk Domain
  RISK_SCORE_UPDATED = 'risk.score_updated',

  // Simulation Domain
  SIMULATION_REQUESTED = 'simulation.requested',
  SIMULATION_STARTED = 'simulation.started',
  SIMULATION_COMPLETED = 'simulation.completed',
  SIMULATION_FAILED = 'simulation.failed',
  SCENARIO_CREATED = 'simulation.scenario_created',
  SCENARIO_EXECUTED = 'simulation.scenario_executed',

  // Digital Twin Domain
  TWIN_STATE_UPDATED = 'twin.state_updated',

  // Maintenance Domain
  MAINTENANCE_RECOMMENDED = 'maintenance.recommended',
  MAINTENANCE_SCHEDULED = 'maintenance.scheduled',
  MAINTENANCE_UPDATED = 'maintenance.updated',
  MAINTENANCE_COMPLETED = 'maintenance.completed',

  // Edge & Connectivity Domain
  EDGE_CONNECTIVITY_CHANGED = 'edge.connectivity_changed',
  EDGE_OUTBOX_ENQUEUED = 'edge.outbox_enqueued',
  EDGE_SYNC_BATCH_RECONCILED = 'edge.sync_batch_reconciled',

  // Gateway Domain
  GATEWAY_TELEMETRY_INGESTED = 'gateway.telemetry_ingested',
  GATEWAY_PAYLOAD_QUARANTINED = 'gateway.payload_quarantined',

  // Analytics & Reporting Domain
  ANALYTICS_REPORT_GENERATED = 'analytics.report_generated',

  // Audit Domain
  AUDIT_LOGGED = 'audit.logged',
}


/**
 * Standard Envelope for Domain Events
 */
export interface DomainEvent<T = unknown> {
  /** Unique UUID v4 identifying this event instance */
  eventId: string;
  /** Dot-notated domain event type (e.g. 'station.created') */
  eventType: EventType | string;
  /** Schema version of the event envelope & payload (default 1) */
  version: number;
  /** ISO-8601 UTC timestamp of occurrence */
  occurredAt: string;
  /** Originating subsystem or module (e.g. 'stations-service') */
  source: string;
  /** Target Antarctic station identifier if applicable */
  stationId?: string;
  /** Primary entity ID that was acted upon */
  entityId: string;
  /** Distributed trace / correlation identifier */
  correlationId: string;
  /** Triggering event ID that directly caused this event, if any */
  causationId?: string;
  /** Strongly-typed domain payload */
  payload: T;
}

/**
 * Factory helper parameters to construct a valid DomainEvent envelope
 */
export interface CreateDomainEventParams<T> {
  eventType: EventType | string;
  source: string;
  entityId: string;
  payload: T;
  stationId?: string;
  correlationId?: string;
  causationId?: string;
  version?: number;
  eventId?: string;
  occurredAt?: string;
}

/**
 * Helper factory to create a standard DomainEvent envelope
 */
export function createDomainEvent<T>(params: CreateDomainEventParams<T>): DomainEvent<T> {
  return {
    eventId: params.eventId ?? (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)),
    eventType: params.eventType,
    version: params.version ?? 1,
    occurredAt: params.occurredAt ?? new Date().toISOString(),
    source: params.source,
    stationId: params.stationId,
    entityId: params.entityId,
    correlationId: params.correlationId ?? (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)),
    causationId: params.causationId,
    payload: params.payload,
  };
}
