// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Weather Provider & Polar Physics Engine
// ═══════════════════════════════════════════════════════════════
// Decoupled provider interface for meteorological data.
// In this prototype, PolarWeatherProvider simulates deterministic
// Antarctic meteorology for Maitri (Schirmacher Oasis) and Bharati
// (Larsemann Hills) using empirical physics formulas (JAG/TI wind chill).
// A real external weather service (e.g. ECMWF, IMD Polar Division)
// can implement IWeatherProvider to replace the simulator later without
// altering service or controller contracts.
// ═══════════════════════════════════════════════════════════════

import {
  DataProvenance,
  WeatherCondition,
  PredictionHorizon,
  type WeatherForecast,
} from '@repo/shared';
import type { WeatherObservationInsert } from './weather.repository.js';

/**
 * Abstract interface for meteorological data providers
 */
export interface IWeatherProvider {
  /**
   * Produce current weather observation for a station
   */
  generateCurrentWeather(
    stationId: string,
    stationName?: string
  ): WeatherObservationInsert;

  /**
   * Produce multi-day forecast for a station
   */
  generateForecast(
    stationId: string,
    days: number,
    stationName?: string
  ): WeatherForecast[];

  /**
   * Calculate standardized wind-chill temperature (°C) via JAG/TI formula
   */
  calculateWindChill(temperatureC: number, windSpeedKmh: number): number;

  /**
   * Calculate deterministic storm-severity score (0–100 scale)
   */
  calculateStormSeverity(params: {
    windSpeed: number;
    windGust: number;
    windChill: number;
    pressure: number;
    visibilityMeters: number;
  }): { score: number; level: 'LOW' | 'MODERATE' | 'SEVERE' | 'EXTREME' };
}

/**
 * Prototype assumptions documented explicitly per scientific guardrails
 */
export const WEATHER_PROTOTYPE_ASSUMPTIONS = [
  'PROTOTYPE_ASSUMPTION: Weather provider is a deterministic polar climate simulator calibrated for Maitri (inland oasis) and Bharati (coastal hills).',
  'PROTOTYPE_ASSUMPTION: Wind-chill is calculated using the Joint Action Group for Temperature Indices (JAG/TI) formula.',
  'PROTOTYPE_ASSUMPTION: Storm severity index maps wind velocity, gust factor, barometric drop, and visibility into a normalized 0–100 scale.',
  'PROTOTYPE_ASSUMPTION: Multi-day forecast is a simulated scenario model and must not be treated as an authoritative official meteorological forecast.',
];

export class PolarWeatherProvider implements IWeatherProvider {
  /**
   * Standardized JAG/TI (Joint Action Group for Temperature Indices) wind chill formula:
   * T_wc = 13.12 + 0.6215 * T - 11.37 * V^0.16 + 0.3965 * T * V^0.16
   * Valid for T <= 10°C and V >= 4.8 km/h.
   * If V < 4.8 km/h or T > 10°C, wind chill equals ambient temperature.
   */
  public calculateWindChill(temperatureC: number, windSpeedKmh: number): number {
    if (temperatureC > 10 || windSpeedKmh < 4.8) {
      return Math.round(temperatureC * 10) / 10;
    }
    const vPow = Math.pow(windSpeedKmh, 0.16);
    const twc = 13.12 + 0.6215 * temperatureC - 11.37 * vPow + 0.3965 * temperatureC * vPow;
    return Math.round(twc * 10) / 10;
  }

  /**
   * Deterministic storm-severity calculation using:
   * - Sustained wind speed (weight 0.35, baseline 0–120 km/h)
   * - Peak gust ratio (weight 0.25, ratio > 1.3 adds up to 100)
   * - Wind chill severity (weight 0.20, baseline -10°C to -60°C)
   * - Visibility restriction (weight 0.20, baseline 10,000m to 100m)
   */
  public calculateStormSeverity(params: {
    windSpeed: number;
    windGust: number;
    windChill: number;
    pressure: number;
    visibilityMeters: number;
  }): { score: number; level: 'LOW' | 'MODERATE' | 'SEVERE' | 'EXTREME' } {
    // 1. Wind speed factor (0–120 km/h maps to 0–100)
    const windScore = Math.min(100, Math.max(0, (params.windSpeed / 120) * 100));

    // 2. Gust factor (excess gust above sustained wind)
    const gustExcess = Math.max(0, params.windGust - params.windSpeed);
    const gustScore = Math.min(100, Math.max(0, (gustExcess / 40) * 100));

    // 3. Wind chill severity (-10°C is 0, -60°C is 100)
    const chillScore = Math.min(
      100,
      Math.max(0, ((-params.windChill - 10) / 50) * 100)
    );

    // 4. Visibility restriction (10,000m is 0, 200m or less is 100)
    const visScore = Math.min(
      100,
      Math.max(0, ((10000 - params.visibilityMeters) / 9800) * 100)
    );

    const weightedScore =
      windScore * 0.35 + gustScore * 0.25 + chillScore * 0.2 + visScore * 0.2;
    const finalScore = Math.round(Math.min(100, Math.max(0, weightedScore)));

    let level: 'LOW' | 'MODERATE' | 'SEVERE' | 'EXTREME' = 'LOW';
    if (finalScore >= 75) level = 'EXTREME';
    else if (finalScore >= 50) level = 'SEVERE';
    else if (finalScore >= 25) level = 'MODERATE';

    return { score: finalScore, level };
  }

  /**
   * Deterministic weather condition classifier based on wind, visibility, and temperature
   */
  private classifyCondition(
    windSpeed: number,
    visibilityMeters: number,
    tempC: number
  ): WeatherCondition {
    if (windSpeed >= 80 && visibilityMeters <= 500) {
      return WeatherCondition.BLIZZARD;
    }
    if (windSpeed >= 65) {
      return WeatherCondition.KATABATIC_GALE;
    }
    if (visibilityMeters <= 3000 && tempC <= 0) {
      return WeatherCondition.SNOW;
    }
    if (visibilityMeters <= 8000) {
      return WeatherCondition.OVERCAST;
    }
    return WeatherCondition.PARTLY_CLOUDY;
  }

  /**
   * Produce current weather observation for Antarctic station
   */
  public generateCurrentWeather(
    stationId: string,
    stationName?: string
  ): WeatherObservationInsert {
    const isBharati = stationName?.toLowerCase().includes('bharati');

    // Maitri has colder continental air with Katabatic winds from the polar ice sheet.
    // Bharati is coastal with higher humidity and oceanic gustiness.
    const tempC = isBharati ? -18.5 : -28.0;
    const windSpeed = isBharati ? 42.0 : 54.0;
    const windGust = windSpeed * 1.45;
    const windChill = this.calculateWindChill(tempC, windSpeed);
    const pressure = isBharati ? 992.0 : 978.0;
    const humidity = isBharati ? 78 : 55;
    const visibility = isBharati ? 6000 : 4500;
    const condition = this.classifyCondition(windSpeed, visibility, tempC);

    return {
      stationId,
      temperature: tempC,
      windSpeed,
      windGust: Math.round(windGust * 10) / 10,
      windDirection: isBharati ? 'ENE' : 'SSE',
      windChill,
      pressure,
      humidity,
      visibilityMeters: visibility,
      condition,
      provenance: DataProvenance.SIMULATED,
      recordedAt: new Date(),
    };
  }

  /**
   * Produce 7-day simulated polar weather forecast
   */
  public generateForecast(
    stationId: string,
    days: number = 7,
    stationName?: string
  ): WeatherForecast[] {
    const isBharati = stationName?.toLowerCase().includes('bharati');
    const baseTemp = isBharati ? -18.0 : -28.0;
    const forecasts: WeatherForecast[] = [];
    const now = new Date();

    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      // Introduce realistic cyclical polar weather variation
      const dayOffset = Math.sin((i / 7) * Math.PI * 2);
      const isStormDay = i === 3 || i === 4; // Simulated impending Katabatic storm on days 3 & 4

      const tempMin = Math.round((baseTemp - (isStormDay ? 8 : 3) + dayOffset * 2) * 10) / 10;
      const tempMax = Math.round((tempMin + (isStormDay ? 4 : 7)) * 10) / 10;
      const windSpeedAvg = Math.round((isStormDay ? 78 : 35 + Math.abs(dayOffset) * 15) * 10) / 10;
      const windGustMax = Math.round((windSpeedAvg * (isStormDay ? 1.55 : 1.3)) * 10) / 10;
      const windChillMin = this.calculateWindChill(tempMin, windGustMax);
      const pressureTrend = isStormDay ? 'FALLING' : i > 4 ? 'RISING' : 'STABLE';
      const visibility = isStormDay ? 400 : 8000;
      const blizzardRisk = isStormDay ? 85 : 15;

      const storm = this.calculateStormSeverity({
        windSpeed: windSpeedAvg,
        windGust: windGustMax,
        windChill: windChillMin,
        pressure: isStormDay ? 962 : 985,
        visibilityMeters: visibility,
      });

      const condition = this.classifyCondition(windSpeedAvg, visibility, tempMin);

      forecasts.push({
        stationId,
        forecastDate: forecastDate.toISOString(),
        horizon: i === 1 ? PredictionHorizon.TWENTY_FOUR_HOURS : PredictionHorizon.SEVEN_DAYS,
        expectedCondition: condition,
        tempMin,
        tempMax,
        windSpeedAvg,
        windGustMax,
        windChillMin,
        pressureTrend,
        blizzardRiskPercent: blizzardRisk,
        stormSeverityScore: storm.score,
        provenance: DataProvenance.SIMULATED,
        confidenceScore: Math.round((0.85 - (i - 1) * 0.05) * 100) / 100, // Confidence decays with forecast lead time
        assumptions: WEATHER_PROTOTYPE_ASSUMPTIONS,
      });
    }

    return forecasts;
  }
}
