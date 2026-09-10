// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Shared Type Definitions
// ═══════════════════════════════════════════════════════════════

import type {
  UserRole,
  StationId,
  StationStatus,
  SensorType,
  SensorStatus,
  AlertSeverity,
  AlertStatus,
  AlertCategory,
  MaintenanceType,
  MaintenancePriority,
  MaintenanceStatus,
  PredictionType,
  SimulationType,
  SimulationStatus,
  AssetCategory,
  AuditAction,
} from '../enums/index.js';

// ── Base ─────────────────────────────────────────────────────

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ── Users ────────────────────────────────────────────────────

export interface User extends BaseEntity {
  email: string;
  name: string;
  role: UserRole;
  stationId?: StationId;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
}

export interface UserProfile extends Omit<User, 'createdAt' | 'updatedAt'> {
  permissions: string[];
}

// ── Stations ─────────────────────────────────────────────────

export interface Station extends BaseEntity {
  stationId: StationId;
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
  status: StationStatus;
  timezone: string;
  description?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface Building extends BaseEntity {
  stationId: string;
  name: string;
  code: string;
  floors: number;
  purpose: string;
  coordinates?: { x: number; y: number; z: number };
}

export interface Room extends BaseEntity {
  buildingId: string;
  name: string;
  code: string;
  floor: number;
  purpose: string;
  area?: number;
}

// ── Assets ───────────────────────────────────────────────────

export interface Asset extends BaseEntity {
  stationId: string;
  buildingId?: string;
  roomId?: string;
  name: string;
  code: string;
  category: AssetCategory;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installDate?: string;
  status: SensorStatus;
  metadata?: Record<string, unknown>;
}

// ── Sensors ──────────────────────────────────────────────────

export interface Sensor extends BaseEntity {
  assetId: string;
  stationId: string;
  name: string;
  type: SensorType;
  unit: string;
  minThreshold?: number;
  maxThreshold?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  status: SensorStatus;
  lastReading?: number;
  lastReadingAt?: string;
}

// ── Telemetry ────────────────────────────────────────────────

export interface TelemetryReading {
  id: string;
  sensorId: string;
  stationId: string;
  timestamp: string;
  value: number;
  unit: string;
  status: SensorStatus;
  quality?: number;
}

export interface TelemetrySummary {
  sensorId: string;
  sensorName: string;
  sensorType: SensorType;
  currentValue: number;
  unit: string;
  status: SensorStatus;
  min24h: number;
  max24h: number;
  avg24h: number;
  trend: 'rising' | 'falling' | 'stable';
}

// ── Alerts ───────────────────────────────────────────────────

export interface Alert extends BaseEntity {
  stationId: string;
  sensorId?: string;
  assetId?: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  category: AlertCategory;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  metadata?: Record<string, unknown>;
}

// ── Predictions ──────────────────────────────────────────────

export interface Prediction extends BaseEntity {
  stationId: string;
  sensorId?: string;
  assetId?: string;
  type: PredictionType;
  title: string;
  description: string;
  confidence: number;
  predictedValue?: number;
  predictedAt: string;
  horizon: string;
  metadata?: Record<string, unknown>;
}

// ── Simulations ──────────────────────────────────────────────

export interface Simulation extends BaseEntity {
  stationId: string;
  name: string;
  type: SimulationType;
  description: string;
  status: SimulationStatus;
  parameters: Record<string, unknown>;
  results?: SimulationResult;
  startedAt?: string;
  completedAt?: string;
  createdBy: string;
}

export interface SimulationResult {
  summary: string;
  impactScore: number;
  affectedSystems: string[];
  recommendations: string[];
  timeline: SimulationTimelineEvent[];
}

export interface SimulationTimelineEvent {
  timestamp: string;
  event: string;
  severity: AlertSeverity;
  system: string;
}

// ── Maintenance ──────────────────────────────────────────────

export interface MaintenanceRecord extends BaseEntity {
  stationId: string;
  assetId: string;
  title: string;
  description: string;
  type: MaintenanceType;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assignedTo?: string;
  scheduledDate?: string;
  completedDate?: string;
  notes?: string;
}

// ── Audit ────────────────────────────────────────────────────

export interface AuditLog extends BaseEntity {
  userId: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

// ── API ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ── Dashboard ────────────────────────────────────────────────

export interface DashboardStats {
  totalAssets: number;
  activeAlerts: number;
  criticalAlerts: number;
  sensorsOnline: number;
  sensorsTotal: number;
  pendingMaintenance: number;
  powerStatus: number;
  fuelLevel: number;
}

export interface StationOverview {
  station: Station;
  stats: DashboardStats;
  recentAlerts: Alert[];
  telemetrySummary: TelemetrySummary[];
}
