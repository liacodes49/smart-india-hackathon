// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Shared Enums
// ═══════════════════════════════════════════════════════════════
// These enums are the single source of truth for both frontend
// and backend. Never redefine these in individual apps.
// ═══════════════════════════════════════════════════════════════

/** User roles for RBAC enforcement */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  STATION_ADMIN = 'STATION_ADMIN',
  SCIENTIST = 'SCIENTIST',
  OPERATOR = 'OPERATOR',
  VIEWER = 'VIEWER',
}

/** Antarctic research station identifiers */
export enum StationId {
  MAITRI = 'MAITRI',
  BHARATI = 'BHARATI',
}

/** Station operational status */
export enum StationStatus {
  OPERATIONAL = 'OPERATIONAL',
  MAINTENANCE = 'MAINTENANCE',
  EMERGENCY = 'EMERGENCY',
  OFFLINE = 'OFFLINE',
  WINTERIZED = 'WINTERIZED',
}

/** Sensor classification types */
export enum SensorType {
  TEMPERATURE = 'TEMPERATURE',
  HUMIDITY = 'HUMIDITY',
  PRESSURE = 'PRESSURE',
  WIND_SPEED = 'WIND_SPEED',
  WIND_DIRECTION = 'WIND_DIRECTION',
  POWER = 'POWER',
  FUEL = 'FUEL',
  BATTERY = 'BATTERY',
  CO2 = 'CO2',
  WATER = 'WATER',
  NETWORK = 'NETWORK',
  STRUCTURAL = 'STRUCTURAL',
  VIBRATION = 'VIBRATION',
  SOLAR_RADIATION = 'SOLAR_RADIATION',
}

/** Sensor reading health status */
export enum SensorStatus {
  NORMAL = 'NORMAL',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  OFFLINE = 'OFFLINE',
  MAINTENANCE = 'MAINTENANCE',
}

/** Alert severity levels */
export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  EMERGENCY = 'EMERGENCY',
}

/** Alert lifecycle status */
export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
  DISMISSED = 'DISMISSED',
}

/** Alert categories */
export enum AlertCategory {
  ENVIRONMENTAL = 'ENVIRONMENTAL',
  EQUIPMENT = 'EQUIPMENT',
  POWER = 'POWER',
  STRUCTURAL = 'STRUCTURAL',
  SAFETY = 'SAFETY',
  NETWORK = 'NETWORK',
}

/** Maintenance types */
export enum MaintenanceType {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
  PREDICTIVE = 'PREDICTIVE',
  EMERGENCY = 'EMERGENCY',
}

/** Maintenance priority */
export enum MaintenancePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/** Maintenance work order status */
export enum MaintenanceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
}

/** Prediction model types */
export enum PredictionType {
  ANOMALY_DETECTION = 'ANOMALY_DETECTION',
  FAILURE_PREDICTION = 'FAILURE_PREDICTION',
  ENERGY_FORECAST = 'ENERGY_FORECAST',
  WEATHER_FORECAST = 'WEATHER_FORECAST',
  MAINTENANCE_PREDICTION = 'MAINTENANCE_PREDICTION',
}

/** Simulation scenario types */
export enum SimulationType {
  POWER_FAILURE = 'POWER_FAILURE',
  EQUIPMENT_FAILURE = 'EQUIPMENT_FAILURE',
  WEATHER_EXTREME = 'WEATHER_EXTREME',
  EVACUATION = 'EVACUATION',
  SUPPLY_SHORTAGE = 'SUPPLY_SHORTAGE',
  CUSTOM = 'CUSTOM',
}

/** Simulation run status */
export enum SimulationStatus {
  DRAFT = 'DRAFT',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/** Asset categories */
export enum AssetCategory {
  GENERATOR = 'GENERATOR',
  HVAC = 'HVAC',
  COMMUNICATION = 'COMMUNICATION',
  WATER_TREATMENT = 'WATER_TREATMENT',
  FIRE_SAFETY = 'FIRE_SAFETY',
  RESEARCH_EQUIPMENT = 'RESEARCH_EQUIPMENT',
  VEHICLE = 'VEHICLE',
  STORAGE = 'STORAGE',
  STRUCTURAL = 'STRUCTURAL',
}

/** Audit log action types */
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ACKNOWLEDGE_ALERT = 'ACKNOWLEDGE_ALERT',
  RUN_SIMULATION = 'RUN_SIMULATION',
  EXPORT_REPORT = 'EXPORT_REPORT',
}
