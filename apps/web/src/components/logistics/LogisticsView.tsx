"use client";

import React from "react";
import Link from "next/link";
import { useStationStore } from "@/stores/useStationStore";
import { STATIONS } from "@repo/shared/constants";
import { getStationLogistics } from "@/features/logistics";
import { DigitalTwinPanel } from "@/components/dashboard/DigitalTwinPanel";
import { 
  Truck, 
  Crosshair, 
  Fuel, 
  ArrowUpRight, 
  Package,
  Wrench
} from "lucide-react";

export function LogisticsView() {
  const activeStation = useStationStore((s) => s.activeStation);
  const selectedAssetId = useStationStore((s) => s.selectedAssetId);
  const setSelectedAsset = useStationStore((s) => s.setSelectedAsset);
  const requestAssetFocus = useStationStore((s) => s.requestAssetFocus);

  const stationMeta = STATIONS[activeStation];
  const { kpis, assets: logisticsAssets } = getStationLogistics(activeStation);

  const handleFocus = (assetId: string) => {
    setSelectedAsset(assetId);
    requestAssetFocus(assetId);
  };

  return (
    <div className="flex-1 flex flex-col gap-4 font-mono select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-mono font-medium border-cyan-500/30 bg-cyan-950/60 text-cyan-300">
              POLAR SUPPLY & FLEET
            </span>
            <span className="text-xs text-slate-400">
              {stationMeta.name} EXPEDITION LOGISTICS & POL RESERVES
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 uppercase mt-1 flex items-center gap-2">
            <Truck className="w-5 h-5 text-cyan-400" />
            <span>LOGISTICS & FLEET TELEMETRY</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/[0.08] flex items-center gap-2">
            <Fuel className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">RESERVE:</span>
            <span className="text-slate-100 font-bold">{kpis.fuelReserveDays} Days Remaining</span>
          </div>

          <Link
            href="/inventory"
            className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Package className="w-3.5 h-3.5 text-cyan-400" />
            <span>INVENTORY</span>
            <ArrowUpRight className="w-3 h-3 text-cyan-400" />
          </Link>

          <Link
            href="/maintenance"
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            <span>MAINTENANCE</span>
            <ArrowUpRight className="w-3 h-3 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Main split: 3D Twin Viewport in Logistics Mode + Asset cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[500px]">
        <div className="lg:col-span-8 flex flex-col min-h-[420px] rounded-2xl overflow-hidden">
          <DigitalTwinPanel />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-2.5 overflow-y-auto max-h-[600px] pr-1">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>SUPPLY & FLEET ASSETS ({logisticsAssets.length})</span>
            <span className="text-[10px] text-slate-400">CLICK TO LOCATE</span>
          </div>

          {logisticsAssets.map((asset) => {
            const isFocused = selectedAssetId === asset.assetId;
            return (
              <div
                key={asset.assetId}
                className={`p-3 rounded-xl border transition-all flex flex-col gap-2 ${
                  isFocused
                    ? "bg-cyan-950/70 border-cyan-500 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                    : "bg-[#080d16]/90 border-white/[0.08] hover:border-slate-700 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{asset.name}</span>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    asset.status === "CRITICAL" ? "bg-rose-950 text-rose-300 border border-rose-700" :
                    asset.status === "WARNING" ? "bg-amber-950 text-amber-300 border border-amber-700" :
                    asset.status === "OFFLINE" ? "bg-slate-800 text-slate-400 border border-slate-700" :
                    "bg-emerald-950 text-emerald-300 border border-emerald-700"
                  }`}>
                    {asset.status}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 leading-relaxed">
                  {asset.recommendedAction || "Operating within nominal expedition parameters."}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <span className="text-[9px] text-slate-400">{asset.assetId} • {asset.locationZone}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleFocus(asset.assetId)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer border ${
                        isFocused
                          ? "bg-cyan-950 text-cyan-200 border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.25)]"
                          : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-white/[0.08]"
                      }`}
                    >
                      <Crosshair className="w-3 h-3 text-cyan-400 mr-0.5" />
                      {isFocused ? "LOCKED" : "LOCATE"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
