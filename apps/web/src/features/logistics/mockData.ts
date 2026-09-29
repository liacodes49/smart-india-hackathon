import { StationId } from '@repo/shared/enums';
import { LogisticsKpis, LogisticsAssetItem } from './types';

export const STATION_LOGISTICS_KPIS: Record<StationId, LogisticsKpis> = {
  [StationId.MAITRI]: {
    fuelReserveDays: 64,
    fuelReserveTrend: -0.4,
    logisticsReadiness: 88.0,
    logisticsTrend: 1.2,
  },
  [StationId.BHARATI]: {
    fuelReserveDays: 92,
    fuelReserveTrend: -0.2,
    logisticsReadiness: 94.5,
    logisticsTrend: 0.8,
  },
};

export const STATION_LOGISTICS_ASSETS: Record<StationId, LogisticsAssetItem[]> = {
  [StationId.MAITRI]: [
    {
      assetId: 'FUEL-003',
      stationId: StationId.MAITRI,
      name: 'Aviation Turbine Fuel Tank Farm 03',
      category: 'LOGISTICS',
      subType: 'CRYOGENIC_FUEL_STORAGE',
      status: 'NORMAL',
      tankLevelPct: 78.4,
      locationZone: 'POL_TANK_FARM_SOUTH',
      position: [-18.5, 0.5, -28.0],
      recommendedAction: 'Reserve adequate for 94 days at current burn rates.',
      lastUpdated: '2026-09-09T16:50:00Z',
    },
    {
      assetId: 'DEPOT-001',
      stationId: StationId.MAITRI,
      name: 'PistenBully Snowcat & Heavy Sledge Bay',
      category: 'LOGISTICS',
      subType: 'OVERLAND_FLEET',
      status: 'NORMAL',
      tankLevelPct: 85.0,
      locationZone: 'LOGISTICS_DEPOT_EAST',
      position: [15.0, 0.5, 16.0],
      recommendedAction: 'Pre-heat block engine heaters engaged for convoy mission.',
      lastUpdated: '2026-09-09T17:00:00Z',
    },
  ],
  [StationId.BHARATI]: [
    {
      assetId: 'FUEL-B01',
      stationId: StationId.BHARATI,
      name: 'Polar Diesel Fuel Tank Bulk Storage',
      category: 'LOGISTICS',
      subType: 'CRYOGENIC_FUEL_STORAGE',
      status: 'NORMAL',
      tankLevelPct: 82.5,
      locationZone: 'BHARATI_POL_DEPOT',
      position: [-10.0, 0.5, -20.0],
      recommendedAction: 'Fuel quality nominal. Zero water bottom condensation detected.',
      lastUpdated: '2026-09-09T17:08:00Z',
    },
    {
      assetId: 'DEPOT-B01',
      stationId: StationId.BHARATI,
      name: 'Larsemann Coastal Rover & Over-snow Bay',
      category: 'LOGISTICS',
      subType: 'OVERLAND_FLEET',
      status: 'NORMAL',
      tankLevelPct: 90.0,
      locationZone: 'COASTAL_LOGISTICS_SHED',
      position: [8.0, 0.5, 24.0],
      recommendedAction: 'Track tension nominal. Ready for sea-ice reconnaissance pass.',
      lastUpdated: '2026-09-09T17:15:00Z',
    },
  ],
};

export function getStationLogistics(stationId: StationId): {
  kpis: LogisticsKpis;
  assets: LogisticsAssetItem[];
} {
  return {
    kpis: STATION_LOGISTICS_KPIS[stationId] || STATION_LOGISTICS_KPIS[StationId.MAITRI],
    assets: STATION_LOGISTICS_ASSETS[stationId] || STATION_LOGISTICS_ASSETS[StationId.MAITRI],
  };
}
