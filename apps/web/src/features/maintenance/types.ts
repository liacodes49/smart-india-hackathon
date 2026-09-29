import { StationId } from '@repo/shared/enums';

export type MaintenanceStatusType = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';

export interface EquipmentMetrics {
  operatingTemperatureC?: number;
  powerOutputKw?: number;
  fuelConsumptionLph?: number;
  vibrationRms?: number;
  operatingHours?: number;
  differentialPressurePsi?: number;
  humidityPct?: number;
  tankLevelPct?: number;
  rxSnrDb?: number;
}

export interface EquipmentSpatial {
  position: [number, number, number];
  rotation: [number, number, number];
  boundingZone: string;
}

export interface EquipmentPrediction {
  failureProbability72h: number;
  estimatedTimeToFailureHours: number;
  recommendedAction: string;
}

export interface EquipmentAsset {
  assetId: string;
  stationId: StationId;
  name: string;
  category: string;
  subType: string;
  status: MaintenanceStatusType;
  healthIndex: number;
  metrics: EquipmentMetrics;
  spatial: EquipmentSpatial;
  prediction: EquipmentPrediction;
  lastUpdated: string;
}
