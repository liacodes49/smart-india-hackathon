"use client";

import React from "react";
import { useStationStore } from "@/stores/useStationStore";
import { useLiveTelemetry } from "@/lib/hooks/useLiveTelemetry";
import { STATIONS } from "@repo/shared/constants";
import { MapPin, Activity, Thermometer, Zap, Satellite } from "lucide-react";

export function StationStatusHeader() {
  const activeStation = useStationStore((s) => s.activeStation);
  const stationMeta = STATIONS[activeStation];
  const { telemetry, environment, edgeStatus, stationHealthScore, stationStatus } =
    useLiveTelemetry(activeStation);

  const totalPower = telemetry.reduce((acc, t) => acc + (t.power || 0), 0) || 68.5;
  const temp = environment?.ambientTemperatureC ?? -28.0;

  return (
    <div className="fixed top-14 left-0 right-0 h-10 bg-[#070b14]/92 backdrop-blur-md border-b border-white/[0.06] z-30 flex items-center justify-between px-3 sm:px-5 select-none font-mono text-xs">
      {/* Left: Station Identity, Coordinates, and Base Operational Status */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-slate-100 tracking-wide uppercase">
            <span className="text-cyan-400 mr-1.5">[{activeStation}]</span>
            <span>{stationMeta.name}</span>
          </span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="text-slate-400 text-[11px] hidden md:flex items-center gap-1">
            <MapPin className="w-3 h-3 text-cyan-400" />
            <span>
              {stationMeta.latitude}°S, {stationMeta.longitude}°E ({stationMeta.altitude}m ASL)
            </span>
          </span>
        </div>

        {/* Status Badge from Shared Types */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase">STATUS:</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 font-semibold uppercase">
            {stationStatus || "OPERATIONAL"}
          </span>
        </div>
      </div>

      {/* Right: Live Telemetry Channels */}
      <div className="flex items-center gap-3 sm:gap-4 text-[11px]">
        {/* Ambient Temperature */}
        <div className="hidden lg:flex items-center gap-1.5 text-slate-300" title="Ambient meteorological telemetry">
          <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">TEMP:</span>
          <span className="font-bold text-cyan-300">{temp.toFixed(1)}°C</span>
        </div>

        {/* Power Generation */}
        <div className="hidden md:flex items-center gap-1.5 text-slate-300" title="Primary microgrid power telemetry">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">POWER:</span>
          <span className="font-bold text-amber-300">{totalPower.toFixed(1)} kW</span>
        </div>

        {/* Station Health Index */}
        <div className="flex items-center gap-1.5 text-slate-300" title="Composite multi-domain health index">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">HEALTH:</span>
          <span className="font-bold text-emerald-300">{stationHealthScore}%</span>
        </div>

        {/* Comms Link Status */}
        <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-800 text-slate-300">
          <Satellite className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">SATCOM:</span>
          <span className={`font-bold ${edgeStatus === "ONLINE" ? "text-emerald-300" : "text-amber-300"}`}>
            {edgeStatus}
          </span>
        </div>
      </div>
    </div>
  );
}
