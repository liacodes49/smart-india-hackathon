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
  AssetCriticality,
  InventoryCategory,
  DataProvenance,
  RiskLevel,
  PredictionHorizon,
  WeatherCondition,
  IncidentSeverity,
  IncidentStatus,
  SpatialHealthColor,
  SpatialProvenance,
  ConnectivityState,
  SyncStatus,
  GatewayProtocol,
  ReportType,
  ReportFormat,
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
  criticality?: AssetCriticality;
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

export interface SignedDelta {
  baseline: number;
  projected: number;
  delta: number; // Signed delta (projected - baseline)
  unit: string;
}

export interface SimulationDeltas {
  powerDemandKw: SignedDelta;
  generationCapacityKw: SignedDelta;
  fuelBurnRateLph: SignedDelta;
  fuelRemainingLiters: SignedDelta;
  daysToReserveThreshold: SignedDelta;
  daysToDepletion: SignedDelta;
  compositeRiskScore: SignedDelta;
}

export interface SimulationTimelineStep {
  offsetHours: number; // e.g. 0, 1, 6, 24, 168 (7d), 720 (30d)
  horizonLabel: 'T+0' | 'T+1h' | 'T+6h' | 'T+24h' | 'T+7d' | 'T+30d';
  timestamp: string;
  powerDemandKw: number;
  availableGenerationKw: number;
  batterySocPercent: number;
  fuelRemainingLiters: number;
  fuelBurnRateLph: number;
  ambientTemperatureC: number;
  internalTemperatureC?: number;
  compositeRiskScore: number;
  riskLevel: RiskLevel;
  triggeredWarnings: string[];
  mitigationOpportunities: string[];
}

export interface SimulationMitigation {
  action: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedAssetOrZone?: string;
  expectedBenefit: string;
  reasoning: string;
  assumptions: string[];
}

export interface SimulationResult {
  summary: string;
  impactScore: number;
  affectedSystems: string[];
  recommendations: string[];
  timeline?: SimulationTimelineEvent[];
  deltas: SimulationDeltas;
  timelineSteps: SimulationTimelineStep[];
  mitigations: SimulationMitigation[];
  assumptions: string[];
  executedAt: string;
  durationMs: number;
}

export interface SimulationTimelineEvent {
  timestamp: string;
  event: string;
  severity: AlertSeverity;
  system: string;
}

// ── Incidents ────────────────────────────────────────────────

export interface Incident extends BaseEntity {
  stationId: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  sourceAlertId?: string;
  affectedAssetId?: string;
  affectedZoneId?: string;
  reportedBy?: string;
  assignedTo?: string;
  rootCause?: string;
  remediationSteps: string[];
  slaDueDate?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

// ── 2D/3D Spatial Digital Twin ───────────────────────────────

export interface SpatialCoordinate3D {
  x: number;
  y: number;
  z: number;
}

export interface SpatialDimensions3D {
  width: number;
  length: number;
  height: number;
}

export interface SpatialTwinNode {
  id: string;
  name: string;
  type: 'STATION' | 'BUILDING' | 'ROOM' | 'ASSET' | 'SENSOR';
  position: SpatialCoordinate3D;
  dimensions?: SpatialDimensions3D;
  spatialProvenance: SpatialProvenance;
  status: string;
  healthScore: number; // 0–100
  healthColor: SpatialHealthColor;
  activeAlertCount: number;
  alertPins: Array<{
    alertId: string;
    severity: AlertSeverity;
    title: string;
  }>;
  telemetrySummary?: Record<string, { value: number; unit: string }>;
  children?: SpatialTwinNode[];
}

export interface SpatialStationState {
  stationId: string;
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
  status: StationStatus;
  environmentalSkybox: {
    ambientTemperatureC: number;
    windSpeedKmh: number;
    windDirectionDeg: number;
    condition: WeatherCondition;
    blizzardVisibilityFactor: number; // 0 (zero visibility) to 1.0 (clear)
  };
  stationHealthScore: number;
  riskLevel: RiskLevel;
  riskAssessment?: StationRiskAssessment;
  edgeStatus: 'ONLINE' | 'DEGRADED' | 'BLACKOUT';
  rootNodes: SpatialTwinNode[];
  generatedAt: string;
}

// ── AI Operations Assistant Decision Support ─────────────────

export interface AssistantEvidence {
  source: 'station_health' | 'fuel_forecast' | 'equipment_health' | 'simulation_result' | 'active_incidents' | 'weather';
  timestamp: string;
  fields: string[];
  data: Record<string, unknown>;
}

export interface AssistantQueryRequest {
  message: string;
  stationId?: string;
  conversationContext?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface AssistantQueryResponse {
  answer: string;
  evidence: AssistantEvidence[];
  toolsInvoked: string[];
  suggestedActions: string[];
  groundingStatus: 'GROUNDED' | 'INSUFFICIENT_DATA';
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

// ── Inventory & Resources ────────────────────────────────────

export interface InventoryItem extends BaseEntity {
  stationId: string;
  name: string;
  code: string;
  category: InventoryCategory;
  currentStock: number;
  minimumThreshold: number;
  unit: string;
  location?: string;
  expirationDate?: string;
  resupplyDate?: string;
  metadata?: Record<string, unknown>;
}

export interface ResourceConsumption extends BaseEntity {
  inventoryItemId: string;
  stationId: string;
  assetId?: string;
  quantity: number;
  unit: string;
  loggedAt: string;
  loggedBy?: string;
  notes?: string;
}

// ── Energy ───────────────────────────────────────────────────

export interface EnergySummary {
  stationId: string;
  totalGenerationKw: number;
  loadFactorPercent: number;
  fuelReservesPercent: number;
  fuelEstimatedHoursRemaining: number;
  activeGenerators: number;
  totalGenerators: number;
  batterySocPercent?: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  timestamp: string;
}

// ── Weather & Polar Environment ──────────────────────────────

export interface WeatherObservation extends BaseEntity {
  stationId: string;
  temperature: number;
  windSpeed: number;
  windGust: number;
  windDirection: string;
  windChill: number;
  pressure: number;
  humidity: number;
  visibilityMeters: number;
  condition: WeatherCondition;
  provenance: DataProvenance;
  recordedAt: string;
}

export interface WeatherForecast {
  stationId: string;
  forecastDate: string;
  horizon: PredictionHorizon;
  expectedCondition: WeatherCondition;
  tempMin: number;
  tempMax: number;
  windSpeedAvg: number;
  windGustMax: number;
  windChillMin: number;
  pressureTrend: 'RISING' | 'FALLING' | 'STABLE';
  blizzardRiskPercent: number;
  stormSeverityScore: number; // 0–100 deterministic index
  provenance: DataProvenance;
  confidenceScore: number;
  assumptions: string[];
}

// ── Equipment Health & Estimated RUL ─────────────────────────

export interface EstimatedRul {
  estimateHours: number;
  minHours: number;
  maxHours: number;
  confidence: number;
  degradationTrend: 'STABLE' | 'DEGRADING' | 'RAPID_DEGRADATION';
}

export interface ContributingSignal {
  sensorId: string;
  sensorName: string;
  sensorType: SensorType;
  currentValue: number;
  unit: string;
  baseline: number;
  deviationPercent: number;
  stressWeight: number;
}

export interface EquipmentHealthSummary {
  assetId: string;
  assetName: string;
  stationId: string;
  category: AssetCategory;
  healthScore: number; // 0–100 (100 is pristine, 0 is failed)
  anomalyScore: number; // 0–100 statistical Z-score mapped
  failureRiskEstimate: RiskLevel;
  estimatedRul: EstimatedRul;
  status: SensorStatus;
  topContributingSignals: ContributingSignal[];
  operatingStressFactors: string[];
  assumptions: string[];
  lastEvaluatedAt: string;
}

// ── Fuel Depletion & Resource Forecasting ────────────────────

export interface FuelDepletionForecast {
  stationId: string;
  currentStockLiters: number;
  dailyBurnRateLiters: number;
  estimatedDaysRemaining: number;
  estimatedDepletionDate: string;
  daysToMinimumThreshold: number;
  thresholdBreachDate: string;
  resupplyFeasible: boolean;
  nextResupplyDate?: string;
  confidenceScore: number;
  calculationBasis: string;
  influencingFactors: {
    electricalLoadKw: number;
    ambientTempC: number;
    thermalPenaltyPercent: number;
    loadBurnFactor: number;
  };
  assumptions: string[];
  forecastedAt: string;
}

// ── Composite Risk Assessment (4-Pillar Model) ───────────────

export interface PillarScore {
  score: number; // 0–100 normalized
  weight: number; // Configurable weight
  weightedScore: number;
  status: RiskLevel;
  calculationBasis: string;
  metadata: Record<string, unknown>;
}

export interface RiskPillarBreakdown {
  energyRisk: PillarScore;
  equipmentRisk: PillarScore;
  weatherRisk: PillarScore;
  supplyRisk: PillarScore;
}

export interface RiskDriver {
  pillar: 'ENERGY' | 'EQUIPMENT' | 'WEATHER' | 'SUPPLY';
  description: string;
  score: number;
  impact: RiskLevel;
}

export interface StationRiskAssessment {
  stationId: string;
  compositeScore: number; // 0–100 normalized composite
  riskLevel: RiskLevel;
  isEmergencyOverride: boolean;
  overrideReason?: string;
  pillars: RiskPillarBreakdown;
  topDrivers: RiskDriver[];
  recommendedActions: string[];
  confidenceScore: number;
  assumptions: string[];
  assessedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// Sprint 5 — Edge Synchronization & Resilience Types
// ═══════════════════════════════════════════════════════════════

export interface EdgeConnectivityState {
  stationId: string;
  state: ConnectivityState;
  previousState?: ConnectivityState;
  reason?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface EdgeSyncBatchSummary {
  id: string;
  stationId: string;
  edgeNodeId: string;
  batchNumber: number;
  idempotencyKey: string;
  firstSequence: number;
  lastSequence: number;
  recordCount: number;
  reconciledCount: number;
  duplicateCount: number;
  conflictCount: number;
  status: SyncStatus;
  checksum: string;
  errorInfo?: string | null;
  createdAt: string;
  receivedAt: string;
  syncedAt?: string | null;
}

export interface EdgeOutboxRecord {
  id: string;
  stationId: string;
  edgeNodeId: string;
  sequenceNumber: number;
  idempotencyKey: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: SyncStatus;
  observedAt: string;
  retryCount: number;
  lastError?: string | null;
  createdAt: string;
  syncedAt?: string | null;
}

export interface SyncBatchReadingItem {
  sensorId: string;
  stationId: string;
  value: number;
  unit: string;
  timestamp: string; // ISO string representing observedAt
  status?: SensorStatus;
  quality?: number;
  sequenceNumber?: number;
  idempotencyKey?: string;
  provenance?: DataProvenance;
}

export interface SyncBatchEventItem {
  eventId: string;
  eventType: string;
  stationId: string;
  observedAt: string;
  sequenceNumber?: number;
  payload: Record<string, unknown>;
}

export interface SyncBatchPayload {
  stationId: string;
  edgeNodeId: string;
  batchNumber: number;
  idempotencyKey: string;
  firstSequence: number;
  lastSequence: number;
  checksum: string;
  readings: SyncBatchReadingItem[];
  events?: SyncBatchEventItem[];
}

export interface SyncBatchResult {
  batchId: string;
  stationId: string;
  edgeNodeId: string;
  status: SyncStatus;
  reconciledCount: number;
  duplicateCount: number;
  conflictCount: number;
  failedCount: number;
  isIdempotentReplay: boolean;
  message: string;
  processedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// Sprint 5 — Industrial Telemetry Gateway Types
// ═══════════════════════════════════════════════════════════════

export interface GatewayIngestPayload {
  protocol: GatewayProtocol;
  stationId: string;
  payload: unknown;
  deviceTag?: string;
  timestamp?: string;
}

export interface GatewayNormalizationResult {
  success: boolean;
  readings: SyncBatchReadingItem[];
  quarantined: Array<{
    raw: unknown;
    reason: string;
    code: string;
  }>;
}

export interface GatewayIngestResult {
  protocol: GatewayProtocol;
  stationId: string;
  acceptedCount: number;
  quarantinedCount: number;
  duplicateCount: number;
  alertsTriggered: number;
  batchId: string;
  timestamp: string;
}

export interface GatewayStats {
  totalIngested: number;
  totalAccepted: number;
  totalQuarantined: number;
  byProtocol: Record<GatewayProtocol, number>;
  lastIngestAt?: string;
}

export interface DeadLetterItem {
  id: string;
  protocol: GatewayProtocol;
  stationId: string;
  reason: string;
  code: string;
  rawPayload: unknown;
  quarantinedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// Sprint 5 — Historical Analytics & Reliability Types
// ═══════════════════════════════════════════════════════════════

export type TimeResolution = 'hourly' | 'daily';

export interface EnergyRollupPoint {
  bucket: string;
  avgPowerDemandKw: number;
  peakPowerDemandKw: number;
  minPowerDemandKw: number;
  totalGenerationKwh: number;
  avgGeneratorLoadFactor: number;
  sampleCount: number;
  dataQualityPercent: number;
}

export interface HistoricalEnergyTrend {
  stationId: string;
  startTime: string;
  endTime: string;
  resolution: TimeResolution;
  points: EnergyRollupPoint[];
  summary: {
    avgLoadFactor: number;
    totalGenerationKwh: number;
    peakDemandKw: number;
    dataCompletenessPercent: number;
  };
}

export interface FuelRollupPoint {
  bucket: string;
  measuredConsumptionLiters: number;
  estimatedConsumptionLiters: number;
  burnRateLph: number;
  ambientTempC?: number;
  thermalPenaltyPercent?: number;
  provenance: DataProvenance;
}

export interface HistoricalFuelTrend {
  stationId: string;
  startTime: string;
  endTime: string;
  resolution: TimeResolution;
  points: FuelRollupPoint[];
  totalMeasuredLiters: number;
  totalEstimatedLiters: number;
  avgBurnRateLph: number;
  provenanceSummary: Record<string, number>;
}

export interface StationReliabilityMetrics {
  stationId: string;
  periodStart: string;
  periodEnd: string;
  totalOperatingHours: number;
  verifiedIncidentCount: number;
  verifiedFailureCount: number;
  completedRepairsCount: number;
  totalRepairDurationHours: number;
  mtbfHours: number;
  mttrHours: number;
  availabilityPercent: number;
  calculationBasis: string;
  assumptions: string[];
  dataLimitations: string[];
  calculatedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// Sprint 5 — NCPOR Expedition Report Types
// ═══════════════════════════════════════════════════════════════

export interface StationReportExport {
  id: string;
  stationId: string;
  type: ReportType;
  format: ReportFormat;
  title: string;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  author: string;
  dataCompletenessPercent: number;
  metrics: Record<string, unknown>;
  content?: string | Record<string, unknown>;
}


