// ═══════════════════════════════════════════════════════════════
// Analytics Dashboard Types — NCPOR Antarctic Digital Twin
// ═══════════════════════════════════════════════════════════════

export type TimeframeOption = '24H' | '7D' | '30D' | '90D';

export type StationViewMode = 'MAITRI' | 'BHARATI' | 'BOTH';

export type HealthSeverity = 'HEALTHY' | 'WARNING' | 'CRITICAL';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

// 1. KPI Overview
export interface AnalyticsKpi {
  powerDemandKw: number;
  powerDemandDelta: number; // percentage change vs baseline
  powerGenerationKw: number;
  powerGenerationDelta: number;
  fuelRemainingLitres: number;
  fuelRemainingPercent: number;
  fuelDaysRemaining: number;
  fuelDaysDelta: number;
  generatorLoadPercent: number;
  generatorLoadDelta: number;
  temperatureC: number;
  temperatureDelta: number;
  stationHealthScore: number; // 0-100
  stationHealthDelta: number;
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
}

// 2. Energy Analytics
export interface EnergyDataPoint {
  timestamp: string;
  demandKw: number;
  generationKw: number;
  dieselKw: number;
  renewableKw: number;
}

export interface EnergyAnalytics {
  currentDemandKw: number;
  currentGenerationKw: number;
  peakDemandKw: number;
  peakDemandTime: string;
  baselineDemandKw: number;
  reserveHeadroomKw: number;
  trendPercentage: number;
  history: Record<TimeframeOption, EnergyDataPoint[]>;
}

// 3. Generator Performance
export interface GeneratorUnit {
  id: string;
  name: string;
  model: string;
  status: 'RUNNING' | 'STANDBY' | 'MAINTENANCE' | 'OFFLINE';
  healthState: HealthSeverity;
  loadPercent: number;
  temperatureC: number;
  runtimeHours: number;
  fuelConsumptionLph: number;
  efficiencyPercent: number;
  oilPressureBar: number;
  vibrationMmS: number;
  lastMaintenanceDate: string;
  nextServiceHours: number;
}

export interface GeneratorPerformanceData {
  generators: GeneratorUnit[];
  totalRunningCount: number;
  aggregateLoadPercent: number;
  aggregateFuelBurnLph: number;
}

// 4. Fuel Analytics
export interface FuelTank {
  id: string;
  name: string;
  type: string;
  currentLitres: number;
  capacityLitres: number;
  percent: number;
  status: 'OPTIMAL' | 'RESERVE' | 'DEPLETED';
}

export interface FuelConsumptionPoint {
  date: string;
  dailyBurnL: number;
  projectedBurnL: number;
  ambientTempC: number;
}

export interface FuelAnalyticsData {
  currentReserveLitres: number;
  totalCapacityLitres: number;
  reservePercent: number;
  dailyConsumptionLitres: number;
  daysRemaining: number;
  projectedDepletionDate: string;
  resupplyDate: string;
  resupplyBufferDays: number;
  isResupplyAtRisk: boolean;
  history: FuelConsumptionPoint[];
  tanks: FuelTank[];
}

// 5. Environmental Analytics
export type EnvironmentalMetricKey =
  | 'temperature'
  | 'windSpeed'
  | 'windDirection'
  | 'pressure'
  | 'humidity'
  | 'visibility';

export interface EnvironmentalDataPoint {
  timestamp: string;
  temperatureC: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  pressureHpa: number;
  humidityPercent: number;
  visibilityKm: number;
}

export interface EnvironmentalAnalyticsData {
  current: {
    temperatureC: number;
    windSpeedKmh: number;
    windDirectionDeg: number;
    windDirectionCardinal: string;
    pressureHpa: number;
    humidityPercent: number;
    visibilityKm: number;
    windChillC: number;
  };
  trendPoints: EnvironmentalDataPoint[];
}

// 6. Station Health & Risk
export interface DomainHealth {
  id: string;
  name: string;
  score: number; // 0-100
  status: HealthSeverity;
  subsystems: string[];
  anomaliesCount: number;
  trend: 'UP' | 'STABLE' | 'DOWN';
}

export interface StationHealthRiskData {
  overallHealthScore: number;
  overallHealthStatus: HealthSeverity;
  riskLevel: RiskLevel;
  riskScore: number;
  domains: {
    energy: DomainHealth;
    infrastructure: DomainHealth;
    environment: DomainHealth;
    logistics: DomainHealth;
    communications: DomainHealth;
    safety: DomainHealth;
  };
  riskBreakdown: {
    category: string;
    score: number;
    description: string;
  }[];
}

// 7. Forecasts
export interface ForecastSeriesPoint {
  timeOffset: string;
  predicted: number;
  lowerBound: number;
  upperBound: number;
}

export interface ForecastItem {
  id: string;
  title: string;
  unit: string;
  horizon: string;
  currentValue: number;
  projectedValue: number;
  confidencePercent: number;
  trendDirection: 'UP' | 'DOWN' | 'STABLE';
  summary: string;
  series: ForecastSeriesPoint[];
}

export interface ForecastData {
  powerDemand: ForecastItem;
  fuelReserve: ForecastItem;
  generatorLoad: ForecastItem;
  temperature: ForecastItem;
}

// 8. Maitri vs Bharati Comparative Metrics
export interface StationComparativeMetric {
  metric: string;
  key: string;
  unit: string;
  maitriValue: number | string;
  bharatiValue: number | string;
  maitriNumeric: number;
  bharatiNumeric: number;
  higherIsBetter: boolean;
  deltaText: string;
  status: 'MAITRI_AHEAD' | 'BHARATI_AHEAD' | 'BALANCED' | 'CRITICAL_DIVERGENCE';
}

export interface MaitriVsBharatiComparison {
  metrics: StationComparativeMetric[];
  summaryNote: string;
  lastSyncTime: string;
}

// 9. Operational Insights
export interface OperationalInsight {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'NORMAL' | 'INFO';
  category: string;
  title: string;
  description: string;
  subsystem: string;
  timestamp: string;
  recommendation?: string;
}

// 10. Cross-Domain Impact Cascade
export interface CascadeNode {
  id: string;
  label: string;
  parameter: string;
  value: string;
  status: HealthSeverity;
  impactText: string;
}

export interface CascadeScenario {
  id: string;
  title: string;
  triggerEvent: string;
  tempChangeC: number;
  nodes: CascadeNode[];
  overallRiskResult: RiskLevel;
  mechanicsDescription: string;
}

export interface CrossDomainImpactData {
  scenarios: CascadeScenario[];
}

// Complete Station Analytics Record
export interface StationAnalyticsDataset {
  stationId: 'MAITRI' | 'BHARATI';
  stationName: string;
  coordinates: string;
  kpi: AnalyticsKpi;
  energy: EnergyAnalytics;
  generators: GeneratorPerformanceData;
  fuel: FuelAnalyticsData;
  environmental: EnvironmentalAnalyticsData;
  healthRisk: StationHealthRiskData;
  forecasts: ForecastData;
  insights: OperationalInsight[];
  crossDomain: CrossDomainImpactData;
}
