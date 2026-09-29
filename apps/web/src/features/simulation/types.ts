// ═══════════════════════════════════════════════════════════════
// Simulation Types — NCPOR Antarctic Digital Twin
// ═══════════════════════════════════════════════════════════════

import {
  SimulationType,
  SimulationStatus,
  AlertSeverity,
  StationId,
} from '@repo/shared/enums';
import type { SimulationResult } from '@repo/shared/types';

export type HeatingDemandLevel = 'LOW' | 'NOMINAL' | 'ELEVATED' | 'CRITICAL_100';
export type SimulationRiskLevel = 'LOW' | 'MODERATE' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';

export interface GeneratorAvailabilityState {
  gen1: boolean;
  gen2: boolean;
  gen3: boolean;
}

export interface SimulationParametersConfig {
  temperatureDeltaC: number; // e.g. -20 for a 20°C drop
  powerDemandDeltaPercent: number; // e.g. +35 for 35% surge
  heatingDemand: HeatingDemandLevel;
  generatorAvailability: GeneratorAvailabilityState;
  fuelConsumptionMultiplier: number; // e.g. 1.4 for 1.4x burn
  resupplyDelayDays: number; // e.g. 30 days delayed
}

export interface ScenarioPreset {
  type: SimulationType;
  title: string;
  shortDesc: string;
  description: string;
  defaultParams: SimulationParametersConfig;
}

export interface TrajectoryPoint {
  timeLabel: string;
  baseline: number;
  simulated: number;
}

export interface SimulationOutputMetrics {
  impactScore: number; // 0 - 100
  riskLevel: SimulationRiskLevel;
  simulatedPowerDemandKw: number;
  baselinePowerDemandKw: number;
  activeGenerationCapacityKw: number;
  generatorLoadPercent: number;
  simulatedDailyBurnL: number;
  baselineDailyBurnL: number;
  projectedDaysRemaining: number;
  baselineDaysRemaining: number;
  failureHorizonHours: number | null; // null if stable
  powerTrajectory: TrajectoryPoint[];
  fuelTrajectory: TrajectoryPoint[];
}

// ── Comparison & Consequence Types ──────────────────────────────

export type ChangeStatus = 'nominal' | 'warning' | 'critical' | 'improved';

export interface GeneratorUnitComparison {
  id: string;
  name: string;
  baselineLoadPercent: number;
  simulatedLoadPercent: number;
  deltaPercent: number;
  status: 'ONLINE' | 'STANDBY' | 'TRIPPED' | 'OFFLINE' | 'OVERLOADED';
  capacityKw: number;
  baselineKw: number;
  simulatedKw: number;
}

export interface MetricDeltaComparison<T = number> {
  name: string;
  currentValue: T;
  simulatedValue: T;
  unit: string;
  delta: number;
  deltaPercent?: number;
  formattedCurrent: string;
  formattedSimulated: string;
  changeDirection: 'increase' | 'decrease' | 'unchanged';
  status: ChangeStatus;
  changeSummary: string; // e.g. "74% → 91%"
}

export interface CurrentVsSimulatedState {
  powerDemand: MetricDeltaComparison<number>;
  generatorLoad: MetricDeltaComparison<number> & {
    generatorUnits: GeneratorUnitComparison[];
  };
  fuelConsumption: MetricDeltaComparison<number>;
  fuelReserve: MetricDeltaComparison<number> & {
    currentVolumeL: number;
    simulatedVolumeL: number;
    resupplyBufferDays: number;
    resupplyDelayDays: number;
  };
  stationHealth: MetricDeltaComparison<number> & {
    subsystems: {
      id: string;
      name: string;
      currentPercent: number;
      simulatedPercent: number;
      status: ChangeStatus;
    }[];
  };
  riskLevel: {
    current: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
    simulated: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
    changeSummary: string; // e.g. "MEDIUM → HIGH"
    status: ChangeStatus;
    currentScore: number;
    simulatedScore: number;
  };
}

export interface PredictedConsequence {
  id: string;
  title: string;
  subsystem: string;
  severity: AlertSeverity;
  timeHorizon: string; // e.g. "Immediate", "Within 4.5 Hours", "Day 34"
  description: string;
  impactMetric: string; // e.g. "Manifold Temp > 480°C", "Intake Freezing"
  secondaryImpact?: string;
}

export type ActionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface RecommendedAction {
  id: string;
  title: string;
  category: 'IMMEDIATE' | 'CONTINGENCY' | 'LOGISTICS' | 'LOAD_SHEDDING';
  priority: ActionPriority;
  description: string;
  expectedBenefit: string; // e.g. "Reduces Generator 02 load from 91% → 61%"
  suggestedBy: string;
  actionableKey:
    | 'START_BACKUP_GEN'
    | 'REDUCE_LOAD'
    | 'SCHEDULE_RESUPPLY'
    | 'TRACE_HEAT_MAX'
    | 'ZONE_CONSERVE'
    | 'CUSTOM';
  mitigationEffect?: {
    loadDeltaKw?: number;
    fuelSavingsL?: number;
    healthRecovery?: number;
  };
}

export interface DetailedSimulationRun {
  id: string;
  stationId: StationId;
  name: string;
  type: SimulationType;
  description: string;
  status: SimulationStatus;
  parameters: SimulationParametersConfig;
  metrics: SimulationOutputMetrics;
  results: SimulationResult;
  stateComparison: CurrentVsSimulatedState;
  predictedConsequences: PredictedConsequence[];
  recommendedActions: RecommendedAction[];
  executedAt: string;
  durationMs: number;
}
