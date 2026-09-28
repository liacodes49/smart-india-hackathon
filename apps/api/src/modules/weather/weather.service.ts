// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Weather Service
// ═══════════════════════════════════════════════════════════════
// Core business service for Antarctic meteorological data,
// wind-chill computation, storm-severity evaluation, and forecasts.
// ═══════════════════════════════════════════════════════════════

import {
  EventType,
  createDomainEvent,
  DataProvenance,
  type WeatherForecast,
} from '@repo/shared';
import type { CreateWeatherObservationInput } from '@repo/schemas';
import { eventBus } from '../../lib/event-bus.js';
import {
  WeatherRepository,
  weatherRepository,
  type WeatherObservationSelect,
} from './weather.repository.js';
import {
  PolarWeatherProvider,
  type IWeatherProvider,
  WEATHER_PROTOTYPE_ASSUMPTIONS,
} from './weather.provider.js';
import { stationsRepository } from '../stations/stations.repository.js';

export class WeatherService {
  constructor(
    private readonly repo: WeatherRepository = weatherRepository,
    private readonly provider: IWeatherProvider = new PolarWeatherProvider()
  ) {}

  /**
   * Record a new weather observation (from sensors, manual entry, or external feed)
   */
  async recordObservation(
    input: CreateWeatherObservationInput
  ): Promise<WeatherObservationSelect> {
    const station = await stationsRepository.findById(input.stationId);
    if (!station) {
      throw new Error(`Station not found: ${input.stationId}`);
    }

    // Standardized wind chill calculation if not explicitly provided
    const windChill =
      input.windChill ??
      this.provider.calculateWindChill(input.temperature, input.windSpeed);

    const recorded = await this.repo.create({
      stationId: input.stationId,
      temperature: input.temperature,
      windSpeed: input.windSpeed,
      windGust: input.windGust,
      windDirection: input.windDirection,
      windChill,
      pressure: input.pressure,
      humidity: input.humidity,
      visibilityMeters: input.visibilityMeters,
      condition: input.condition,
      provenance: input.provenance as DataProvenance,
      recordedAt: input.recordedAt ? new Date(input.recordedAt) : new Date(),
    });

    eventBus.publish(
      createDomainEvent({
        eventType: EventType.WEATHER_OBSERVATION_RECORDED,
        source: 'weather-service',
        stationId: input.stationId,
        entityId: recorded.id,
        payload: recorded,
      })
    );

    return recorded;
  }

  /**
   * Get latest current weather for an Antarctic station.
   * If no observation was recorded in the past 15 minutes,
   * generates a simulated observation via PolarWeatherProvider and saves it.
   */
  async getCurrentWeather(stationId: string): Promise<WeatherObservationSelect> {
    const station = await stationsRepository.findById(stationId);
    if (!station) {
      throw new Error(`Station not found: ${stationId}`);
    }

    const latest = await this.repo.findLatestByStation(stationId);
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    if (latest && new Date(latest.recordedAt) > fifteenMinutesAgo) {
      return latest;
    }

    // Generate fresh observation from polar physics model
    const simulatedData = this.provider.generateCurrentWeather(
      stationId,
      station.name
    );
    const saved = await this.repo.create(simulatedData);

    eventBus.publish(
      createDomainEvent({
        eventType: EventType.WEATHER_OBSERVATION_RECORDED,
        source: 'weather-service',
        stationId,
        entityId: saved.id,
        payload: saved,
      })
    );

    return saved;
  }

  /**
   * Get multi-day simulated weather forecast with storm-severity and wind chill
   */
  async getForecast(
    stationId: string,
    days: number = 7
  ): Promise<{
    stationId: string;
    forecasts: WeatherForecast[];
    assumptions: string[];
  }> {
    const station = await stationsRepository.findById(stationId);
    if (!station) {
      throw new Error(`Station not found: ${stationId}`);
    }

    const clampedDays = Math.max(1, Math.min(14, days));
    const forecasts = this.provider.generateForecast(
      stationId,
      clampedDays,
      station.name
    );

    eventBus.publish(
      createDomainEvent({
        eventType: EventType.WEATHER_FORECAST_UPDATED,
        source: 'weather-service',
        stationId,
        entityId: stationId,
        payload: { forecastsCount: forecasts.length },
      })
    );

    return {
      stationId,
      forecasts,
      assumptions: WEATHER_PROTOTYPE_ASSUMPTIONS,
    };
  }

  /**
   * Get historical observations for a station within a time range
   */
  async getHistory(
    stationId: string,
    startDate?: string,
    endDate?: string,
    limit: number = 100
  ): Promise<WeatherObservationSelect[]> {
    return this.repo.findByStationAndRange(
      stationId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      limit
    );
  }
}

export const weatherService = new WeatherService();
