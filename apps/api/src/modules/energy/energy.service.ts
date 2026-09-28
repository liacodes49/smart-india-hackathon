// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Energy Monitoring Service
// ═══════════════════════════════════════════════════════════════
// Aggregation and operational interpretation layer over raw telemetry.
// Calculates station generation load, fuel autonomy, battery state,
// and energy distribution trends.
// ═══════════════════════════════════════════════════════════════

import { sensorsRepository } from '../sensors/sensors.repository.js';
import { stationsRepository } from '../stations/stations.repository.js';
import { telemetryService } from '../telemetry/telemetry.service.js';
import { eventBus } from '../../lib/event-bus.js';
import { createDomainEvent, EventType, EnergySummary } from '@repo/shared';
import { analyticsRepository } from '../analytics/analytics.repository.js';

export interface EnergyTrendPoint {
  timestamp: string;
  generationKw: number;
  fuelLevelPercent: number;
}

export class EnergyService {
  async getStationEnergySummary(stationIdOrCode: string): Promise<EnergySummary> {
    const station = await stationsRepository.findById(stationIdOrCode);
    if (!station) {
      throw new Error(`Station '${stationIdOrCode}' not found`);
    }

    const sensorsList = await sensorsRepository.findAll({ stationId: station.id, limit: 100 });
    const powerSensors = sensorsList.data.filter(s => s.type === 'POWER');
    const fuelSensors = sensorsList.data.filter(s => s.type === 'FUEL');
    const batterySensors = sensorsList.data.filter(s => s.type === 'BATTERY');

    // Aggregate generation power (kW)
    let totalKw = 0;
    let activeGenerators = 0;

    for (const ps of powerSensors) {
      const stats = await telemetryService.getRollingStats(ps.id, '15m');
      const kw = ps.lastReading ?? stats.avg ?? 0;
      if (kw > 0) activeGenerators++;
      totalKw += kw;
    }

    // Generator capacity baseline (assume ~125 kW total capacity per station for Maitri/Bharati)
    const ratedCapacityKw = Math.max(100, powerSensors.length * 62.5);
    const loadFactor = Math.min(100, Number(((totalKw / ratedCapacityKw) * 100).toFixed(1)));

    // Fuel reserves
    let fuelPercent = 85;
    if (fuelSensors.length > 0) {
      const sumFuel = fuelSensors.reduce((acc, s) => acc + (s.lastReading ?? 80), 0);
      fuelPercent = Number((sumFuel / fuelSensors.length).toFixed(1));
    }

    // Calculate burn rate & estimated hours remaining
    // Estimated consumption: ~0.5% per hour at 65% load
    const burnRatePercentPerHour = Math.max(0.2, (loadFactor / 100) * 0.8);
    const fuelEstimatedHoursRemaining = Number((fuelPercent / burnRatePercentPerHour).toFixed(1));

    // Battery SoC
    let batterySoc: number | undefined;
    if (batterySensors.length > 0) {
      const sumSoc = batterySensors.reduce((acc, s) => acc + (s.lastReading ?? 90), 0);
      batterySoc = Number((sumSoc / batterySensors.length).toFixed(1));
    }

    // Health status
    let status: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
    if (loadFactor > 90 || fuelPercent < 15) {
      status = 'CRITICAL';
    } else if (loadFactor > 80 || fuelPercent < 25) {
      status = 'WARNING';
    }

    const summary: EnergySummary = {
      stationId: station.id,
      totalGenerationKw: Number(totalKw.toFixed(1)),
      loadFactorPercent: loadFactor,
      fuelReservesPercent: fuelPercent,
      fuelEstimatedHoursRemaining,
      activeGenerators,
      totalGenerators: Math.max(1, powerSensors.length),
      batterySocPercent: batterySoc,
      status,
      timestamp: new Date().toISOString(),
    };

    if (status !== 'NORMAL') {
      await eventBus.publish(
        createDomainEvent({
          eventType: EventType.ENERGY_THRESHOLD_EXCEEDED,
          source: 'energy-service',
          entityId: station.id,
          stationId: station.id,
          payload: summary,
        })
      );
    } else {
      await eventBus.publish(
        createDomainEvent({
          eventType: EventType.ENERGY_STATE_UPDATED,
          source: 'energy-service',
          entityId: station.id,
          stationId: station.id,
          payload: summary,
        })
      );
    }

    return summary;
  }

  async getStationEnergyTrends(stationIdOrCode: string): Promise<EnergyTrendPoint[]> {
    const station = await stationsRepository.findById(stationIdOrCode);
    if (!station) {
      throw new Error(`Station '${stationIdOrCode}' not found`);
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 3600 * 1000);

    // 1. Fetch real hourly rollups from PostgreSQL
    const rollups = await analyticsRepository.getEnergyRollups(
      station.id,
      twentyFourHoursAgo,
      now,
      'hourly'
    );

    const rollupMap = new Map<string, number>();
    for (const r of rollups) {
      // Key by hour string e.g. "2026-09-16T14:00:00Z"
      rollupMap.set(r.bucket, r.avgPowerDemandKw);
    }

    // Get current fuel level baseline
    const summary = await this.getStationEnergySummary(station.id).catch(() => null);
    const baselineFuel = summary?.fuelReservesPercent ?? 85;

    const points: EnergyTrendPoint[] = [];

    // Construct exactly 25 hourly points across the 24h window
    for (let i = 24; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 3600 * 1000);
      time.setMinutes(0, 0, 0);
      const isoBucket = time.toISOString();

      let loadKw: number;
      if (rollupMap.has(isoBucket)) {
        loadKw = rollupMap.get(isoBucket)!;
      } else {
        // Deterministic diurnal Antarctic baseline model without random jitter
        const hour = time.getUTCHours();
        loadKw = 55 + Math.sin(((hour - 6) * Math.PI) / 12) * 12;
      }

      // Linear fuel consumption projection
      const fuelLevel = Math.max(10, baselineFuel - (24 - i) * 0.15);

      points.push({
        timestamp: isoBucket,
        generationKw: Number(loadKw.toFixed(1)),
        fuelLevelPercent: Number(fuelLevel.toFixed(1)),
      });
    }

    return points;
  }
}

export const energyService = new EnergyService();
