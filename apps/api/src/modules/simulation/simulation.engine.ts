// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — What-If Simulation Engine
// ═══════════════════════════════════════════════════════════════
// Pure, deterministic computation engine for isolated scenario evaluation.
// INVARIANT: LIVE STATE != SCENARIO STATE
// Under no circumstances does this engine write to or mutate live database tables.
// Computes multi-step discrete timeline projections (T+0, T+1h, T+6h, T+24h, T+7d, T+30d),
// signed operational deltas, and actionable mitigation recommendations.
// ═══════════════════════════════════════════════════════════════

import {
  SimulationType,
  RiskLevel,
  type SimulationResult,
  type SimulationDeltas,
  type SimulationTimelineStep,
  type SimulationMitigation,
  type SignedDelta,
} from '@repo/shared';

export const SIMULATION_PROTOTYPE_ASSUMPTIONS = [
  'PROTOTYPE_ASSUMPTION: Simplified 1D Fourier thermal decay model assuming lump-parameter thermal mass (C_th = 45 MJ/K) and uniform indoor air mixing.',
  'PROTOTYPE_ASSUMPTION: Nominal Antarctic station generation baseline is 2x 62.5 kW diesel generators (125 kW total rated capacity).',
  'PROTOTYPE_ASSUMPTION: Battery storage capacity modeled as 48 kWh nominal with linear depth-of-discharge autonomy curve.',
  'PROTOTYPE_ASSUMPTION: Station electrical load prioritized as: Tier 1 Life Support & Comms (40%), Tier 2 Living/HVAC (35%), Tier 3 Science Labs (25%).',
  'PROTOTYPE_ASSUMPTION: Building envelope heat transfer coefficient U = 0.25 W/(m²·K) with effective insulated surface area A = 650 m².',
  'PROTOTYPE_ASSUMPTION: Wind infiltration convective loss penalty scaled as 15% * (V / 40)^0.5.',
];

export interface BaselineStationState {
  stationId: string;
  name: string;
  powerDemandKw: number;
  ratedGenerationCapacityKw: number;
  activeGenerators: number;
  batterySocPercent: number;
  currentFuelStockLiters: number;
  fuelBurnRateLph: number;
  fuelAutonomyDays: number;
  daysToReserveThreshold: number;
  ambientTemperatureC: number;
  internalTemperatureC: number;
  compositeRiskScore: number;
  riskLevel: RiskLevel;
  criticalAssetsHealth: number; // 0-100 average
  waterStockLiters?: number;
  foodStockDays?: number;
}

export class SimulationEngine {
  /**
   * Execute an isolated what-if simulation against an immutable baseline snapshot
   */
  executeScenario(
    type: SimulationType | string,
    parameters: Record<string, unknown>,
    baseline: BaselineStationState
  ): SimulationResult {
    const startTime = Date.now();

    // Deep clone baseline to guarantee zero mutation
    const b = JSON.parse(JSON.stringify(baseline)) as BaselineStationState;

    switch (type) {
      case SimulationType.POWER_FAILURE:
        return this.simulatePowerFailure(parameters, b, startTime);
      case SimulationType.WEATHER_EXTREME:
        return this.simulateWeatherExtreme(parameters, b, startTime);
      case SimulationType.SUPPLY_SHORTAGE:
        return this.simulateSupplyShortage(parameters, b, startTime);
      case SimulationType.EQUIPMENT_FAILURE:
        return this.simulateEquipmentFailure(parameters, b, startTime);
      default:
        return this.simulateCustom(parameters, b, startTime);
    }
  }

  // ── 1. Power Failure Simulation Archetype ──────────────────────

  private simulatePowerFailure(
    params: Record<string, unknown>,
    b: BaselineStationState,
    startTime: number
  ): SimulationResult {
    const offlineGenerators = Number(params.offlineGeneratorCount ?? 1);
    const tier3Shedding = Boolean(params.tier3LoadShedding ?? false);
    const batteryFailure = Boolean(params.batteryFailure ?? false);

    // Generator capacity reduction: rated at 62.5 kW per generator
    const generatorUnitKw = 62.5;
    const survivingGenerators = Math.max(0, b.activeGenerators - offlineGenerators);
    const projGenerationCapacityKw = survivingGenerators * generatorUnitKw;

    // Load shedding adjustments
    let projPowerDemandKw = b.powerDemandKw;
    if (tier3Shedding) {
      projPowerDemandKw = Math.round(b.powerDemandKw * 0.75 * 10) / 10; // Shed Tier 3 (25%)
    }

    const powerDeficitKw = Math.max(0, projPowerDemandKw - projGenerationCapacityKw);
    const isOverload = powerDeficitKw > 0;

    // Battery autonomy calculation
    const batteryKwh = batteryFailure ? 0 : 48 * (b.batterySocPercent / 100);
    const batteryAutonomyHours = powerDeficitKw > 0 && batteryKwh > 0
      ? Number((batteryKwh / powerDeficitKw).toFixed(1))
      : (powerDeficitKw > 0 ? 0 : 999);

    // Fuel burn rate changes (surviving generator runs at higher load factor)
    let projFuelBurnRate = b.fuelBurnRateLph;
    if (survivingGenerators > 0) {
      // Single generator running at higher load
      projFuelBurnRate = Math.min(38, b.fuelBurnRateLph * 1.15);
    } else {
      projFuelBurnRate = 0; // Total generator shutdown
    }

    const projDaysToDepletion = projFuelBurnRate > 0
      ? Number((b.currentFuelStockLiters / (projFuelBurnRate * 24)).toFixed(1))
      : (survivingGenerators === 0 ? 0 : b.fuelAutonomyDays);

    const projDaysToReserve = Math.max(0, projDaysToDepletion - 15);

    // Risk calculation: surviving capacity vs demand
    let projRiskScore = b.compositeRiskScore;
    if (survivingGenerators === 0) {
      projRiskScore = 100; // Catastrophic blackout
    } else if (isOverload) {
      projRiskScore = Math.min(95, Math.max(75, b.compositeRiskScore + 40));
    } else {
      projRiskScore = Math.min(85, Math.max(55, b.compositeRiskScore + 20));
    }

    // Discrete timeline projection offsets: [0, 1, 6, 24, 168, 720]
    const timelineSteps: SimulationTimelineStep[] = [
      this.createTimelineStep(0, 'T+0', b, projPowerDemandKw, projGenerationCapacityKw, b.batterySocPercent, b.currentFuelStockLiters, projFuelBurnRate, b.ambientTemperatureC, b.internalTemperatureC, projRiskScore, [
        `Generator trip event: ${offlineGenerators} generator(s) offline.`,
        isOverload ? `Active power deficit of ${powerDeficitKw.toFixed(1)} kW.` : 'Surviving generator operating within rated limit.',
      ]),
      this.createTimelineStep(1, 'T+1h', b, projPowerDemandKw, projGenerationCapacityKw, isOverload ? Math.max(0, b.batterySocPercent - (100 / Math.max(1, batteryAutonomyHours))) : b.batterySocPercent, b.currentFuelStockLiters - (projFuelBurnRate * 1), projFuelBurnRate, b.ambientTemperatureC, b.internalTemperatureC - 0.5, projRiskScore, [
        isOverload ? `Battery bank discharging to cover ${powerDeficitKw.toFixed(1)} kW deficit.` : 'Stable single-generator operation.',
      ]),
      this.createTimelineStep(6, 'T+6h', b, projPowerDemandKw, projGenerationCapacityKw, isOverload ? Math.max(0, b.batterySocPercent - (600 / Math.max(1, batteryAutonomyHours))) : b.batterySocPercent, b.currentFuelStockLiters - (projFuelBurnRate * 6), projFuelBurnRate, b.ambientTemperatureC, isOverload && batteryAutonomyHours <= 6 ? b.internalTemperatureC - 4.5 : b.internalTemperatureC - 1.0, Math.min(100, projRiskScore + (batteryAutonomyHours <= 6 && isOverload ? 15 : 0)), [
        batteryAutonomyHours <= 6 && isOverload ? 'BATTERY EXHAUSTED: Station entering blackout and thermal decay.' : 'Battery maintaining bridge load.',
      ]),
      this.createTimelineStep(24, 'T+24h', b, projPowerDemandKw, projGenerationCapacityKw, isOverload ? 0 : b.batterySocPercent, b.currentFuelStockLiters - (projFuelBurnRate * 24), projFuelBurnRate, b.ambientTemperatureC, isOverload && batteryAutonomyHours <= 24 ? -10 : b.internalTemperatureC - 2.0, Math.min(100, projRiskScore + (isOverload ? 20 : 5)), [
        isOverload ? 'Severe thermal drop: Indoor temperature dropped below 0°C.' : 'Surviving generator continuous 24h stress test.',
      ]),
      this.createTimelineStep(168, 'T+7d', b, projPowerDemandKw, projGenerationCapacityKw, isOverload ? 0 : b.batterySocPercent, Math.max(0, b.currentFuelStockLiters - (projFuelBurnRate * 168)), projFuelBurnRate, b.ambientTemperatureC, isOverload ? b.ambientTemperatureC + 5 : b.internalTemperatureC - 3.0, Math.min(100, projRiskScore + (isOverload ? 25 : 10)), [
        `7-day continuous run: Cumulative fuel burn ${Math.round(projFuelBurnRate * 168)} Liters.`,
      ]),
      this.createTimelineStep(720, 'T+30d', b, projPowerDemandKw, projGenerationCapacityKw, isOverload ? 0 : b.batterySocPercent, Math.max(0, b.currentFuelStockLiters - (projFuelBurnRate * 720)), projFuelBurnRate, b.ambientTemperatureC, isOverload ? b.ambientTemperatureC : b.internalTemperatureC - 3.0, Math.min(100, projRiskScore + (isOverload ? 30 : 15)), [
        '30-day extended autonomy evaluation completed.',
      ]),
    ];

    // Build signed deltas
    const deltas: SimulationDeltas = {
      powerDemandKw: this.buildDelta(b.powerDemandKw, projPowerDemandKw, 'kW'),
      generationCapacityKw: this.buildDelta(b.ratedGenerationCapacityKw, projGenerationCapacityKw, 'kW'),
      fuelBurnRateLph: this.buildDelta(b.fuelBurnRateLph, projFuelBurnRate, 'L/h'),
      fuelRemainingLiters: this.buildDelta(b.currentFuelStockLiters, b.currentFuelStockLiters - (projFuelBurnRate * 24), 'L'),
      daysToReserveThreshold: this.buildDelta(b.daysToReserveThreshold, projDaysToReserve, 'days'),
      daysToDepletion: this.buildDelta(b.fuelAutonomyDays, projDaysToDepletion, 'days'),
      compositeRiskScore: this.buildDelta(b.compositeRiskScore, projRiskScore, 'points'),
    };

    // Synthesize mitigation actions
    const mitigations: SimulationMitigation[] = [];
    if (isOverload && !tier3Shedding) {
      mitigations.push({
        action: 'Load shed Tier-3 scientific laboratories immediately',
        priority: 'CRITICAL',
        affectedAssetOrZone: 'Science Block / Labs',
        expectedBenefit: `Reduces electrical demand by ${(b.powerDemandKw * 0.25).toFixed(1)} kW, eliminating the ${powerDeficitKw.toFixed(1)} kW deficit.`,
        reasoning: 'Projected demand exceeds surviving single generator capacity of 62.5 kW.',
        assumptions: ['Science equipment can be powered down safely without cryogenic specimen damage.'],
      });
    }
    if (isOverload) {
      mitigations.push({
        action: 'Isolate non-essential heating circuits in unoccupied storage blocks',
        priority: 'HIGH',
        affectedAssetOrZone: 'Storage Block C',
        expectedBenefit: 'Saves an estimated 8.5 kW electrical load and conserves battery reserve.',
        reasoning: 'Extends battery autonomy bridge duration during emergency single-generator operation.',
        assumptions: ['Storage containers do not house freeze-sensitive medical supplies.'],
      });
    }
    mitigations.push({
      action: 'Dispatch emergency technician inspection team to tripped generator',
      priority: 'HIGH',
      affectedAssetOrZone: 'Generator #2',
      expectedBenefit: 'Attempts generator reset to restore N+1 station redundancy.',
      reasoning: 'Single-generator operation leaves the station with zero secondary power redundancy.',
      assumptions: ['Station technician has safe indoor access through heated connecting corridor.'],
    });

    return {
      summary: `Power Failure Simulation: ${offlineGenerators} generator(s) offline resulting in ${projGenerationCapacityKw} kW available capacity against ${projPowerDemandKw} kW load.`,
      impactScore: Math.round(projRiskScore),
      affectedSystems: ['Power Generation', 'HVAC / Thermal', 'Battery Storage'],
      recommendations: mitigations.map(m => m.action),
      deltas,
      timelineSteps,
      mitigations,
      assumptions: SIMULATION_PROTOTYPE_ASSUMPTIONS,
      executedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };
  }

  // ── 2. Weather Extreme Simulation Archetype ────────────────────

  private simulateWeatherExtreme(
    params: Record<string, unknown>,
    b: BaselineStationState,
    startTime: number
  ): SimulationResult {
    const stormTempC = Number(params.ambientTemperatureC ?? -45.0);
    const stormWindKmh = Number(params.windSpeedKmh ?? 120.0);
    const durationHours = Number(params.durationHours ?? 72);

    // Fourier Building Heat Loss Model:
    // Qdot = U * A * (Tin - Tout) * (1 + infiltrationFactor)
    const U = 0.25; // W/(m²·K)
    const A = 650;  // m²
    const infiltrationFactor = 0.15 * Math.sqrt(stormWindKmh / 40.0);
    const deltaT = b.internalTemperatureC - stormTempC;
    const heatLossRateKw = ((U * A * deltaT) * (1 + infiltrationFactor)) / 1000;

    // Fuel burn surge due to viscous drag and heating demand (+0.6% per degree below 0)
    const coldPenaltyMultiplier = 1.0 + (Math.abs(stormTempC) * 0.006);
    const projFuelBurnRate = Number((b.fuelBurnRateLph * coldPenaltyMultiplier * 1.25).toFixed(1));
    const projPowerDemandKw = Number((b.powerDemandKw + (heatLossRateKw * 0.4)).toFixed(1));

    const projDaysToDepletion = Number((b.currentFuelStockLiters / (projFuelBurnRate * 24)).toFixed(1));
    const projDaysToReserve = Math.max(0, projDaysToDepletion - 15);

    // Extreme weather risk spike
    const projRiskScore = Math.min(95, Math.max(60, b.compositeRiskScore + 35));

    const timelineSteps: SimulationTimelineStep[] = [
      this.createTimelineStep(0, 'T+0', b, projPowerDemandKw, b.ratedGenerationCapacityKw, b.batterySocPercent, b.currentFuelStockLiters, projFuelBurnRate, stormTempC, b.internalTemperatureC, projRiskScore, [
        `Katabatic blizzard onset: Ambient temperature ${stormTempC}°C, wind ${stormWindKmh} km/h.`,
        `Calculated building envelope heat loss rate: ${heatLossRateKw.toFixed(1)} kW.`,
      ]),
      this.createTimelineStep(1, 'T+1h', b, projPowerDemandKw, b.ratedGenerationCapacityKw, b.batterySocPercent, b.currentFuelStockLiters - projFuelBurnRate, projFuelBurnRate, stormTempC, b.internalTemperatureC - 0.2, projRiskScore, [
        'HVAC heating coils ramped up to maximum thermal output.',
      ]),
      this.createTimelineStep(6, 'T+6h', b, projPowerDemandKw, b.ratedGenerationCapacityKw, b.batterySocPercent, b.currentFuelStockLiters - (projFuelBurnRate * 6), projFuelBurnRate, stormTempC, b.internalTemperatureC - 0.8, projRiskScore, [
        `Fuel burn rate surged to ${projFuelBurnRate} L/h under sub-zero cold penalty.`,
      ]),
      this.createTimelineStep(24, 'T+24h', b, projPowerDemandKw, b.ratedGenerationCapacityKw, b.batterySocPercent, b.currentFuelStockLiters - (projFuelBurnRate * 24), projFuelBurnRate, stormTempC, b.internalTemperatureC - 1.5, Math.min(100, projRiskScore + 5), [
        '24h blizzard persistence: Trace heating active across all external plumbing lines.',
      ]),
      this.createTimelineStep(168, 'T+7d', b, b.powerDemandKw, b.ratedGenerationCapacityKw, b.batterySocPercent, Math.max(0, b.currentFuelStockLiters - (projFuelBurnRate * 24 * 3) - (b.fuelBurnRateLph * 24 * 4)), b.fuelBurnRateLph, b.ambientTemperatureC, b.internalTemperatureC, b.compositeRiskScore + 10, [
        `Storm abated after ${durationHours} hours. System normalizing to baseline conditions.`,
      ]),
      this.createTimelineStep(720, 'T+30d', b, b.powerDemandKw, b.ratedGenerationCapacityKw, b.batterySocPercent, Math.max(0, b.currentFuelStockLiters - (b.fuelBurnRateLph * 720)), b.fuelBurnRateLph, b.ambientTemperatureC, b.internalTemperatureC, b.compositeRiskScore, [
        'Post-storm reserve evaluation completed.',
      ]),
    ];

    const deltas: SimulationDeltas = {
      powerDemandKw: this.buildDelta(b.powerDemandKw, projPowerDemandKw, 'kW'),
      generationCapacityKw: this.buildDelta(b.ratedGenerationCapacityKw, b.ratedGenerationCapacityKw, 'kW'),
      fuelBurnRateLph: this.buildDelta(b.fuelBurnRateLph, projFuelBurnRate, 'L/h'),
      fuelRemainingLiters: this.buildDelta(b.currentFuelStockLiters, b.currentFuelStockLiters - (projFuelBurnRate * 24), 'L'),
      daysToReserveThreshold: this.buildDelta(b.daysToReserveThreshold, projDaysToReserve, 'days'),
      daysToDepletion: this.buildDelta(b.fuelAutonomyDays, projDaysToDepletion, 'days'),
      compositeRiskScore: this.buildDelta(b.compositeRiskScore, projRiskScore, 'points'),
    };

    const mitigations: SimulationMitigation[] = [
      {
        action: 'Seal external ventilation louvers and enable 100% internal air recirculation',
        priority: 'CRITICAL',
        affectedAssetOrZone: 'HVAC Air Handlers / Louvers',
        expectedBenefit: `Reduces envelope infiltration loss by ${(heatLossRateKw * 0.25).toFixed(1)} kW, conserving thermal mass.`,
        reasoning: 'Katabatic wind speeds exceed 100 km/h, causing severe convective thermal infiltration.',
        assumptions: ['CO2 levels remain within safe occupational threshold (<1000 ppm) for 24h duration.'],
      },
      {
        action: 'Pre-heat fuel line trace heating circuits to prevent paraffin wax crystallization',
        priority: 'HIGH',
        affectedAssetOrZone: 'External Fuel Lines / Day Tanks',
        expectedBenefit: 'Maintains diesel fuel fluid viscosity above pour point (-38°C).',
        reasoning: 'Ambient temperatures projected to plunge to -45°C.',
        assumptions: ['Electric trace heaters have independent backup circuit power.'],
      },
      {
        action: 'Issue Station Condition Red (Prohibit all outdoor travel beyond main building)',
        priority: 'CRITICAL',
        affectedAssetOrZone: 'Entire Station Campus',
        expectedBenefit: 'Guarantees human safety against zero-visibility blizzard exposure.',
        reasoning: 'Wind chill is below -65°C, causing frostbite risk within 2 minutes of exposure.',
        assumptions: ['All expedition personnel accounted for inside station living module.'],
      },
    ];

    return {
      summary: `Extreme Weather Simulation: Katabatic blizzard (${stormTempC}°C, ${stormWindKmh} km/h, ${durationHours}h) causes ${heatLossRateKw.toFixed(1)} kW thermal loss surge and +${Math.round((projFuelBurnRate - b.fuelBurnRateLph) / b.fuelBurnRateLph * 100)}% fuel burn increase.`,
      impactScore: Math.round(projRiskScore),
      affectedSystems: ['HVAC / Heating', 'Fuel Consumption', 'Personnel Safety', 'External Plumbing'],
      recommendations: mitigations.map(m => m.action),
      deltas,
      timelineSteps,
      mitigations,
      assumptions: SIMULATION_PROTOTYPE_ASSUMPTIONS,
      executedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };
  }

  // ── 3. Supply Shortage Simulation Archetype ────────────────────

  private simulateSupplyShortage(
    params: Record<string, unknown>,
    b: BaselineStationState,
    startTime: number
  ): SimulationResult {
    const delayDays = Number(params.deliveryDelayDays ?? 60);
    const rationingPercent = Number(params.rationingPercent ?? 15);

    // Rationing impact on fuel and resources
    const rationMultiplier = 1.0 - (rationingPercent / 100);
    const projFuelBurnRate = Number((b.fuelBurnRateLph * rationMultiplier).toFixed(1));
    const projDaysToDepletion = Number((b.currentFuelStockLiters / (projFuelBurnRate * 24)).toFixed(1));
    const projDaysToReserve = Math.max(0, projDaysToDepletion - 15);

    // Compare days to depletion against delayed resupply arrival
    const originalResupplyDays = 120; // Nominal Antarctic summer expedition window
    const newResupplyDays = originalResupplyDays + delayDays;
    const isDeficitAtArrival = projDaysToDepletion < newResupplyDays;

    let projRiskScore = b.compositeRiskScore;
    if (isDeficitAtArrival) {
      projRiskScore = Math.min(95, Math.max(75, b.compositeRiskScore + 40));
    } else {
      projRiskScore = Math.min(80, Math.max(50, b.compositeRiskScore + 20));
    }

    const timelineSteps: SimulationTimelineStep[] = [
      this.createTimelineStep(0, 'T+0', b, b.powerDemandKw * rationMultiplier, b.ratedGenerationCapacityKw, b.batterySocPercent, b.currentFuelStockLiters, projFuelBurnRate, b.ambientTemperatureC, b.internalTemperatureC, projRiskScore, [
        `Resupply delay announced: Supply vessel delayed by +${delayDays} days (New target: T+${newResupplyDays}d).`,
        `Institute ${rationingPercent}% operational resource rationing protocol.`,
      ]),
      this.createTimelineStep(1, 'T+1h', b, b.powerDemandKw * rationMultiplier, b.ratedGenerationCapacityKw, b.batterySocPercent, b.currentFuelStockLiters, projFuelBurnRate, b.ambientTemperatureC, b.internalTemperatureC, projRiskScore, [
        `Rationed electrical demand: ${(b.powerDemandKw * rationMultiplier).toFixed(1)} kW.`,
      ]),
      this.createTimelineStep(6, 'T+6h', b, b.powerDemandKw * rationMultiplier, b.ratedGenerationCapacityKw, b.batterySocPercent, b.currentFuelStockLiters - (projFuelBurnRate * 6), projFuelBurnRate, b.ambientTemperatureC, b.internalTemperatureC, projRiskScore, [
        'Non-critical laboratory equipment placed in standby mode.',
      ]),
      this.createTimelineStep(24, 'T+24h', b, b.powerDemandKw * rationMultiplier, b.ratedGenerationCapacityKw, b.batterySocPercent, b.currentFuelStockLiters - (projFuelBurnRate * 24), projFuelBurnRate, b.ambientTemperatureC, b.internalTemperatureC, projRiskScore, [
        `Daily fuel consumption restricted to ${Math.round(projFuelBurnRate * 24)} L/day.`,
      ]),
      this.createTimelineStep(168, 'T+7d', b, b.powerDemandKw * rationMultiplier, b.ratedGenerationCapacityKw, b.batterySocPercent, b.currentFuelStockLiters - (projFuelBurnRate * 168), projFuelBurnRate, b.ambientTemperatureC, b.internalTemperatureC, projRiskScore + 5, [
        `7-day rationing milestone: Conserved ${Math.round((b.fuelBurnRateLph - projFuelBurnRate) * 168)} Liters compared to unrationed baseline.`,
      ]),
      this.createTimelineStep(720, 'T+30d', b, b.powerDemandKw * rationMultiplier, b.ratedGenerationCapacityKw, b.batterySocPercent, Math.max(0, b.currentFuelStockLiters - (projFuelBurnRate * 720)), projFuelBurnRate, b.ambientTemperatureC, b.internalTemperatureC, Math.min(100, projRiskScore + 10), [
        isDeficitAtArrival
          ? `CRITICAL WARNING: Projected fuel depletion date (${projDaysToDepletion}d) occurs BEFORE delayed resupply arrival (${newResupplyDays}d).`
          : `Rationing maintains positive buffer: ${Math.round(projDaysToDepletion - newResupplyDays)} days reserve remaining at resupply date.`,
      ]),
    ];

    const deltas: SimulationDeltas = {
      powerDemandKw: this.buildDelta(b.powerDemandKw, b.powerDemandKw * rationMultiplier, 'kW'),
      generationCapacityKw: this.buildDelta(b.ratedGenerationCapacityKw, b.ratedGenerationCapacityKw, 'kW'),
      fuelBurnRateLph: this.buildDelta(b.fuelBurnRateLph, projFuelBurnRate, 'L/h'),
      fuelRemainingLiters: this.buildDelta(b.currentFuelStockLiters, b.currentFuelStockLiters - (projFuelBurnRate * 24), 'L'),
      daysToReserveThreshold: this.buildDelta(b.daysToReserveThreshold, projDaysToReserve, 'days'),
      daysToDepletion: this.buildDelta(b.fuelAutonomyDays, projDaysToDepletion, 'days'),
      compositeRiskScore: this.buildDelta(b.compositeRiskScore, projRiskScore, 'points'),
    };

    const mitigations: SimulationMitigation[] = [
      {
        action: `Enforce ${rationingPercent}% station electrical and heating rationing`,
        priority: 'HIGH',
        affectedAssetOrZone: 'Whole Station / All Living Quarters',
        expectedBenefit: `Extends station fuel autonomy from ${b.fuelAutonomyDays} days to ${projDaysToDepletion} days (+${Math.round(projDaysToDepletion - b.fuelAutonomyDays)} days).`,
        reasoning: `Supply vessel delayed by +${delayDays} days, threatening mid-winter reserve breach.`,
        assumptions: ['Indoor temperature target can be lowered from 21°C to 18°C without health hazard.'],
      },
      {
        action: 'Re-commission reverse-osmosis wastewater recycling system to 80% recovery',
        priority: 'MEDIUM',
        affectedAssetOrZone: 'Water Treatment Plant',
        expectedBenefit: 'Conserves 1,200 Liters of fresh water per week, extending water reserves.',
        reasoning: 'Water supply resupply delayed in tandem with fuel tanker arrival.',
        assumptions: ['Water filter membranes have valid operational life remaining.'],
      },
    ];

    return {
      summary: `Supply Shortage Simulation: Resupply delayed +${delayDays} days. ${rationingPercent}% rationing extends fuel autonomy to ${projDaysToDepletion} days (vs ${newResupplyDays}d target arrival).`,
      impactScore: Math.round(projRiskScore),
      affectedSystems: ['Logistics', 'Fuel Reserves', 'Water Supplies', 'Scientific Operations'],
      recommendations: mitigations.map(m => m.action),
      deltas,
      timelineSteps,
      mitigations,
      assumptions: SIMULATION_PROTOTYPE_ASSUMPTIONS,
      executedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };
  }

  // ── 4. Equipment Failure Simulation Archetype ──────────────────

  private simulateEquipmentFailure(
    params: Record<string, unknown>,
    b: BaselineStationState,
    startTime: number
  ): SimulationResult {
    const category = String(params.failedAssetCategory ?? 'HVAC');
    const assetName = String(params.failedAssetName ?? `${category} Unit A`);

    let projRiskScore = b.compositeRiskScore;
    let projPowerDemandKw = b.powerDemandKw;
    let projInternalTempC = b.internalTemperatureC;

    if (category === 'HVAC') {
      projRiskScore = Math.min(90, b.compositeRiskScore + 35);
      projPowerDemandKw -= 15.0; // Damaged unit draws no power
      projInternalTempC -= 4.0;  // Thermal drop in zone
    } else if (category === 'WATER_TREATMENT') {
      projRiskScore = Math.min(85, b.compositeRiskScore + 25);
    } else {
      projRiskScore = Math.min(80, b.compositeRiskScore + 20);
    }

    const timelineSteps: SimulationTimelineStep[] = [
      this.createTimelineStep(0, 'T+0', b, projPowerDemandKw, b.ratedGenerationCapacityKw, b.batterySocPercent, b.currentFuelStockLiters, b.fuelBurnRateLph, b.ambientTemperatureC, projInternalTempC, projRiskScore, [
        `Equipment Failure: ${assetName} (${category}) tripped offline.`,
      ]),
      this.createTimelineStep(1, 'T+1h', b, projPowerDemandKw, b.ratedGenerationCapacityKw, b.batterySocPercent, b.currentFuelStockLiters - b.fuelBurnRateLph, b.fuelBurnRateLph, b.ambientTemperatureC, projInternalTempC - 0.5, projRiskScore, [
        'Automated alarm raised across station control room.',
      ]),
      this.createTimelineStep(6, 'T+6h', b, projPowerDemandKw, b.ratedGenerationCapacityKw, b.batterySocPercent, b.currentFuelStockLiters - (b.fuelBurnRateLph * 6), b.fuelBurnRateLph, b.ambientTemperatureC, projInternalTempC - 1.5, projRiskScore, [
        'Technician triage in progress.',
      ]),
      this.createTimelineStep(24, 'T+24h', b, projPowerDemandKw, b.ratedGenerationCapacityKw, b.batterySocPercent, b.currentFuelStockLiters - (b.fuelBurnRateLph * 24), b.fuelBurnRateLph, b.ambientTemperatureC, projInternalTempC - 2.5, projRiskScore + 5, [
        '24h unmitigated failure duration.',
      ]),
      this.createTimelineStep(168, 'T+7d', b, projPowerDemandKw, b.ratedGenerationCapacityKw, b.batterySocPercent, Math.max(0, b.currentFuelStockLiters - (b.fuelBurnRateLph * 168)), b.fuelBurnRateLph, b.ambientTemperatureC, projInternalTempC - 4.0, Math.min(100, projRiskScore + 10), [
        'Spare parts requisition and cold-temperature repair window required.',
      ]),
      this.createTimelineStep(720, 'T+30d', b, projPowerDemandKw, b.ratedGenerationCapacityKw, b.batterySocPercent, Math.max(0, b.currentFuelStockLiters - (b.fuelBurnRateLph * 720)), b.fuelBurnRateLph, b.ambientTemperatureC, projInternalTempC - 4.0, Math.min(100, projRiskScore + 10), [
        'Extended out-of-service projection completed.',
      ]),
    ];

    const deltas: SimulationDeltas = {
      powerDemandKw: this.buildDelta(b.powerDemandKw, projPowerDemandKw, 'kW'),
      generationCapacityKw: this.buildDelta(b.ratedGenerationCapacityKw, b.ratedGenerationCapacityKw, 'kW'),
      fuelBurnRateLph: this.buildDelta(b.fuelBurnRateLph, b.fuelBurnRateLph, 'L/h'),
      fuelRemainingLiters: this.buildDelta(b.currentFuelStockLiters, b.currentFuelStockLiters - (b.fuelBurnRateLph * 24), 'L'),
      daysToReserveThreshold: this.buildDelta(b.daysToReserveThreshold, b.daysToReserveThreshold, 'days'),
      daysToDepletion: this.buildDelta(b.fuelAutonomyDays, b.fuelAutonomyDays, 'days'),
      compositeRiskScore: this.buildDelta(b.compositeRiskScore, projRiskScore, 'points'),
    };

    const mitigations: SimulationMitigation[] = [
      {
        action: `Engage auxiliary backup ${category} redundancy`,
        priority: 'HIGH',
        affectedAssetOrZone: assetName,
        expectedBenefit: 'Restores primary zone functionality within 4 hours.',
        reasoning: `Primary ${assetName} has experienced catastrophic failure.`,
        assumptions: ['Secondary backup unit is configured for immediate manual start.'],
      },
    ];

    return {
      summary: `Equipment Failure Simulation: ${assetName} (${category}) failure evaluated. Composite risk elevated to ${Math.round(projRiskScore)}.`,
      impactScore: Math.round(projRiskScore),
      affectedSystems: [category, 'Operational Redundancy'],
      recommendations: mitigations.map(m => m.action),
      deltas,
      timelineSteps,
      mitigations,
      assumptions: SIMULATION_PROTOTYPE_ASSUMPTIONS,
      executedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };
  }

  // ── 5. Custom Simulation Archetype ─────────────────────────────

  private simulateCustom(
    params: Record<string, unknown>,
    b: BaselineStationState,
    startTime: number
  ): SimulationResult {
    // Custom allows arbitrary loadKw and temp overrides
    const loadKw = Number(params.loadKw ?? b.powerDemandKw);
    const ambientTempC = Number(params.ambientTempC ?? b.ambientTemperatureC);

    const deltaLoad = loadKw - b.powerDemandKw;
    const projRiskScore = Math.min(100, Math.max(0, b.compositeRiskScore + (deltaLoad > 0 ? 15 : -5)));

    const deltas: SimulationDeltas = {
      powerDemandKw: this.buildDelta(b.powerDemandKw, loadKw, 'kW'),
      generationCapacityKw: this.buildDelta(b.ratedGenerationCapacityKw, b.ratedGenerationCapacityKw, 'kW'),
      fuelBurnRateLph: this.buildDelta(b.fuelBurnRateLph, b.fuelBurnRateLph, 'L/h'),
      fuelRemainingLiters: this.buildDelta(b.currentFuelStockLiters, b.currentFuelStockLiters - (b.fuelBurnRateLph * 24), 'L'),
      daysToReserveThreshold: this.buildDelta(b.daysToReserveThreshold, b.daysToReserveThreshold, 'days'),
      daysToDepletion: this.buildDelta(b.fuelAutonomyDays, b.fuelAutonomyDays, 'days'),
      compositeRiskScore: this.buildDelta(b.compositeRiskScore, projRiskScore, 'points'),
    };

    const timelineSteps: SimulationTimelineStep[] = [
      this.createTimelineStep(0, 'T+0', b, loadKw, b.ratedGenerationCapacityKw, b.batterySocPercent, b.currentFuelStockLiters, b.fuelBurnRateLph, ambientTempC, b.internalTemperatureC, projRiskScore, ['Custom scenario initiated.']),
      this.createTimelineStep(1, 'T+1h', b, loadKw, b.ratedGenerationCapacityKw, b.batterySocPercent, b.currentFuelStockLiters - b.fuelBurnRateLph, b.fuelBurnRateLph, ambientTempC, b.internalTemperatureC, projRiskScore, ['Stable operation.']),
      this.createTimelineStep(6, 'T+6h', b, loadKw, b.ratedGenerationCapacityKw, b.batterySocPercent, b.currentFuelStockLiters - (b.fuelBurnRateLph * 6), b.fuelBurnRateLph, ambientTempC, b.internalTemperatureC, projRiskScore, ['6h progression.']),
      this.createTimelineStep(24, 'T+24h', b, loadKw, b.ratedGenerationCapacityKw, b.batterySocPercent, b.currentFuelStockLiters - (b.fuelBurnRateLph * 24), b.fuelBurnRateLph, ambientTempC, b.internalTemperatureC, projRiskScore, ['24h progression.']),
      this.createTimelineStep(168, 'T+7d', b, loadKw, b.ratedGenerationCapacityKw, b.batterySocPercent, Math.max(0, b.currentFuelStockLiters - (b.fuelBurnRateLph * 168)), b.fuelBurnRateLph, ambientTempC, b.internalTemperatureC, projRiskScore, ['7d progression.']),
      this.createTimelineStep(720, 'T+30d', b, loadKw, b.ratedGenerationCapacityKw, b.batterySocPercent, Math.max(0, b.currentFuelStockLiters - (b.fuelBurnRateLph * 720)), b.fuelBurnRateLph, ambientTempC, b.internalTemperatureC, projRiskScore, ['30d progression.']),
    ];

    return {
      summary: `Custom Scenario Evaluation: Load ${loadKw} kW at ${ambientTempC}°C.`,
      impactScore: Math.round(projRiskScore),
      affectedSystems: ['Custom Parameters'],
      recommendations: ['Monitor power stability under adjusted load profile.'],
      deltas,
      timelineSteps,
      mitigations: [],
      assumptions: SIMULATION_PROTOTYPE_ASSUMPTIONS,
      executedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };
  }

  // ── Helper Math & Builders ─────────────────────────────────────

  private buildDelta(baseline: number, projected: number, unit: string): SignedDelta {
    const b = Number(baseline.toFixed(1));
    const p = Number(projected.toFixed(1));
    const delta = Number((p - b).toFixed(1));
    return { baseline: b, projected: p, delta, unit };
  }

  private mapScoreToRiskLevel(score: number): RiskLevel {
    if (score >= 80) return RiskLevel.CRITICAL;
    if (score >= 60) return RiskLevel.HIGH;
    if (score >= 35) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  private createTimelineStep(
    offsetHours: number,
    horizonLabel: 'T+0' | 'T+1h' | 'T+6h' | 'T+24h' | 'T+7d' | 'T+30d',
    _b: BaselineStationState,
    powerDemandKw: number,
    availableGenerationKw: number,
    batterySocPercent: number,
    fuelRemainingLiters: number,
    fuelBurnRateLph: number,
    ambientTemperatureC: number,
    internalTemperatureC: number,
    compositeRiskScore: number,
    triggeredWarnings: string[]
  ): SimulationTimelineStep {
    const timestamp = new Date(Date.now() + offsetHours * 3600 * 1000).toISOString();
    return {
      offsetHours,
      horizonLabel,
      timestamp,
      powerDemandKw: Number(powerDemandKw.toFixed(1)),
      availableGenerationKw: Number(availableGenerationKw.toFixed(1)),
      batterySocPercent: Math.max(0, Math.min(100, Number(batterySocPercent.toFixed(1)))),
      fuelRemainingLiters: Math.max(0, Number(fuelRemainingLiters.toFixed(1))),
      fuelBurnRateLph: Number(fuelBurnRateLph.toFixed(1)),
      ambientTemperatureC: Number(ambientTemperatureC.toFixed(1)),
      internalTemperatureC: Number(internalTemperatureC.toFixed(1)),
      compositeRiskScore: Math.min(100, Math.max(0, Math.round(compositeRiskScore))),
      riskLevel: this.mapScoreToRiskLevel(compositeRiskScore),
      triggeredWarnings,
      mitigationOpportunities: [],
    };
  }
}

export const simulationEngine = new SimulationEngine();
