// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Drizzle Database Schema
// ═══════════════════════════════════════════════════════════════
// Central schema export — all table definitions for Drizzle ORM.
// Each table follows the entity model from @repo/shared types.
// ═══════════════════════════════════════════════════════════════

import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  integer,
  real,
  boolean,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ── Enums ────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', [
  'SUPER_ADMIN',
  'STATION_ADMIN',
  'SCIENTIST',
  'OPERATOR',
  'VIEWER',
]);

export const stationStatusEnum = pgEnum('station_status', [
  'OPERATIONAL',
  'MAINTENANCE',
  'EMERGENCY',
  'OFFLINE',
  'WINTERIZED',
]);

export const sensorTypeEnum = pgEnum('sensor_type', [
  'TEMPERATURE',
  'HUMIDITY',
  'PRESSURE',
  'WIND_SPEED',
  'WIND_DIRECTION',
  'POWER',
  'FUEL',
  'BATTERY',
  'CO2',
  'WATER',
  'NETWORK',
  'STRUCTURAL',
  'VIBRATION',
  'SOLAR_RADIATION',
]);

export const sensorStatusEnum = pgEnum('sensor_status', [
  'NORMAL',
  'WARNING',
  'CRITICAL',
  'OFFLINE',
  'MAINTENANCE',
]);

export const alertSeverityEnum = pgEnum('alert_severity', [
  'INFO',
  'WARNING',
  'CRITICAL',
  'EMERGENCY',
]);

export const alertStatusEnum = pgEnum('alert_status', [
  'ACTIVE',
  'ACKNOWLEDGED',
  'RESOLVED',
  'ESCALATED',
  'DISMISSED',
]);

export const alertCategoryEnum = pgEnum('alert_category', [
  'ENVIRONMENTAL',
  'EQUIPMENT',
  'POWER',
  'STRUCTURAL',
  'SAFETY',
  'NETWORK',
]);

export const maintenanceTypeEnum = pgEnum('maintenance_type', [
  'PREVENTIVE',
  'CORRECTIVE',
  'PREDICTIVE',
  'EMERGENCY',
]);

export const maintenancePriorityEnum = pgEnum('maintenance_priority', [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]);

export const maintenanceStatusEnum = pgEnum('maintenance_status', [
  'RECOMMENDED',
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'ON_HOLD',
]);

export const dataProvenanceEnum = pgEnum('data_provenance', [
  'SIMULATED',
  'SENSOR',
  'EXTERNAL_API',
  'MANUAL',
  'EDGE_SYNC',
]);

export const predictionTypeEnum = pgEnum('prediction_type', [
  'ANOMALY_DETECTION',
  'FAILURE_PREDICTION',
  'ENERGY_FORECAST',
  'WEATHER_FORECAST',
  'MAINTENANCE_PREDICTION',
]);

export const simulationTypeEnum = pgEnum('simulation_type', [
  'POWER_FAILURE',
  'EQUIPMENT_FAILURE',
  'WEATHER_EXTREME',
  'EVACUATION',
  'SUPPLY_SHORTAGE',
  'CUSTOM',
]);

export const simulationStatusEnum = pgEnum('simulation_status', [
  'DRAFT',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);

export const assetCategoryEnum = pgEnum('asset_category', [
  'GENERATOR',
  'HVAC',
  'COMMUNICATION',
  'WATER_TREATMENT',
  'FIRE_SAFETY',
  'RESEARCH_EQUIPMENT',
  'VEHICLE',
  'STORAGE',
  'STRUCTURAL',
]);

export const auditActionEnum = pgEnum('audit_action', [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'ACKNOWLEDGE_ALERT',
  'RUN_SIMULATION',
  'EXPORT_REPORT',
]);

export const assetCriticalityEnum = pgEnum('asset_criticality', [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]);

export const inventoryCategoryEnum = pgEnum('inventory_category', [
  'FUEL',
  'FOOD',
  'WATER',
  'MEDICAL',
  'SPARE_PARTS',
  'CONSUMABLES',
]);

export const incidentSeverityEnum = pgEnum('incident_severity', [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]);

export const incidentStatusEnum = pgEnum('incident_status', [
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
]);

export const connectivityStateEnum = pgEnum('connectivity_state', [
  'ONLINE',
  'DEGRADED',
  'BLACKOUT',
]);

export const syncStatusEnum = pgEnum('sync_status', [
  'PENDING',
  'SYNCING',
  'SYNCED',
  'FAILED',
  'CONFLICT',
]);

export const gatewayProtocolEnum = pgEnum('gateway_protocol', [
  'REST',
  'MQTT',
  'MODBUS',
  'MANUAL',
]);

export const reportTypeEnum = pgEnum('report_type', [
  'DAILY_SITREP',
  'WEEKLY_ENERGY',
  'FUEL_AUDIT',
  'INCIDENT_SUMMARY',
]);

// ── Users ────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: text('password_hash'),
  role: userRoleEnum('role').notNull().default('VIEWER'),
  stationId: uuid('station_id').references(() => stations.id),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Stations ─────────────────────────────────────────────────

export const stations = pgTable('stations', {
  id: uuid('id').primaryKey().defaultRandom(),
  stationId: varchar('station_id', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  altitude: real('altitude').notNull(),
  status: stationStatusEnum('status').notNull().default('OPERATIONAL'),
  timezone: varchar('timezone', { length: 50 }).notNull().default('UTC+5:30'),
  description: text('description'),
  imageUrl: text('image_url'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Buildings ────────────────────────────────────────────────

export const buildings = pgTable('buildings', {
  id: uuid('id').primaryKey().defaultRandom(),
  stationId: uuid('station_id')
    .references(() => stations.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 20 }).notNull(),
  floors: integer('floors').notNull().default(1),
  purpose: text('purpose').notNull(),
  coordinates: jsonb('coordinates'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Rooms ────────────────────────────────────────────────────

export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  buildingId: uuid('building_id')
    .references(() => buildings.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 20 }).notNull(),
  floor: integer('floor').notNull().default(0),
  purpose: text('purpose').notNull(),
  area: real('area'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Assets ───────────────────────────────────────────────────

export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  stationId: uuid('station_id')
    .references(() => stations.id)
    .notNull(),
  buildingId: uuid('building_id').references(() => buildings.id),
  roomId: uuid('room_id').references(() => rooms.id),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).unique().notNull(),
  category: assetCategoryEnum('category').notNull(),
  criticality: assetCriticalityEnum('criticality').notNull().default('MEDIUM'),
  manufacturer: varchar('manufacturer', { length: 255 }),
  model: varchar('model', { length: 255 }),
  serialNumber: varchar('serial_number', { length: 255 }),
  installDate: timestamp('install_date', { withTimezone: true }),
  status: sensorStatusEnum('status').notNull().default('NORMAL'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_assets_station').on(table.stationId),
  index('idx_assets_category').on(table.category),
]);

// ── Sensors ──────────────────────────────────────────────────

export const sensors = pgTable('sensors', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetId: uuid('asset_id')
    .references(() => assets.id)
    .notNull(),
  stationId: uuid('station_id')
    .references(() => stations.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: sensorTypeEnum('type').notNull(),
  unit: varchar('unit', { length: 50 }).notNull(),
  minThreshold: real('min_threshold'),
  maxThreshold: real('max_threshold'),
  warningThreshold: real('warning_threshold'),
  criticalThreshold: real('critical_threshold'),
  status: sensorStatusEnum('status').notNull().default('NORMAL'),
  lastReading: real('last_reading'),
  lastReadingAt: timestamp('last_reading_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_sensors_station').on(table.stationId),
  index('idx_sensors_asset').on(table.assetId),
  index('idx_sensors_type').on(table.type),
]);

// ── Telemetry ────────────────────────────────────────────────

export const telemetry = pgTable('telemetry', {
  id: uuid('id').primaryKey().defaultRandom(),
  sensorId: uuid('sensor_id')
    .references(() => sensors.id)
    .notNull(),
  stationId: uuid('station_id')
    .references(() => stations.id)
    .notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  value: real('value').notNull(),
  unit: varchar('unit', { length: 50 }).notNull(),
  status: sensorStatusEnum('status').notNull().default('NORMAL'),
  quality: real('quality'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_telemetry_sensor_timestamp').on(table.sensorId, table.timestamp),
  index('idx_telemetry_station_timestamp').on(table.stationId, table.timestamp),
  uniqueIndex('idx_telemetry_sensor_timestamp_unique').on(table.sensorId, table.timestamp),
]);

// ── Alerts ───────────────────────────────────────────────────

export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  stationId: uuid('station_id')
    .references(() => stations.id)
    .notNull(),
  sensorId: uuid('sensor_id').references(() => sensors.id),
  assetId: uuid('asset_id').references(() => assets.id),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  severity: alertSeverityEnum('severity').notNull(),
  status: alertStatusEnum('status').notNull().default('ACTIVE'),
  category: alertCategoryEnum('category').notNull(),
  acknowledgedBy: uuid('acknowledged_by').references(() => users.id),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  resolvedBy: uuid('resolved_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_alerts_station_status').on(table.stationId, table.status),
  index('idx_alerts_sensor').on(table.sensorId),
]);

// ── Predictions ──────────────────────────────────────────────

export const predictions = pgTable('predictions', {
  id: uuid('id').primaryKey().defaultRandom(),
  stationId: uuid('station_id')
    .references(() => stations.id)
    .notNull(),
  sensorId: uuid('sensor_id').references(() => sensors.id),
  assetId: uuid('asset_id').references(() => assets.id),
  type: predictionTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  confidence: real('confidence').notNull(),
  predictedValue: real('predicted_value'),
  predictedAt: timestamp('predicted_at', { withTimezone: true }).notNull(),
  horizon: varchar('horizon', { length: 100 }).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Simulations ──────────────────────────────────────────────

export const simulations = pgTable('simulations', {
  id: uuid('id').primaryKey().defaultRandom(),
  stationId: uuid('station_id')
    .references(() => stations.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: simulationTypeEnum('type').notNull(),
  description: text('description').notNull(),
  status: simulationStatusEnum('status').notNull().default('DRAFT'),
  parameters: jsonb('parameters').notNull(),
  results: jsonb('results'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdBy: uuid('created_by')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Maintenance ──────────────────────────────────────────────

export const maintenanceRecords = pgTable('maintenance_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  stationId: uuid('station_id')
    .references(() => stations.id)
    .notNull(),
  assetId: uuid('asset_id')
    .references(() => assets.id)
    .notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  type: maintenanceTypeEnum('type').notNull(),
  priority: maintenancePriorityEnum('priority').notNull(),
  status: maintenanceStatusEnum('status').notNull().default('PENDING'),
  assignedTo: uuid('assigned_to').references(() => users.id),
  scheduledDate: timestamp('scheduled_date', { withTimezone: true }),
  completedDate: timestamp('completed_date', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Audit Logs ───────────────────────────────────────────────

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  action: auditActionEnum('action').notNull(),
  resource: varchar('resource', { length: 255 }).notNull(),
  resourceId: uuid('resource_id'),
  details: jsonb('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Relations ────────────────────────────────────────────────

export const stationsRelations = relations(stations, ({ many }) => ({
  buildings: many(buildings),
  assets: many(assets),
  sensors: many(sensors),
  alerts: many(alerts),
  weatherObservations: many(weatherObservations),
}));

export const buildingsRelations = relations(buildings, ({ one, many }) => ({
  station: one(stations, { fields: [buildings.stationId], references: [stations.id] }),
  rooms: many(rooms),
}));

export const roomsRelations = relations(rooms, ({ one }) => ({
  building: one(buildings, { fields: [rooms.buildingId], references: [buildings.id] }),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  station: one(stations, { fields: [assets.stationId], references: [stations.id] }),
  building: one(buildings, { fields: [assets.buildingId], references: [buildings.id] }),
  sensors: many(sensors),
  maintenanceRecords: many(maintenanceRecords),
}));

export const sensorsRelations = relations(sensors, ({ one, many }) => ({
  asset: one(assets, { fields: [sensors.assetId], references: [assets.id] }),
  station: one(stations, { fields: [sensors.stationId], references: [stations.id] }),
  telemetryReadings: many(telemetry),
}));

// ── Inventory & Resources ────────────────────────────────────

export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  stationId: uuid('station_id')
    .references(() => stations.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).unique().notNull(),
  category: inventoryCategoryEnum('category').notNull(),
  currentStock: real('current_stock').notNull().default(0),
  minimumThreshold: real('minimum_threshold').notNull().default(0),
  unit: varchar('unit', { length: 50 }).notNull(),
  location: varchar('location', { length: 255 }),
  expirationDate: timestamp('expiration_date', { withTimezone: true }),
  resupplyDate: timestamp('resupply_date', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_inventory_station').on(table.stationId),
  index('idx_inventory_category').on(table.category),
]);

export const resourceConsumption = pgTable('resource_consumption', {
  id: uuid('id').primaryKey().defaultRandom(),
  inventoryItemId: uuid('inventory_item_id')
    .references(() => inventoryItems.id)
    .notNull(),
  stationId: uuid('station_id')
    .references(() => stations.id)
    .notNull(),
  assetId: uuid('asset_id').references(() => assets.id),
  quantity: real('quantity').notNull(),
  unit: varchar('unit', { length: 50 }).notNull(),
  loggedAt: timestamp('logged_at', { withTimezone: true }).notNull().defaultNow(),
  loggedBy: uuid('logged_by').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_resource_consumption_item').on(table.inventoryItemId),
  index('idx_resource_consumption_station').on(table.stationId),
]);

export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
  station: one(stations, { fields: [inventoryItems.stationId], references: [stations.id] }),
  consumptions: many(resourceConsumption),
}));

export const resourceConsumptionRelations = relations(resourceConsumption, ({ one }) => ({
  inventoryItem: one(inventoryItems, { fields: [resourceConsumption.inventoryItemId], references: [inventoryItems.id] }),
  station: one(stations, { fields: [resourceConsumption.stationId], references: [stations.id] }),
  asset: one(assets, { fields: [resourceConsumption.assetId], references: [assets.id] }),
  user: one(users, { fields: [resourceConsumption.loggedBy], references: [users.id] }),
}));

// ── Weather ──────────────────────────────────────────────────

export const weatherObservations = pgTable(
  'weather_observations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    stationId: uuid('station_id')
      .references(() => stations.id)
      .notNull(),
    temperature: real('temperature').notNull(),
    windSpeed: real('wind_speed').notNull(),
    windGust: real('wind_gust').notNull(),
    windDirection: varchar('wind_direction', { length: 16 }).notNull(),
    windChill: real('wind_chill').notNull(),
    pressure: real('pressure').notNull(),
    humidity: real('humidity').notNull(),
    visibilityMeters: integer('visibility_meters').notNull(),
    condition: varchar('condition', { length: 32 }).notNull(),
    provenance: dataProvenanceEnum('provenance').notNull().default('SIMULATED'),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_weather_station_time').on(table.stationId, table.recordedAt),
    index('idx_weather_provenance').on(table.provenance),
  ]
);

export const weatherObservationsRelations = relations(weatherObservations, ({ one }) => ({
  station: one(stations, { fields: [weatherObservations.stationId], references: [stations.id] }),
}));

// ── Incidents ────────────────────────────────────────────────

export const incidents = pgTable(
  'incidents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    stationId: uuid('station_id')
      .references(() => stations.id)
      .notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    severity: incidentSeverityEnum('severity').notNull().default('MEDIUM'),
    status: incidentStatusEnum('status').notNull().default('OPEN'),
    sourceAlertId: uuid('source_alert_id').references(() => alerts.id),
    affectedAssetId: uuid('affected_asset_id').references(() => assets.id),
    affectedZoneId: uuid('affected_zone_id').references(() => rooms.id),
    reportedBy: uuid('reported_by').references(() => users.id),
    assignedTo: uuid('assigned_to').references(() => users.id),
    rootCause: text('root_cause'),
    remediationSteps: jsonb('remediation_steps').notNull().default([]),
    slaDueDate: timestamp('sla_due_date', { withTimezone: true }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolutionNotes: text('resolution_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_incidents_station').on(table.stationId),
    index('idx_incidents_status').on(table.status),
    index('idx_incidents_severity').on(table.severity),
    index('idx_incidents_alert').on(table.sourceAlertId),
    index('idx_incidents_assigned').on(table.assignedTo),
  ]
);

export const incidentsRelations = relations(incidents, ({ one }) => ({
  station: one(stations, { fields: [incidents.stationId], references: [stations.id] }),
  sourceAlert: one(alerts, { fields: [incidents.sourceAlertId], references: [alerts.id] }),
  affectedAsset: one(assets, { fields: [incidents.affectedAssetId], references: [assets.id] }),
  affectedZone: one(rooms, { fields: [incidents.affectedZoneId], references: [rooms.id] }),
  reporter: one(users, { fields: [incidents.reportedBy], references: [users.id] }),
  assignee: one(users, { fields: [incidents.assignedTo], references: [users.id] }),
}));

// ── Edge Synchronization & Resilience ────────────────────────

export const edgeSyncBatches = pgTable(
  'edge_sync_batches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    stationId: uuid('station_id')
      .references(() => stations.id)
      .notNull(),
    edgeNodeId: varchar('edge_node_id', { length: 100 }).notNull(),
    batchNumber: integer('batch_number').notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 255 }).unique().notNull(),
    firstSequence: integer('first_sequence').notNull(),
    lastSequence: integer('last_sequence').notNull(),
    recordCount: integer('record_count').notNull().default(0),
    reconciledCount: integer('reconciled_count').notNull().default(0),
    duplicateCount: integer('duplicate_count').notNull().default(0),
    conflictCount: integer('conflict_count').notNull().default(0),
    status: syncStatusEnum('status').notNull().default('PENDING'),
    checksum: varchar('checksum', { length: 255 }).notNull(),
    errorInfo: text('error_info'),
    metadata: jsonb('metadata'),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    syncedAt: timestamp('synced_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_edge_batches_station_status').on(table.stationId, table.status),
    index('idx_edge_batches_edge_node').on(table.edgeNodeId),
    uniqueIndex('idx_edge_batches_idempotency').on(table.idempotencyKey),
  ]
);

export const edgeOutbox = pgTable(
  'edge_outbox',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    stationId: uuid('station_id')
      .references(() => stations.id)
      .notNull(),
    edgeNodeId: varchar('edge_node_id', { length: 100 }).notNull(),
    sequenceNumber: integer('sequence_number').notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 255 }).unique().notNull(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    payload: jsonb('payload').notNull(),
    status: syncStatusEnum('status').notNull().default('PENDING'),
    observedAt: timestamp('observed_at', { withTimezone: true }).notNull(),
    retryCount: integer('retry_count').notNull().default(0),
    lastError: text('last_error'),
    syncedAt: timestamp('synced_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_edge_outbox_station_status').on(table.stationId, table.status),
    index('idx_edge_outbox_seq').on(table.stationId, table.sequenceNumber),
    uniqueIndex('idx_edge_outbox_idempotency').on(table.idempotencyKey),
  ]
);

// ── NCPOR Expedition Reports ─────────────────────────────────

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    stationId: uuid('station_id')
      .references(() => stations.id)
      .notNull(),
    type: reportTypeEnum('type').notNull(),
    format: varchar('format', { length: 20 }).notNull().default('JSON'),
    title: varchar('title', { length: 255 }).notNull(),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    generatedBy: uuid('generated_by').references(() => users.id),
    dataCompletenessPercent: real('data_completeness_percent').notNull().default(100),
    summaryMetrics: jsonb('summary_metrics').notNull(),
    content: text('content'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_reports_station_type').on(table.stationId, table.type),
    index('idx_reports_period').on(table.periodStart, table.periodEnd),
  ]
);

export const edgeSyncBatchesRelations = relations(edgeSyncBatches, ({ one }) => ({
  station: one(stations, { fields: [edgeSyncBatches.stationId], references: [stations.id] }),
}));

export const edgeOutboxRelations = relations(edgeOutbox, ({ one }) => ({
  station: one(stations, { fields: [edgeOutbox.stationId], references: [stations.id] }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  station: one(stations, { fields: [reports.stationId], references: [stations.id] }),
  generator: one(users, { fields: [reports.generatedBy], references: [users.id] }),
}));

export type EdgeSyncBatchRecord = typeof edgeSyncBatches.$inferSelect;
export type InsertEdgeSyncBatch = typeof edgeSyncBatches.$inferInsert;
export type EdgeOutboxTableRecord = typeof edgeOutbox.$inferSelect;
export type InsertEdgeOutboxRecord = typeof edgeOutbox.$inferInsert;
export type ReportTableRecord = typeof reports.$inferSelect;
export type InsertReportRecord = typeof reports.$inferInsert;

