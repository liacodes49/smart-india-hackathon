// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Station Risk Scoring Unit Tests
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { riskService } from '../../src/modules/risk/risk.service.js';
import { stationsRepository } from '../../src/modules/stations/stations.repository.js';
import { assetsRepository } from '../../src/modules/assets/assets.repository.js';
import { inventoryRepository } from '../../src/modules/inventory/inventory.repository.js';
import { weatherService } from '../../src/modules/weather/weather.service.js';
import { energyService } from '../../src/modules/energy/energy.service.js';
import { fuelForecastingService } from '../../src/modules/predictions/fuel.service.js';
import { equipmentHealthService } from '../../src/modules/predictions/equipment-health.service.js';
import { RiskLevel, AssetCategory } from '@repo/shared';

describe('Station Health & Composite Risk Engine', () => {
  const mockStationId = 'station-maitri-uuid';

  beforeEach(() => {
    vi.restoreAllMocks();
    riskService.clearCache();

    vi.spyOn(stationsRepository, 'findById').mockResolvedValue({
      id: mockStationId,
      name: 'Maitri Research Station',
    } as any);

    // Default nominal operational conditions
    vi.spyOn(fuelForecastingService, 'forecastFuelDepletion').mockResolvedValue({
      stationId: mockStationId,
      currentStockLiters: 45000,
      dailyBurnRateLiters: 750,
      estimatedDaysRemaining: 60, // 60 days remaining (mid-range energy risk)
      estimatedDepletionDate: new Date().toISOString(),
      daysToMinimumThreshold: 45,
      thresholdBreachDate: new Date().toISOString(),
      resupplyFeasible: true,
      confidenceScore: 0.88,
      calculationBasis: 'Test burn model',
      influencingFactors: {
        electricalLoadKw: 120,
        ambientTempC: -20,
        thermalPenaltyPercent: 12,
        loadBurnFactor: 1,
      },
      assumptions: [],
      forecastedAt: new Date().toISOString(),
    });

    vi.spyOn(energyService, 'getStationEnergySummary').mockResolvedValue({
      stationId: mockStationId,
      totalGenerationKw: 120,
      loadFactorPercent: 65,
      fuelReservesPercent: 75,
      fuelEstimatedHoursRemaining: 1440,
      activeGenerators: 2,
      totalGenerators: 3,
      status: 'NORMAL',
      timestamp: new Date().toISOString(),
    });

    vi.spyOn(assetsRepository, 'findAll').mockResolvedValue({
      data: [
        {
          id: 'gen-01',
          name: 'Primary DG 1',
          category: AssetCategory.GENERATOR,
        } as any,
      ],
      total: 1,
    });

    vi.spyOn(equipmentHealthService, 'evaluateAssetHealth').mockResolvedValue({
      assetId: 'gen-01',
      assetName: 'Primary DG 1',
      stationId: mockStationId,
      category: AssetCategory.GENERATOR,
      healthScore: 85,
      anomalyScore: 10,
      failureRiskEstimate: RiskLevel.LOW,
      estimatedRul: {
        estimateHours: 2500,
        minHours: 2000,
        maxHours: 3000,
        confidence: 0.85,
        degradationTrend: 'STABLE',
      },
      status: 'NORMAL' as any,
      topContributingSignals: [],
      operatingStressFactors: [],
      assumptions: [],
      lastEvaluatedAt: new Date().toISOString(),
    });

    vi.spyOn(weatherService, 'getCurrentWeather').mockResolvedValue({
      id: 'weather-01',
      stationId: mockStationId,
      temperature: -25,
      windSpeed: 35,
      windGust: 45,
      windDirection: 'SSE',
      windChill: -38,
      pressure: 980,
      humidity: 50,
      visibilityMeters: 7000,
      condition: 'OVERCAST',
      provenance: 'SIMULATED',
      recordedAt: new Date(),
      createdAt: new Date(),
    });

    vi.spyOn(weatherService, 'getForecast').mockResolvedValue({
      stationId: mockStationId,
      forecasts: [
        {
          stationId: mockStationId,
          forecastDate: new Date().toISOString(),
          horizon: '24h' as any,
          expectedCondition: 'OVERCAST' as any,
          tempMin: -28,
          tempMax: -20,
          windSpeedAvg: 35,
          windGustMax: 45,
          windChillMin: -38,
          pressureTrend: 'STABLE',
          blizzardRiskPercent: 20,
          stormSeverityScore: 30, // Weather risk score: 30
          provenance: 'SIMULATED' as any,
          confidenceScore: 0.85,
          assumptions: [],
        },
      ],
      assumptions: [],
    });

    vi.spyOn(inventoryRepository, 'findAll').mockResolvedValue({
      data: [
        {
          id: 'item-water',
          name: 'Priyadarshini Lake Water Reserve',
          currentStock: 15000,
          minimumThreshold: 5000, // Stock healthy
        } as any,
      ],
      total: 1,
    });
  });

  it('should normalize all 4 pillars to 0–100 scale and compute weighted composite', async () => {
    const assessment = await riskService.assessStationRisk(mockStationId);

    // Energy: 60 days autonomy -> (180 - 60) / (180 - 15) * 100 = 120 / 165 * 100 ~ 73
    expect(assessment.pillars.energyRisk.score).toBeCloseTo(73, 0);
    expect(assessment.pillars.energyRisk.weight).toBe(0.35);

    // Equipment: single asset with health 85 -> risk = 100 - 85 = 15
    expect(assessment.pillars.equipmentRisk.score).toBe(15);
    expect(assessment.pillars.equipmentRisk.weight).toBe(0.25);

    // Weather: stormSeverityScore 30
    expect(assessment.pillars.weatherRisk.score).toBe(30);
    expect(assessment.pillars.weatherRisk.weight).toBe(0.25);

    // Supply: 0 items low stock -> supply score 0
    expect(assessment.pillars.supplyRisk.score).toBe(0);
    expect(assessment.pillars.supplyRisk.weight).toBe(0.15);

    // Weighted composite:
    // 73 * 0.35 + 15 * 0.25 + 30 * 0.25 + 0 * 0.15 = 25.55 + 3.75 + 7.5 + 0 = 36.8 -> ~37
    expect(assessment.compositeScore).toBeCloseTo(37, 1);
    expect(assessment.riskLevel).toBe(RiskLevel.MEDIUM);
    expect(assessment.isEmergencyOverride).toBe(false);
  });

  it('should support configurable pillar weights override', async () => {
    // Custom weights: Energy 50%, Weather 50%, Equipment 0%, Supply 0%
    const assessment = await riskService.assessStationRisk(mockStationId, {
      energyWeight: 0.5,
      equipmentWeight: 0.0,
      weatherWeight: 0.5,
      supplyWeight: 0.0,
    });

    expect(assessment.pillars.energyRisk.weight).toBe(0.5);
    expect(assessment.pillars.weatherRisk.weight).toBe(0.5);

    // Expected composite: 73 * 0.5 + 30 * 0.5 = 36.5 + 15 = 51.5 -> ~52
    expect(assessment.compositeScore).toBeCloseTo(52, 1);
  });

  describe('Catastrophic Emergency Overrides', () => {
    it('should trigger emergency override when station suffers total blackout (0 active generators)', async () => {
      vi.spyOn(energyService, 'getStationEnergySummary').mockResolvedValueOnce({
        stationId: mockStationId,
        totalGenerationKw: 0,
        loadFactorPercent: 0,
        fuelReservesPercent: 75,
        fuelEstimatedHoursRemaining: 0,
        activeGenerators: 0, // TOTAL BLACKOUT
        totalGenerators: 3,
        status: 'CRITICAL',
        timestamp: new Date().toISOString(),
      });

      const assessment = await riskService.assessStationRisk(mockStationId);

      expect(assessment.isEmergencyOverride).toBe(true);
      expect(assessment.compositeScore).toBe(100);
      expect(assessment.riskLevel).toBe(RiskLevel.CRITICAL);
      expect(assessment.overrideReason).toContain('Total station blackout');
    });

    it('should trigger emergency override when main fuel reserves are completely dry (0 Liters)', async () => {
      vi.spyOn(fuelForecastingService, 'forecastFuelDepletion').mockResolvedValueOnce({
        stationId: mockStationId,
        currentStockLiters: 0, // DRY TANK
        dailyBurnRateLiters: 750,
        estimatedDaysRemaining: 0,
        estimatedDepletionDate: new Date().toISOString(),
        daysToMinimumThreshold: 0,
        thresholdBreachDate: new Date().toISOString(),
        resupplyFeasible: false,
        confidenceScore: 0.95,
        calculationBasis: 'Dry tank model',
        influencingFactors: {
          electricalLoadKw: 0,
          ambientTempC: -25,
          thermalPenaltyPercent: 15,
          loadBurnFactor: 0.4,
        },
        assumptions: [],
        forecastedAt: new Date().toISOString(),
      });

      const assessment = await riskService.assessStationRisk(mockStationId);

      expect(assessment.isEmergencyOverride).toBe(true);
      expect(assessment.compositeScore).toBe(100);
      expect(assessment.riskLevel).toBe(RiskLevel.CRITICAL);
      expect(assessment.overrideReason).toContain('reserves depleted to 0 Liters');
    });

    it('should NOT trigger emergency override for non-catastrophic low fuel conditions', async () => {
      // 10 days remaining: high energy risk, but NOT a catastrophic emergency override
      vi.spyOn(fuelForecastingService, 'forecastFuelDepletion').mockResolvedValueOnce({
        stationId: mockStationId,
        currentStockLiters: 6000,
        dailyBurnRateLiters: 600,
        estimatedDaysRemaining: 10,
        estimatedDepletionDate: new Date().toISOString(),
        daysToMinimumThreshold: 0,
        thresholdBreachDate: new Date().toISOString(),
        resupplyFeasible: false,
        confidenceScore: 0.9,
        calculationBasis: 'Low fuel model',
        influencingFactors: {
          electricalLoadKw: 120,
          ambientTempC: -20,
          thermalPenaltyPercent: 12,
          loadBurnFactor: 1,
        },
        assumptions: [],
        forecastedAt: new Date().toISOString(),
      });

      const assessment = await riskService.assessStationRisk(mockStationId);

      // Guardrail 7: Does NOT overwrite entire weighted calculation
      expect(assessment.isEmergencyOverride).toBe(false);
      expect(assessment.pillars.energyRisk.score).toBe(100); // Energy pillar reflects maximum risk
      expect(assessment.compositeScore).toBeLessThan(100); // Weighted formula is preserved
    });
  });

  describe('Explainability & Driver Ranking', () => {
    it('should rank top risk drivers and generate actionable operational recommendations', async () => {
      const assessment = await riskService.assessStationRisk(mockStationId);

      expect(assessment.topDrivers).toHaveLength(4);
      // Top driver should be Energy (score ~73)
      expect(assessment.topDrivers[0]!.pillar).toBe('ENERGY');
      expect(assessment.topDrivers[0]!.score).toBeGreaterThan(assessment.topDrivers[1]!.score);

      // Recommendations should address top driver
      expect(assessment.recommendedActions.length).toBeGreaterThan(0);
      expect(
        assessment.recommendedActions.some((a) => a.toLowerCase().includes('load shedding') || a.toLowerCase().includes('fuel'))
      ).toBe(true);

      // Prototype assumptions are exposed
      expect(assessment.assumptions.length).toBeGreaterThanOrEqual(4);
    });
  });
});
