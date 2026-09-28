// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Weather Intelligence Unit Tests
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PolarWeatherProvider } from '../../src/modules/weather/weather.provider.js';
import { WeatherService } from '../../src/modules/weather/weather.service.js';
import { DataProvenance, EventType } from '@repo/shared';

describe('Weather Intelligence & Polar Physics', () => {
  let provider: PolarWeatherProvider;

  beforeEach(() => {
    provider = new PolarWeatherProvider();
  });

  describe('JAG/TI Wind-Chill Formula', () => {
    it('should compute wind chill according to standardized JAG/TI meteorological formula', () => {
      // Benchmark 1: T = -20°C, V = 40 km/h -> formula yields -34.1°C
      const chill1 = provider.calculateWindChill(-20, 40);
      expect(chill1).toBe(-34.1);

      // Benchmark 2: T = -30°C, V = 50 km/h -> formula yields -49.0°C
      const chill2 = provider.calculateWindChill(-30, 50);
      expect(chill2).toBe(-49.0);

      // Benchmark 3: T = -10°C, V = 20 km/h -> formula yields -17.9°C
      const chill3 = provider.calculateWindChill(-10, 20);
      expect(chill3).toBe(-17.9);
    });

    it('should return ambient temperature when wind speed is below 4.8 km/h', () => {
      const chill = provider.calculateWindChill(-25.0, 3.0);
      expect(chill).toBe(-25.0);
    });

    it('should return ambient temperature when temperature exceeds 10°C', () => {
      const chill = provider.calculateWindChill(15.0, 45.0);
      expect(chill).toBe(15.0);
    });
  });

  describe('Deterministic Storm-Severity Scoring', () => {
    it('should compute LOW storm severity for calm weather conditions', () => {
      const result = provider.calculateStormSeverity({
        windSpeed: 15,
        windGust: 20,
        windChill: -15,
        pressure: 995,
        visibilityMeters: 10000,
      });

      expect(result.level).toBe('LOW');
      expect(result.score).toBeLessThan(25);
    });

    it('should compute EXTREME storm severity for severe Katabatic blizzard conditions', () => {
      const result = provider.calculateStormSeverity({
        windSpeed: 105,
        windGust: 150,
        windChill: -52,
        pressure: 955,
        visibilityMeters: 250,
      });

      expect(result.level).toBe('EXTREME');
      expect(result.score).toBeGreaterThanOrEqual(75);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Station Climate Calibration', () => {
    it('should calibrate Maitri with interior Katabatic characteristics', () => {
      const obs = provider.generateCurrentWeather('station-maitri-id', 'Maitri Research Station');
      expect(obs.windDirection).toBe('SSE');
      expect(obs.temperature).toBe(-28.0);
      expect(obs.provenance).toBe(DataProvenance.SIMULATED);
      expect(obs.windChill).toBeLessThan(obs.temperature);
    });

    it('should calibrate Bharati with coastal maritime characteristics', () => {
      const obs = provider.generateCurrentWeather('station-bharati-id', 'Bharati Research Station');
      expect(obs.windDirection).toBe('ENE');
      expect(obs.temperature).toBe(-18.5);
      expect(obs.humidity).toBe(78);
      expect(obs.provenance).toBe(DataProvenance.SIMULATED);
    });
  });

  describe('Forecast Generation & Explainability', () => {
    it('should produce 7-day forecast with decaying confidence and prototype assumptions', () => {
      const forecasts = provider.generateForecast('station-maitri-id', 7, 'Maitri');

      expect(forecasts).toHaveLength(7);
      expect(forecasts[0]!.confidenceScore).toBeGreaterThan(forecasts[6]!.confidenceScore);

      // Verify all forecasts expose assumptions and provenance
      for (const fc of forecasts) {
        expect(fc.provenance).toBe(DataProvenance.SIMULATED);
        expect(fc.assumptions.length).toBeGreaterThan(0);
        expect(fc.stormSeverityScore).toBeGreaterThanOrEqual(0);
        expect(fc.stormSeverityScore).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('WeatherService Integration', () => {
    it('should record an observation, calculate wind chill, and publish domain event', async () => {
      const mockRepo = {
        create: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'obs-1', ...data })),
        findLatestByStation: vi.fn().mockResolvedValue(null),
        findByStationAndRange: vi.fn().mockResolvedValue([]),
        findAll: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      };

      const { stationsRepository } = await import('../../src/modules/stations/stations.repository.js');
      vi.spyOn(stationsRepository, 'findById').mockResolvedValue({ id: 'st-1', name: 'Maitri' } as any);

      const service = new WeatherService(mockRepo as any, provider);

      const result = await service.recordObservation({
        stationId: 'st-1',
        temperature: -22.0,
        windSpeed: 45.0,
        windGust: 62.0,
        windDirection: 'S',
        pressure: 980.0,
        humidity: 60,
        visibilityMeters: 5000,
        condition: 'OVERCAST',
        provenance: 'SENSOR',
      });

      expect(mockRepo.create).toHaveBeenCalledOnce();
      expect(result.windChill).toBeLessThan(-22.0);
      expect(result.provenance).toBe('SENSOR');
    });
  });
});
