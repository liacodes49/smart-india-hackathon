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
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'ON_HOLD',
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

// ── Users ────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
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
  manufacturer: varchar('manufacturer', { length: 255 }),
  model: varchar('model', { length: 255 }),
  serialNumber: varchar('serial_number', { length: 255 }),
  installDate: timestamp('install_date', { withTimezone: true }),
  status: sensorStatusEnum('status').notNull().default('NORMAL'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

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
});

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
});

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
});

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
