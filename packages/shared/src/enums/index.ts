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
  RECOMMENDED = 'RECOMMENDED',
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
}

/** Data provenance tracking source of observation or prediction */
export enum DataProvenance {
  SIMULATED = 'SIMULATED',
  SENSOR = 'SENSOR',
  EXTERNAL_API = 'EXTERNAL_API',
  MANUAL = 'MANUAL',
  EDGE_SYNC = 'EDGE_SYNC',
}

/** Operational connectivity states for edge station nodes */
export enum ConnectivityState {
  ONLINE = 'ONLINE',
  DEGRADED = 'DEGRADED',
  BLACKOUT = 'BLACKOUT',
}

/** Synchronization status for edge batches and outbox records */
export enum SyncStatus {
  PENDING = 'PENDING',
  SYNCING = 'SYNCING',
  SYNCED = 'SYNCED',
  FAILED = 'FAILED',
  CONFLICT = 'CONFLICT',
}

/** Supported industrial ingestion gateway protocols */
export enum GatewayProtocol {
  REST = 'REST',
  MQTT = 'MQTT',
  MODBUS = 'MODBUS',
  MANUAL = 'MANUAL',
}

/** Formal NCPOR expedition report types */
export enum ReportType {
  DAILY_SITREP = 'DAILY_SITREP',
  WEEKLY_ENERGY = 'WEEKLY_ENERGY',
  FUEL_AUDIT = 'FUEL_AUDIT',
  INCIDENT_SUMMARY = 'INCIDENT_SUMMARY',
}

/** Supported report export file formats */
export enum ReportFormat {
  JSON = 'JSON',
  CSV = 'CSV',
}

/** Operational risk levels */
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/** Standard prediction horizons */
export enum PredictionHorizon {
  ONE_HOUR = '1h',
  SIX_HOURS = '6h',
  TWENTY_FOUR_HOURS = '24h',
  SEVEN_DAYS = '7d',
  THIRTY_DAYS = '30d',
}

/** Polar weather conditions */
export enum WeatherCondition {
  CLEAR = 'CLEAR',
  PARTLY_CLOUDY = 'PARTLY_CLOUDY',
  OVERCAST = 'OVERCAST',
  SNOW = 'SNOW',
  BLIZZARD = 'BLIZZARD',
  KATABATIC_GALE = 'KATABATIC_GALE',
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

/** Asset criticality levels */
export enum AssetCriticality {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/** Inventory & Resource categories */
export enum InventoryCategory {
  FUEL = 'FUEL',
  FOOD = 'FOOD',
  WATER = 'WATER',
  MEDICAL = 'MEDICAL',
  SPARE_PARTS = 'SPARE_PARTS',
  CONSUMABLES = 'CONSUMABLES',
}

/** Operational incident severity levels */
export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/** Operational incident lifecycle status */
export enum IncidentStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

/** 3D Spatial Digital Twin health status color codes */
export enum SpatialHealthColor {
  GREEN = 'GREEN',   // Pristine / Normal (Health >= 80, no active alerts)
  YELLOW = 'YELLOW', // Caution / Warning (Health 50-79, warning alert)
  RED = 'RED',       // Critical / Breach (Health < 50, critical alert)
}

/** Provenance of 3D spatial positioning data */
export enum SpatialProvenance {
  CONFIGURED = 'CONFIGURED', // Explicit measured Cartesian coordinate
  DERIVED = 'DERIVED',       // Inferred from parent building / zone layout
  DEFAULT = 'DEFAULT',       // Deterministic synthetic fallback offset
}
