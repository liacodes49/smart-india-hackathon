"use client";

import React from "react";
import Link from "next/link";
import { useStationStore, type ViewMode, type CameraPreset } from "@/stores/useStationStore";
import { STATIONS } from "@repo/shared/constants";
import AntarcticaOverview from "@/components/digital-twin/AntarcticaOverview";
import {
  Box,
  Layers,
  Camera,
  Crosshair,
  RotateCcw,
  Compass,
  Eye,
  Zap,
  Fuel,
  Home,
  Truck,
  Maximize2,
} from "lucide-react";

const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: "NORMAL", label: "NORMAL" },
  { id: "ENERGY", label: "ENERGY" },
  { id: "RISK", label: "RISK" },
  { id: "LOGISTICS", label: "LOGISTICS" },
];

const CAMERA_PRESETS: { id: CameraPreset; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "OVERVIEW", label: "Overview", icon: Eye },
  { id: "POWER", label: "Power", icon: Zap },
  { id: "FUEL", label: "Fuel", icon: Fuel },
  { id: "HABITAT", label: "Habitat", icon: Home },
  { id: "LOGISTICS", label: "Logistics", icon: Truck },
];

export function DigitalTwinPanel() {
  const activeStation = useStationStore((s) => s.activeStation);
  const viewMode = useStationStore((s) => s.viewMode);
  const setViewMode = useStationStore((s) => s.setViewMode);
  const cameraPreset = useStationStore((s) => s.cameraPreset);
  const setCameraPreset = useStationStore((s) => s.setCameraPreset);
  const selectedAssetId = useStationStore((s) => s.selectedAssetId);
  const setSelectedAsset = useStationStore((s) => s.setSelectedAsset);
  const clearAssetFocus = useStationStore((s) => s.clearAssetFocus);

  const stationMeta = STATIONS[activeStation];

  const handleUnlockTarget = () => {
    setSelectedAsset(null);
    clearAssetFocus();
  };

  return (
    <section
      aria-label="3D Digital Twin Viewport Integration"
      className="flex-1 flex flex-col min-h-[480px] lg:min-h-[560px] rounded-2xl border border-white/[0.08] bg-[#03060c] shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden relative select-none font-mono"
    >
      {/* 1. Viewport Top Controls Bar (Integration HUD) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] bg-[#060a12]/90 px-4 py-2.5 backdrop-blur-md z-20">
        {/* Left: Station Identity */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
            <Box className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider text-slate-100 uppercase">
                <span className="text-cyan-400 mr-1.5">[{activeStation}]</span>
                <span>3D DIGITAL TWIN</span>
              </span>
            </div>
            <p className="text-[9.5px] text-slate-400">
              {stationMeta.name} • {stationMeta.latitude}°S, {stationMeta.longitude}°E
            </p>
          </div>
        </div>

        {/* Center: Camera Presets */}
        <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-slate-950/80 p-0.5 text-xs">
          <div className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-slate-400 font-bold border-r border-slate-800">
            <Camera className="w-3 h-3 text-cyan-400" />
            <span className="hidden md:inline uppercase">PRESET:</span>
          </div>
          {CAMERA_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isCurrent = cameraPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setCameraPreset(preset.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                  isCurrent
                    ? "bg-cyan-950 text-cyan-200 border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
                }`}
                title={`Target camera to ${preset.label}`}
              >
                <Icon className={`w-3 h-3 ${isCurrent ? "text-cyan-300" : "text-slate-500"}`} />
                <span className="hidden sm:inline">{preset.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: View Mode Selector */}
        <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-slate-950/80 p-0.5 text-xs">
          <div className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-slate-400 font-bold border-r border-slate-800">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span className="hidden md:inline uppercase">VIEW:</span>
          </div>
          {VIEW_MODES.map((mode) => {
            const isCurrent = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setViewMode(mode.id)}
                className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                  isCurrent
                    ? "bg-cyan-950 text-cyan-200 border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
                }`}
                title={`Switch shading mode to ${mode.label}`}
              >
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Target Lock HUD Banner (Conditional when an asset is selected) */}
      {selectedAssetId && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-cyan-400/50 bg-cyan-950/90 text-cyan-200 text-xs backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.3)]">
          <Crosshair className="w-3.5 h-3.5 text-cyan-300" />
          <span>
            TARGET LOCKED: <span className="font-bold text-white">{selectedAssetId}</span>
          </span>
          <button
            type="button"
            onClick={handleUnlockTarget}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-slate-300 transition-colors cursor-pointer ml-1"
            title="Deselect asset"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>UNLOCK</span>
          </button>
        </div>
      )}

      {/* 3. Main Viewport Integration Area: Live Interactive 3D Digital Twin */}
      <div className="flex-1 w-full min-h-[460px] relative overflow-hidden bg-black flex flex-col">
        <AntarcticaOverview embedded initialStationId={activeStation} />
      </div>

      {/* 4. Bottom Viewport Telemetry Status Ticker */}
      <div className="flex items-center justify-between border-t border-white/[0.06] bg-[#050912]/90 px-4 py-2 backdrop-blur-md text-[10px] text-slate-400 z-20 font-mono">
        <div className="flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold text-slate-300">POLAR VIRTUAL HORIZON</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            {activeStation === "MAITRI" ? "Schirmacher Oasis (Inland)" : "Larsemann Hills (Coastal)"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/digital-twin"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 text-[10px] font-bold transition-colors cursor-pointer shadow-sm"
          >
            <Maximize2 className="w-3 h-3 text-cyan-300" />
            <span>FULLSCREEN TWIN</span>
          </Link>
        </div>
      </div>
    </section>
  );
}