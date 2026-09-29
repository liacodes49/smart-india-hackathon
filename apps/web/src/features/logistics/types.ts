import { StationId } from '@repo/shared/enums';

export type LogisticsStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';

export interface LogisticsKpis {
  fuelReserveDays: number;
  fuelReserveTrend: number;
  logisticsReadiness: number;
  logisticsTrend: number;
}

export interface LogisticsAssetItem {
  assetId: string;
  stationId: StationId;
  name: string;
  category: 'LOGISTICS';
  subType: 'CRYOGENIC_FUEL_STORAGE' | 'OVERLAND_FLEET' | string;
  status: LogisticsStatus;
  tankLevelPct?: number;
  locationZone: string;
  position: [number, number, number];
  recommendedAction: string;
  lastUpdated: string;
}
