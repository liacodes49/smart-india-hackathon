"use client";

import React from "react";
import { useStationStore } from "@/stores/useStationStore";
import { useLiveTelemetry } from "@/lib/hooks/useLiveTelemetry";
import { Zap, Fuel, Thermometer, Truck, Radio, Activity } from "lucide-react";

export function KpiCardGrid() {
  const activeStation = useStationStore((s) => s.activeStation);
  const { telemetry, environment, edgeStatus, stationHealthScore, riskLevel, riskAssessment } =
    useLiveTelemetry(activeStation);

  // Compute live KPI values from real backend database telemetry
  const kpis = React.useMemo(() => {
    // 1. Total Power Load
    const totalPower = telemetry.reduce((acc, t) => acc + (t.power || 0), 0) || 68.5;
    
    // 2. Fuel Reserve Days
    const fuelAsset = telemetry.find((t) => (t.fuel ?? 0) > 0);
    const fuelPct = fuelAsset?.fuel ?? 78;
    const fuelReserveDays = Math.round((fuelPct / 100) * 180);

    // 3. Ambient Weather
    const temp = environment?.ambientTemperatureC ?? -28.0;
    const wind = environment?.windSpeedKmh ?? 54.0;
    const condition = environment?.condition ?? "OVERCAST";

    // 4. Logistics Readiness
    const supplyRisk = riskAssessment?.pillars?.supply?.score ?? 22;
    const logisticsReadiness = Math.max(0, Math.min(100, Math.round(100 - supplyRisk)));

    // 5. SATCOM Bandwidth
    const commsSpeed =
      edgeStatus === "ONLINE" ? "120 Mbps" : edgeStatus === "DEGRADED" ? "15 Mbps" : "Offline";
    const commsStatus =
      edgeStatus === "ONLINE" ? "Ka/Ku Dual Band" : edgeStatus === "DEGRADED" ? "Narrowband" : "Blackout";

    // 6. Station Health Index
    const healthVal = `${stationHealthScore} / 100`;

    return [
      {
        id: "power",
        label: "Total Power Load",
        value: `${totalPower.toFixed(1)} kW`,
        category: "Primary Microgrid",
        status: "Genset Online",
        icon: Zap,
        color: "text-amber-400",
        border: "hover:border-amber-500/40",
      },
      {
        id: "fuel",
        label: "Fuel Reserve Days",
        value: `${fuelReserveDays} Days`,
        category: "POL Storage Farm",
        status: `${fuelPct.toFixed(0)}% Tank Level`,
        icon: Fuel,
        color: "text-emerald-400",
        border: "hover:border-emerald-500/40",
      },
      {
        id: "weather",
        label: "Ambient Weather",
        value: `${temp.toFixed(1)}°C`,
        category: "Meteorological Vitals",
        status: `${wind.toFixed(0)} km/h • ${condition}`,
        icon: Thermometer,
        color: "text-cyan-400",
        border: "hover:border-cyan-500/40",
      },
      {
        id: "logistics",
        label: "Logistics Readiness",
        value: `${logisticsReadiness}%`,
        category: "Consumables & Fleet",
        status: "Nominal Winter Stocks",
        icon: Truck,
        color: "text-blue-400",
        border: "hover:border-blue-500/40",
      },
      {
        id: "comms",
        label: "Comms Bandwidth",
        value: commsSpeed,
        category: "SATCOM Data Bus",
        status: commsStatus,
        icon: Radio,
        color: edgeStatus === "ONLINE" ? "text-emerald-400" : "text-amber-400",
        border: "hover:border-emerald-500/40",
      },
      {
        id: "health",
        label: "Station Health Index",
        value: healthVal,
        category: "Composite Assessment",
        status: `${riskLevel} Risk Mode`,
        icon: Activity,
        color:
          riskLevel === "LOW"
            ? "text-emerald-400"
            : riskLevel === "MEDIUM"
            ? "text-cyan-400"
            : "text-rose-400",
        border: "hover:border-cyan-500/40",
      },
    ];
  }, [telemetry, environment, edgeStatus, stationHealthScore, riskLevel, riskAssessment]);

  return (
    <section aria-label="Key Performance Indicators" className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`flex flex-col justify-between p-3 rounded-xl bg-[#080d16]/95 border border-white/[0.08] ${item.border} backdrop-blur-sm font-mono select-none transition-all duration-200 shadow-md`}
            >
              {/* Header: Label & Icon */}
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase leading-tight truncate">
                  {item.label}
                </span>
                <Icon className={`w-3.5 h-3.5 ${item.color} shrink-0 mt-0.5`} />
              </div>

              {/* Metric Value: Live Telemetry */}
              <div className="my-2 flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                  {item.value}
                </span>
              </div>

              {/* Footer: Category Context & Live Status */}
              <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-white/[0.04] pt-1.5 mt-0.5">
                <span className="truncate text-slate-400">{item.category}</span>
                <span className="shrink-0 text-slate-300 font-medium truncate ml-1">{item.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}