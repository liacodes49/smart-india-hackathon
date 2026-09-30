"use client";

import React from "react";
import Link from "next/link";
import { useStationStore } from "@/stores/useStationStore";
import { KpiCardGrid } from "./KpiCardGrid";
import { DigitalTwinPanel } from "./DigitalTwinPanel";
import { StationHealthPanel } from "./StationHealthPanel";
import { AssetTelemetryPanel } from "./AssetTelemetryPanel";
import { AlertTriangle, ArrowRight, ShieldAlert } from "lucide-react";

export function CommandCentrePage() {
  const activeStation = useStationStore((s) => s.activeStation);
  const activeAlertCount = useStationStore((s) => s.activeAlertCount);
  const criticalAlertCount = useStationStore((s) => s.criticalAlertCount);

  return (
    <div className="flex-1 flex flex-col gap-3.5 h-full min-h-0 select-none">
      {/* Real-time Alert Notification Banner */}
      {activeAlertCount > 0 && (
        <div
          className={`flex items-center justify-between px-4 py-2.5 rounded-xl border font-mono text-xs backdrop-blur-md transition-all ${
            criticalAlertCount > 0
              ? "bg-rose-950/40 border-rose-500/60 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.25)] animate-pulse"
              : "bg-amber-950/40 border-amber-500/50 text-amber-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {criticalAlertCount > 0 ? (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="font-bold">
              [{activeStation}] {activeAlertCount} ACTIVE ALERT{activeAlertCount > 1 ? "S" : ""} DETECTED
              {criticalAlertCount > 0 && ` (${criticalAlertCount} CRITICAL)`}
            </span>
            <span className="text-slate-400 hidden sm:inline">— Operator attention required</span>
          </div>

          <Link
            href="/alerts"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/40 hover:bg-black/60 border border-white/[0.1] text-xs font-bold uppercase transition-all cursor-pointer shrink-0"
          >
            <span>Inspect Alerts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 1. Top KPI Telemetry Strip */}
      <KpiCardGrid />

      {/* 2. Main Dashboard Split: Dominant 3D Viewport + Secondary Diagnostics Dock */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3.5 min-h-0">
        {/* Dominant Digital Twin Container */}
        <div className="flex-1 min-w-0 flex flex-col">
          <DigitalTwinPanel />
        </div>

        {/* Secondary Information Dock: Station Health & Asset Telemetry */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col gap-3.5">
          <StationHealthPanel />
          <AssetTelemetryPanel />
        </div>
      </div>
    </div>
  );
}