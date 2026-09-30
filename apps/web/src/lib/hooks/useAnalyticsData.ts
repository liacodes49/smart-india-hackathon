import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api';
import {
  StationAnalyticsDataset,
  StationViewMode,
  MaitriVsBharatiComparison,
  OperationalInsight,
  EnergyDataPoint,
} from '@/features/analytics/types';
import {
  MAITRI_ANALYTICS,
  BHARATI_ANALYTICS,
  MAITRI_VS_BHARATI_COMPARISON,
} from '@/features/analytics/mockData';
import { SpatialStationState } from '@repo/shared';

export interface UseAnalyticsDataResult {
  currentDataset: StationAnalyticsDataset;
  maitriDataset: StationAnalyticsDataset;
  bharatiDataset: StationAnalyticsDataset;
  comparison: MaitriVsBharatiComparison;
  loading: boolean;
  isLive: boolean;
  lastUpdated: Date | null;
  error: string | null;
  refetch: () => Promise<void>;
}

function mapSpatialStateToDataset(
  stationId: 'MAITRI' | 'BHARATI',
  baseTemplate: StationAnalyticsDataset,
  twin: SpatialStationState,
  alertsList: any[],
  energyTrend: any | null
): StationAnalyticsDataset {
  const skybox = twin.environmentalSkybox || {
    ambientTemperatureC: -25,
    windSpeedKmh: 45,
    windDirectionDeg: 140,
    condition: 'OVERCAST',
    blizzardVisibilityFactor: 0.9,
  };

  const riskAss = twin.riskAssessment;
  const healthScore = twin.stationHealthScore ?? 50;
  const riskScore = riskAss?.compositeScore ?? (100 - healthScore);
  const riskLevel = twin.riskLevel ?? 'MODERATE';

  // Extract generator telemetry from rootNodes
  let genCoolantTemp = 82;
  let genPowerPercent = 70;
  let genFuelLevel = 75;

  twin.rootNodes?.forEach((b) => {
    if (b.telemetrySummary) {
      Object.entries(b.telemetrySummary).forEach(([key, val]) => {
        const k = key.toLowerCase();
        if (k.includes('coolant')) genCoolantTemp = val.value;
        if (k.includes('power')) genPowerPercent = val.value;
        if (k.includes('fuel')) genFuelLevel = val.value;
      });
    }
  });

  // Map live alerts to insights
  const liveInsights: OperationalInsight[] = alertsList.slice(0, 8).map((alert: any) => {
    let sev: 'CRITICAL' | 'WARNING' | 'NORMAL' | 'INFO' = 'NORMAL';
    if (alert.severity === 'CRITICAL' || alert.severity === 'EMERGENCY') sev = 'CRITICAL';
    else if (alert.severity === 'WARNING') sev = 'WARNING';
    else if (alert.severity === 'INFO') sev = 'INFO';

    return {
      id: alert.id,
      severity: sev,
      category: alert.category || 'OPERATIONAL',
      title: alert.title,
      description: alert.message,
      subsystem: alert.category || 'TELEMETRY',
      timestamp: new Date(alert.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      recommendation: alert.metadata?.lastBreachedReading
        ? `Last reading: ${alert.metadata.lastBreachedReading} ${alert.metadata.readingUnit || ''}`
        : 'Monitor telemetry and inspect subsystems.',
    };
  });

  // Calculate wind chill: JAG/TI formula
  const v = Math.max(1, skybox.windSpeedKmh);
  const t = skybox.ambientTemperatureC;
  const windChill = +(13.12 + 0.6215 * t - 11.37 * Math.pow(v, 0.16) + 0.3965 * t * Math.pow(v, 0.16)).toFixed(1);

  // Map hourly energy points if available from backend
  const energyHistory = { ...baseTemplate.energy.history };
  if (energyTrend?.points && energyTrend.points.length > 0) {
    const points24h: EnergyDataPoint[] = energyTrend.points.slice(-12).map((p: any) => {
      const d = new Date(p.bucket);
      const timeStr = `${String(d.getUTCHours()).padStart(2, '0')}:00`;
      const demand = Math.round(p.avgPowerDemandKw > 500 ? p.avgPowerDemandKw / 18 : p.avgPowerDemandKw);
      const gen = Math.round(demand * 1.1);
      const renewable = Math.round(Math.max(0, 15 + Math.sin(d.getUTCHours() / 4) * 10));
      return {
        timestamp: timeStr,
        demandKw: demand,
        generationKw: gen,
        dieselKw: Math.max(10, demand - renewable),
        renewableKw: renewable,
      };
    });
    if (points24h.length >= 3) {
      energyHistory['24H'] = points24h;
    }
  }

  // Risk breakdown from top drivers
  const riskBreakdown = riskAss?.topDrivers?.map((driver: any) => ({
    category: driver.pillar || 'RISK',
    score: driver.score || 50,
    description: driver.description || 'Monitored risk factor',
  })) || baseTemplate.healthRisk.riskBreakdown;

  // Domain health scores
  const domains = { ...baseTemplate.healthRisk.domains };
  if (riskAss?.pillars) {
    const p = riskAss.pillars;
    if (p.energyRisk) {
      domains.energy = {
        ...domains.energy,
        score: Math.max(0, 100 - p.energyRisk.score),
        status: p.energyRisk.score > 60 ? 'CRITICAL' : p.energyRisk.score > 30 ? 'WARNING' : 'HEALTHY',
      };
    }
    if (p.weatherRisk) {
      domains.environment = {
        ...domains.environment,
        score: Math.max(0, 100 - p.weatherRisk.score),
        status: p.weatherRisk.score > 60 ? 'CRITICAL' : p.weatherRisk.score > 30 ? 'WARNING' : 'HEALTHY',
      };
    }
    if (p.equipmentRisk) {
      domains.infrastructure = {
        ...domains.infrastructure,
        score: Math.max(0, 100 - p.equipmentRisk.score),
        status: p.equipmentRisk.score > 60 ? 'CRITICAL' : p.equipmentRisk.score > 30 ? 'WARNING' : 'HEALTHY',
      };
    }
  }

  // Update generator performance
  const updatedGenerators = baseTemplate.generators.generators.map((g, idx) => {
    if (idx === 0) {
      return {
        ...g,
        temperatureC: genCoolantTemp,
        loadPercent: genPowerPercent,
        healthState: genCoolantTemp > 90 ? ('CRITICAL' as const) : genCoolantTemp > 85 ? ('WARNING' as const) : ('HEALTHY' as const),
      };
    }
    return g;
  });

  return {
    ...baseTemplate,
    stationId,
    kpi: {
      ...baseTemplate.kpi,
      temperatureC: skybox.ambientTemperatureC,
      stationHealthScore: healthScore,
      riskScore: riskScore,
      riskLevel: (riskLevel.toUpperCase() === 'HIGH' ? 'HIGH' : riskLevel.toUpperCase() === 'CRITICAL' ? 'CRITICAL' : riskLevel.toUpperCase() === 'LOW' ? 'LOW' : 'MODERATE') as any,
      powerDemandKw: Math.round(genPowerPercent * 2.2),
      generatorLoadPercent: genPowerPercent,
      fuelRemainingPercent: genFuelLevel,
    },
    environmental: {
      ...baseTemplate.environmental,
      current: {
        ...baseTemplate.environmental.current,
        temperatureC: skybox.ambientTemperatureC,
        windSpeedKmh: skybox.windSpeedKmh,
        windDirectionDeg: skybox.windDirectionDeg,
        windChillC: windChill,
        visibilityKm: +(skybox.blizzardVisibilityFactor * 25).toFixed(1),
      },
    },
    energy: {
      ...baseTemplate.energy,
      currentDemandKw: Math.round(genPowerPercent * 2.2),
      history: energyHistory,
      activeAlerts: alertsList
        .filter((a: any) => a.status === 'ACTIVE' && (
          a.category === 'POWER' || a.category === 'EQUIPMENT' || a.severity === 'CRITICAL' ||
          a.title?.toLowerCase().includes('power') || a.title?.toLowerCase().includes('battery') ||
          a.title?.toLowerCase().includes('generator') || a.title?.toLowerCase().includes('voltage')
        ))
        .map((a: any) => ({
          id: a.id,
          title: a.title,
          severity: (a.severity === 'CRITICAL' || a.severity === 'EMERGENCY' ? 'CRITICAL' : 'WARNING') as any,
          timestamp: new Date(a.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          message: a.message,
        })),
    },
    generators: {
      ...baseTemplate.generators,
      generators: updatedGenerators,
      aggregateLoadPercent: genPowerPercent,
    },
    healthRisk: {
      ...baseTemplate.healthRisk,
      overallHealthScore: healthScore,
      overallHealthStatus: healthScore < 50 ? 'CRITICAL' : healthScore < 75 ? 'WARNING' : 'HEALTHY',
      riskScore: riskScore,
      riskLevel: (riskLevel.toUpperCase() === 'HIGH' ? 'HIGH' : riskLevel.toUpperCase() === 'CRITICAL' ? 'CRITICAL' : riskLevel.toUpperCase() === 'LOW' ? 'LOW' : 'MODERATE') as any,
      domains,
      riskBreakdown,
    },
    insights: liveInsights.length > 0 ? liveInsights : baseTemplate.insights,
  };
}

export function useAnalyticsData(stationMode: StationViewMode): UseAnalyticsDataResult {
  const [maitriDataset, setMaitriDataset] = useState<StationAnalyticsDataset>(MAITRI_ANALYTICS);
  const [bharatiDataset, setBharatiDataset] = useState<StationAnalyticsDataset>(BHARATI_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveAnalytics = useCallback(async () => {
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const startTime = yesterday.toISOString();
      const endTime = now.toISOString();

      // Parallel fetch for Maitri & Bharati
      const [
        maitriTwinRes,
        bharatiTwinRes,
        maitriAlertsRes,
        bharatiAlertsRes,
        maitriEnergyRes,
        bharatiEnergyRes,
      ] = await Promise.allSettled([
        apiClient.digitalTwin.getStationTwin('MAITRI'),
        apiClient.digitalTwin.getStationTwin('BHARATI'),
        apiClient.alerts.list({ stationId: 'MAITRI', limit: 8 }),
        apiClient.alerts.list({ stationId: 'BHARATI', limit: 8 }),
        apiClient.analytics.getEnergyTrend('MAITRI', { startTime, endTime, resolution: 'hourly' }),
        apiClient.analytics.getEnergyTrend('BHARATI', { startTime, endTime, resolution: 'hourly' }),
      ]);

      let liveCount = 0;

      // Handle Maitri
      if (maitriTwinRes.status === 'fulfilled' && (maitriTwinRes.value as any)?.data) {
        const twin = (maitriTwinRes.value as any).data;
        const alertsList = maitriAlertsRes.status === 'fulfilled' ? ((maitriAlertsRes.value as any)?.data || []) : [];
        const energyData = maitriEnergyRes.status === 'fulfilled' ? ((maitriEnergyRes.value as any)?.data || null) : null;
        const mapped = mapSpatialStateToDataset('MAITRI', MAITRI_ANALYTICS, twin, alertsList, energyData);
        setMaitriDataset(mapped);
        liveCount++;
      }

      // Handle Bharati
      if (bharatiTwinRes.status === 'fulfilled' && (bharatiTwinRes.value as any)?.data) {
        const twin = (bharatiTwinRes.value as any).data;
        const alertsList = bharatiAlertsRes.status === 'fulfilled' ? ((bharatiAlertsRes.value as any)?.data || []) : [];
        const energyData = bharatiEnergyRes.status === 'fulfilled' ? ((bharatiEnergyRes.value as any)?.data || null) : null;
        const mapped = mapSpatialStateToDataset('BHARATI', BHARATI_ANALYTICS, twin, alertsList, energyData);
        setBharatiDataset(mapped);
        liveCount++;
      }

      setIsLive(liveCount > 0);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      console.error('[useAnalyticsData] Error fetching analytics:', err);
      setError(err?.message || 'Failed to fetch live analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveAnalytics();
    // Poll every 30 seconds to sync with the simulation engine
    const interval = setInterval(fetchLiveAnalytics, 30000);
    return () => clearInterval(interval);
  }, [fetchLiveAnalytics]);

  // Dynamic comparison
  const comparison = useMemo((): MaitriVsBharatiComparison => {
    return {
      ...MAITRI_VS_BHARATI_COMPARISON,
      lastSyncTime: lastUpdated ? lastUpdated.toLocaleTimeString() : 'LIVE',
      metrics: [
        {
          metric: 'Composite Station Health Index',
          key: 'health',
          unit: '/100',
          maitriValue: maitriDataset.kpi.stationHealthScore,
          bharatiValue: bharatiDataset.kpi.stationHealthScore,
          maitriNumeric: maitriDataset.kpi.stationHealthScore,
          bharatiNumeric: bharatiDataset.kpi.stationHealthScore,
          higherIsBetter: true,
          deltaText: `${Math.abs(maitriDataset.kpi.stationHealthScore - bharatiDataset.kpi.stationHealthScore)} pts delta`,
          status: maitriDataset.kpi.stationHealthScore >= bharatiDataset.kpi.stationHealthScore ? 'MAITRI_AHEAD' : 'BHARATI_AHEAD',
        },
        {
          metric: 'Outside Ambient Temperature',
          key: 'temperature',
          unit: '°C',
          maitriValue: `${maitriDataset.kpi.temperatureC}°C`,
          bharatiValue: `${bharatiDataset.kpi.temperatureC}°C`,
          maitriNumeric: maitriDataset.kpi.temperatureC,
          bharatiNumeric: bharatiDataset.kpi.temperatureC,
          higherIsBetter: true,
          deltaText: `${Math.abs(maitriDataset.kpi.temperatureC - bharatiDataset.kpi.temperatureC).toFixed(1)}°C delta`,
          status: maitriDataset.kpi.temperatureC >= bharatiDataset.kpi.temperatureC ? 'MAITRI_AHEAD' : 'BHARATI_AHEAD',
        },
        {
          metric: 'Wind Speed Intensity',
          key: 'wind',
          unit: 'km/h',
          maitriValue: `${maitriDataset.environmental.current.windSpeedKmh} km/h`,
          bharatiValue: `${bharatiDataset.environmental.current.windSpeedKmh} km/h`,
          maitriNumeric: maitriDataset.environmental.current.windSpeedKmh,
          bharatiNumeric: bharatiDataset.environmental.current.windSpeedKmh,
          higherIsBetter: false,
          deltaText: `${Math.abs(maitriDataset.environmental.current.windSpeedKmh - bharatiDataset.environmental.current.windSpeedKmh).toFixed(0)} km/h difference`,
          status: maitriDataset.environmental.current.windSpeedKmh <= bharatiDataset.environmental.current.windSpeedKmh ? 'MAITRI_AHEAD' : 'BHARATI_AHEAD',
        },
        {
          metric: 'Active Power Demand',
          key: 'power',
          unit: 'kW',
          maitriValue: `${maitriDataset.kpi.powerDemandKw} kW`,
          bharatiValue: `${bharatiDataset.kpi.powerDemandKw} kW`,
          maitriNumeric: maitriDataset.kpi.powerDemandKw,
          bharatiNumeric: bharatiDataset.kpi.powerDemandKw,
          higherIsBetter: false,
          deltaText: `${Math.abs(maitriDataset.kpi.powerDemandKw - bharatiDataset.kpi.powerDemandKw)} kW delta`,
          status: 'BALANCED',
        },
        {
          metric: 'Primary Fuel Reserve Autonomy',
          key: 'fuel',
          unit: 'Days',
          maitriValue: `${maitriDataset.kpi.fuelDaysRemaining} Days`,
          bharatiValue: `${bharatiDataset.kpi.fuelDaysRemaining} Days`,
          maitriNumeric: maitriDataset.kpi.fuelDaysRemaining,
          bharatiNumeric: bharatiDataset.kpi.fuelDaysRemaining,
          higherIsBetter: true,
          deltaText: `${Math.abs(maitriDataset.kpi.fuelDaysRemaining - bharatiDataset.kpi.fuelDaysRemaining)} Days delta`,
          status: maitriDataset.kpi.fuelDaysRemaining >= bharatiDataset.kpi.fuelDaysRemaining ? 'MAITRI_AHEAD' : 'BHARATI_AHEAD',
        },
      ],
    };
  }, [maitriDataset, bharatiDataset, lastUpdated]);

  const currentDataset = stationMode === 'BHARATI' ? bharatiDataset : maitriDataset;

  return {
    currentDataset,
    maitriDataset,
    bharatiDataset,
    comparison,
    loading,
    isLive,
    lastUpdated,
    error,
    refetch: fetchLiveAnalytics,
  };
}
