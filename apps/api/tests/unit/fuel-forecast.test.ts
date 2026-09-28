// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Fuel Depletion Forecasting Unit Tests
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fuelForecastingService } from '../../src/modules/predictions/fuel.service.js';
import { inventoryRepository } from '../../src/modules/inventory/inventory.repository.js';
import { weatherService } from '../../src/modules/weather/weather.service.js';
import { energyService } from '../../src/modules/energy/energy.service.js';
import { predictionsRepository } from '../../src/modules/predictions/predictions.repository.js';

describe('Fuel Depletion & Resource Forecasting', () => {
  const mockStationId = 'station-maitri-uuid';

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(inventoryRepository, 'findAll').mockResolvedValue({
      data: [
        {
          id: 'fuel-item-01',
          stationId: mockStationId,
          name: 'Arctic Winter Grade Diesel Fuel',
          code: 'MAI-FUEL-BLK-01',
          category: 'FUEL',
          currentStock: 45000,
          minimumThreshold: 10000,
          unit: 'L',
          resupplyDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000), // 150 days out
        } as any,
      ],
      total: 1,
    });

    vi.spyOn(energyService, 'getStationEnergySummary').mockResolvedValue({
      stationId: mockStationId,
      totalGenerationKw: 120, // Baseline load
      loadFactorPercent: 65,
      fuelReservesPercent: 75,
      fuelEstimatedHoursRemaining: 1500,
      activeGenerators: 2,
      totalGenerators: 3,
      status: 'NORMAL',
      timestamp: new Date().toISOString(),
    });

    vi.spyOn(weatherService, 'getCurrentWeather').mockResolvedValue({
      id: 'weather-01',
      stationId: mockStationId,
      temperature: -20, // Sub-zero ambient
      windSpeed: 30,
      windGust: 45,
      windDirection: 'S',
      windChill: -32,
      pressure: 985,
      humidity: 50,
      visibilityMeters: 8000,
      condition: 'OVERCAST',
      provenance: 'SIMULATED',
      recordedAt: new Date(),
      createdAt: new Date(),
    });

    vi.spyOn(predictionsRepository, 'create').mockResolvedValue({} as any);
  });

  it('should compute physical daily burn rate with load and thermal adjustments', async () => {
    const forecast = await fuelForecastingService.forecastFuelDepletion(mockStationId);

    // Baseline: 28 L/h * loadFactor(1.0) * tempFactor(1 + 20*0.006 = 1.12) = 31.36 L/h -> 752.6 L/day
    expect(forecast.dailyBurnRateLiters).toBeCloseTo(752.6, 0);
    expect(forecast.currentStockLiters).toBe(45000);
    expect(forecast.estimatedDaysRemaining).toBeCloseTo(45000 / 752.6, 0);
    expect(forecast.daysToMinimumThreshold).toBeCloseTo((45000 - 10000) / 752.6, 0);
    expect(forecast.influencingFactors.thermalPenaltyPercent).toBe(12);
  });

  it('should scale burn rate higher under elevated electrical load and severe sub-zero cold', async () => {
    // Override with high electrical load (160 kW) and extreme polar cold (-40°C)
    const forecast = await fuelForecastingService.forecastFuelDepletion(mockStationId, {
      loadKw: 160,
      ambientTempC: -40,
    });

    // Load delta: (160-120)*0.008 = +0.32 -> factor 1.32
    // Thermal penalty: 40 * 0.6% = +24% -> factor 1.24
    // Combined hourly: 28 * 1.32 * 1.24 = ~45.83 L/h -> ~1100 L/day
    expect(forecast.dailyBurnRateLiters).toBeGreaterThan(1000);
    expect(forecast.estimatedDaysRemaining).toBeLessThan(50);
    expect(forecast.influencingFactors.thermalPenaltyPercent).toBe(24);
    expect(forecast.influencingFactors.loadBurnFactor).toBe(1.32);
  });

  it('should correctly flag resupply feasibility when depletion date precedes scheduled resupply', async () => {
    // Set stock very low so station runs dry in 20 days (well before 150-day resupply)
    vi.spyOn(inventoryRepository, 'findAll').mockResolvedValueOnce({
      data: [
        {
          id: 'fuel-item-01',
          stationId: mockStationId,
          name: 'Arctic Winter Grade Diesel Fuel',
          code: 'MAI-FUEL-BLK-01',
          category: 'FUEL',
          currentStock: 5000,
          minimumThreshold: 10000,
          unit: 'L',
          resupplyDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000),
        } as any,
      ],
      total: 1,
    });

    const forecast = await fuelForecastingService.forecastFuelDepletion(mockStationId);

    expect(forecast.resupplyFeasible).toBe(false);
    expect(forecast.estimatedDaysRemaining).toBeLessThan(10);
  });

  it('should expose explainability metadata, assumptions, and calculation basis', async () => {
    const forecast = await fuelForecastingService.forecastFuelDepletion(mockStationId);

    expect(forecast.calculationBasis).toContain('Burn model');
    expect(forecast.assumptions.length).toBeGreaterThanOrEqual(3);
    expect(forecast.confidenceScore).toBe(0.88);
  });
});
