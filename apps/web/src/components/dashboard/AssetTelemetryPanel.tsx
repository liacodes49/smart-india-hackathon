"use client";

import React from "react";
import { useStationStore } from "@/stores/useStationStore";
import { Crosshair, RotateCcw, Cpu, Radio } from "lucide-react";

export function AssetTelemetryPanel() {
  const activeStation = useStationStore((s) => s.activeStation);
  const selectedAssetId = useStationStore((s) => s.selectedAssetId);
  const setSelectedAsset = useStationStore((s) => s.setSelectedAsset);
  const requestAssetFocus = useStationStore((s) => s.requestAssetFocus);
  const clearAssetFocus = useStationStore((s) => s.clearAssetFocus);

  const handleDeselect = () => {
    setSelectedAsset(null);
    clearAssetFocus();
  };

  const handleRefocus = () => {
    if (selectedAssetId) {
      requestAssetFocus(selectedAssetId);
    }
  };

  return (
    <section
      aria-label="Asset Telemetry Inspector"
      className="flex flex-col p-4 rounded-2xl border border-white/[0.08] bg-[#080d16]/90 backdrop-blur-md font-mono select-none"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              ASSET TELEMETRY
            </h3>
            <p className="text-[10px] text-slate-400">
              [{activeStation}] Sensor Telemetry Stream
            </p>
          </div>
        </div>

        {selectedAssetId ? (
          <button
            type="button"
            onClick={handleDeselect}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-slate-300 transition-colors cursor-pointer"
            title="Deselect active asset"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>DESELECT</span>
          </button>
        ) : (
          <span className="text-[9.5px] px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800 text-slate-400">
            IDLE
          </span>
        )}
      </div>

      {/* Main Content Area */}
      {!selectedAssetId ? (
        /* Empty State: No Asset Selected */
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-white/[0.06] text-slate-500 mb-2.5">
            <Crosshair className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-300">
            Select an asset in the Digital Twin
          </p>
          <p className="text-[10.5px] text-slate-400 mt-1 max-w-[240px] leading-relaxed">
            Click any 3D station structure, subsystem generator, or sensor beacon to inspect live
            telemetry.
          </p>
        </div>
      ) : (
        /* Populated State: Asset Selected (Neutral Real-Data Pending Placeholders) */
        <div className="mt-3 space-y-3">
          {/* Target Identity Banner */}
          <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              <div>
                <span className="text-[10px] text-cyan-400/80 uppercase font-bold block">
                  ACTIVE TARGET
                </span>
                <span className="text-xs font-bold text-slate-100">{selectedAssetId}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRefocus}
              className="px-2 py-1 rounded text-[10px] font-bold bg-cyan-900/40 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-200 transition-colors cursor-pointer"
              title="Fly camera to target"
            >
              FOCUS IN 3D
            </button>
          </div>

          {/* Telemetry Sensor Channels (Neutral Placeholders) */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-white/[0.04]">
              <span className="text-slate-400 text-[11px]">Operational Status:</span>
              <span className="text-slate-400 italic text-[10px]">Awaiting telemetry</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-white/[0.04]">
              <span className="text-slate-400 text-[11px]">Primary Sensor Reading:</span>
              <span className="text-slate-400 italic text-[10px]">No live packet</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-white/[0.04]">
              <span className="text-slate-400 text-[11px]">Telemetry Stream:</span>
              <span className="text-slate-400 italic text-[10px]">Data pending</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-white/[0.04]">
              <span className="text-slate-400 text-[11px]">Last Updated:</span>
              <span className="text-slate-400 italic text-[10px]">Not available</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-1 text-[9.5px] text-slate-400">
            <Radio className="w-3 h-3 text-slate-500" />
            <span>Listening for telemetry packets on WebSocket stream</span>
          </div>
        </div>
      )}
    </section>
  );
}