"use client";

import React from "react";
import Link from "next/link";
import { useStationStore } from "@/stores/useStationStore";
import { useLiveTelemetry } from "@/lib/hooks/useLiveTelemetry";
import { Crosshair, RotateCcw, Cpu, Radio, Activity, Gauge, AlertTriangle, Zap, CheckCircle2, Wrench } from "lucide-react";

export function AssetTelemetryPanel() {
  const activeStation = useStationStore((s) => s.activeStation);
  const selectedAssetId = useStationStore((s) => s.selectedAssetId);
  const setSelectedAsset = useStationStore((s) => s.setSelectedAsset);
  const requestAssetFocus = useStationStore((s) => s.requestAssetFocus);
  const clearAssetFocus = useStationStore((s) => s.clearAssetFocus);

  const { rawAssets, telemetry } = useLiveTelemetry(activeStation);

  // Match selected asset against real database assets or fallback telemetry models
  const activeAsset: any = React.useMemo(() => {
    if (!selectedAssetId) return null;
    const match = rawAssets.find(
      (a) => a.id === selectedAssetId || a.name === selectedAssetId || a.name?.toLowerCase().includes(selectedAssetId.toLowerCase())
    );
    if (match) return match;
    return telemetry.find((t) => t.id === selectedAssetId || t.name === selectedAssetId);
  }, [selectedAssetId, rawAssets, telemetry]);

  const handleDeselect = () => {
    setSelectedAsset(null);
    clearAssetFocus();
  };

  const handleRefocus = () => {
    if (selectedAssetId) {
      requestAssetFocus(selectedAssetId);
    }
  };

  // Sensors attached to active asset
  const sensors: any[] = React.useMemo(() => {
    if (!activeAsset) return [];
    if (activeAsset.children && Array.isArray(activeAsset.children)) {
      return activeAsset.children.filter((c: any) => c.type === "SENSOR");
    }
    return [];
  }, [activeAsset]);

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
          <span className="text-[9.5px] px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800 text-cyan-300 font-semibold">
            {rawAssets.length} ASSETS MONITORED
          </span>
        )}
      </div>

      {/* Main Content Area */}
      {!selectedAssetId ? (
        /* Empty State with Quick Selectable Assets from Database */
        <div className="py-4 flex flex-col">
          <div className="flex flex-col items-center justify-center text-center pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-white/[0.06] text-slate-500 mb-1.5">
              <Crosshair className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-200">
              Select an asset in the Digital Twin
            </p>
            <p className="text-[10px] text-slate-400 max-w-[260px] leading-relaxed">
              Click any station node or select a critical asset below to inspect live sensor streams.
            </p>
          </div>

          {/* Quick Assets List from Database */}
          <div className="mt-2 pt-2 border-t border-white/[0.04] space-y-1.5">
            <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block">
              Active Station Equipment
            </span>
            <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
              {(rawAssets.length > 0 ? rawAssets : telemetry).slice(0, 4).map((asset: any) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setSelectedAsset(asset.id)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-950/70 hover:bg-cyan-950/40 border border-white/[0.04] hover:border-cyan-500/30 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      asset.healthColor === "GREEN" || asset.health === "NORMAL" ? "bg-emerald-400" :
                      asset.healthColor === "YELLOW" || asset.health === "WARNING" ? "bg-amber-400" : "bg-rose-400"
                    }`} />
                    <span className="text-[11px] text-slate-300 group-hover:text-cyan-200 truncate font-medium">
                      {asset.name}
                    </span>
                  </div>
                  <span className="text-[9px] text-cyan-400 font-bold shrink-0 uppercase">
                    INSPECT
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Populated State: Real Asset Live Telemetry Channels */
        <div className="mt-3 space-y-3">
          {/* Target Identity Banner */}
          <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <div className="truncate">
                <span className="text-[9.5px] text-cyan-400/80 uppercase font-bold block">
                  ACTIVE TARGET
                </span>
                <span className="text-xs font-bold text-slate-100 truncate block">
                  {activeAsset?.name || selectedAssetId}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRefocus}
              className="px-2 py-1 rounded text-[10px] font-bold bg-cyan-900/40 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-200 transition-colors cursor-pointer shrink-0 ml-2"
              title="Fly camera to target"
            >
              FOCUS IN 3D
            </button>
          </div>

          {/* Telemetry Sensor Channels (Live Data) */}
          <div className="space-y-2 text-xs">
            {/* Operational Status */}
            <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-white/[0.04]">
              <span className="text-slate-400 text-[11px]">Operational Status:</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 uppercase">
                {activeAsset?.status || "OPERATIONAL"}
              </span>
            </div>

            {/* Health Score */}
            <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-white/[0.04]">
              <span className="text-slate-400 text-[11px]">Health Index:</span>
              <span className="text-[11px] font-bold text-slate-100 flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-cyan-400" />
                <span>{activeAsset?.healthScore ?? 90}%</span>
              </span>
            </div>

            {/* Live Sensors Breakdown */}
            {sensors.length > 0 ? (
              sensors.map((sensor: any) => {
                const readingKey = Object.keys(sensor.telemetrySummary || {})[0];
                const reading = readingKey ? sensor.telemetrySummary[readingKey] : null;

                return (
                  <div
                    key={sensor.id}
                    className="flex items-center justify-between p-2 rounded bg-slate-950 border border-white/[0.04]"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Gauge className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="text-slate-300 text-[10.5px] truncate">
                        {sensor.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-cyan-300 shrink-0 ml-2">
                      {reading ? `${reading.value} ${reading.unit}` : "Nominal"}
                    </span>
                  </div>
                );
              })
            ) : (
              /* Fallback Telemetry Channels for standard spatial models */
              <>
                {activeAsset?.temperature !== undefined && (
                  <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-white/[0.04]">
                    <span className="text-slate-400 text-[11px]">Coolant Temp:</span>
                    <span className="text-slate-200 font-bold text-[11px] text-cyan-300">
                      {activeAsset.temperature.toFixed(1)} °C
                    </span>
                  </div>
                )}
                {activeAsset?.power !== undefined && (
                  <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-white/[0.04]">
                    <span className="text-slate-400 text-[11px]">Active Load:</span>
                    <span className="text-slate-200 font-bold text-[11px] text-emerald-300 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      {activeAsset.power.toFixed(1)} kW
                    </span>
                  </div>
                )}
                {activeAsset?.fuel !== undefined && (
                  <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-white/[0.04]">
                    <span className="text-slate-400 text-[11px]">Fuel Reserve:</span>
                    <span className="text-slate-200 font-bold text-[11px] text-amber-300">
                      {activeAsset.fuel.toFixed(0)}%
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Spatial Provenance */}
            <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-white/[0.04]">
              <span className="text-slate-400 text-[10.5px]">Spatial Provenance:</span>
              <span className="text-[9.5px] text-slate-400 uppercase font-mono">
                {activeAsset?.spatialProvenance || "CONFIGURED"}
              </span>
            </div>

            {/* Cross-System Quick Navigation Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06]">
              <Link
                href={`/alerts?assetId=${activeAsset.id}`}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-950 border border-amber-500/40 text-amber-300 text-[10px] font-bold transition-all cursor-pointer text-center"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>INSPECT ALERTS</span>
              </Link>
              <Link
                href={`/maintenance?assetId=${activeAsset.id}`}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold transition-all cursor-pointer text-center"
              >
                <Wrench className="w-3 h-3" />
                <span>MAINTENANCE</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-1 text-[9.5px] text-emerald-400/90">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Telemetry link synchronized with spatial twin</span>
          </div>
        </div>
      )}
    </section>
  );
}