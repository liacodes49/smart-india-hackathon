import { create } from 'zustand';
import { StationId } from '@repo/shared/enums';

export type ViewMode = 'NORMAL' | 'ENERGY' | 'RISK' | 'LOGISTICS';
export type CameraPreset = 'OVERVIEW' | 'POWER' | 'FUEL' | 'HABITAT' | 'LOGISTICS';

export interface StationStoreState {
  // Station & Asset Selection
  activeStation: StationId;
  selectedAssetId: string | null;

  // UI State
  isSidebarCollapsed: boolean;

  // 3D Twin Integration Boundary
  viewMode: ViewMode;
  cameraPreset: CameraPreset;
  focusAssetRequest: string | null;

  // Actions
  setActiveStation: (station: StationId) => void;
  setSelectedAsset: (assetId: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  requestAssetFocus: (assetId: string) => void;
  clearAssetFocus: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useStationStore = create<StationStoreState>((set) => ({
  activeStation: StationId.MAITRI,
  selectedAssetId: null,
  isSidebarCollapsed: false,
  viewMode: 'NORMAL',
  cameraPreset: 'OVERVIEW',
  focusAssetRequest: null,

  setActiveStation: (station: StationId) =>
    set({ activeStation: station, selectedAssetId: null, focusAssetRequest: null }),

  setSelectedAsset: (assetId: string | null) =>
    set({ selectedAssetId: assetId }),

  setViewMode: (mode: ViewMode) =>
    set({ viewMode: mode }),

  setCameraPreset: (preset: CameraPreset) =>
    set({ cameraPreset: preset }),

  requestAssetFocus: (assetId: string) =>
    set({ focusAssetRequest: assetId, selectedAssetId: assetId }),

  clearAssetFocus: () =>
    set({ focusAssetRequest: null }),

  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  setSidebarCollapsed: (collapsed: boolean) =>
    set({ isSidebarCollapsed: collapsed }),
}));
