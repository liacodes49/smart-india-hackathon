"use client";

import React from "react";
import { AnalyticsKpi } from "@/features/analytics/types";
import {
  Zap,
  Activity,
  Fuel,
  Clock,
  Thermometer,
  ShieldAlert,
  Gauge,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface AnalyticsKpiOverviewProps {
  kpi: AnalyticsKpi;
  stationName: string;
}

export function AnalyticsKpiOverview({ kpi, stationName }: AnalyticsKpiOverviewProps) {
  const cards = [
    {
      id: "power-demand",
      label: "Power Demand",
      value: `${kpi.powerDemandKw} kW`,
      sublabel: "Microgrid Load",
      delta: `${kpi.powerDemandDelta > 0 ? "+" : ""}${kpi.powerDemandDelta}%`,
      isPositiveTrend: kpi.powerDemandDelta <= 0, // Lower demand is better
      icon: Zap,
      accentColor: "text-amber-400",
      borderColor: "border-amber-500/20",
    },
    {
      id: "power-gen",
      label: "Power Generation",
      value: `${kpi.powerGenerationKw} kW`,
      sublabel: "Active Capacity",
      delta: `${kpi.powerGenerationDelta > 0 ? "+" : ""}${kpi.powerGenerationDelta}%`,
      isPositiveTrend: true,
      icon: Cpu,
      accentColor: "text-emerald-400",
      borderColor: "border-emerald-500/20",
    },
    {
      id: "fuel-remaining",
      label: "Fuel Remaining",
      value: `${(kpi.fuelRemainingLitres / 1000).toFixed(1)}k L`,
      sublabel: `${kpi.fuelRemainingPercent}% Total Capacity`,
      delta: `${kpi.fuelRemainingPercent}% Full`,
      isPositiveTrend: kpi.fuelRemainingPercent > 60,
      icon: Fuel,
      accentColor: "text-cyan-400",
      borderColor: "border-cyan-500/20",
    },
    {
      id: "fuel-days",
      label: "Fuel Days Remaining",
      value: `${kpi.fuelDaysRemaining} Days`,
      sublabel: "Autonomous Burn",
      delta: `${kpi.fuelDaysDelta > 0 ? "+" : ""}${kpi.fuelDaysDelta}d vs Target`,
      isPositiveTrend: kpi.fuelDaysRemaining > 60,
      icon: Clock,
      accentColor: "text-blue-400",
      borderColor: "border-blue-500/20",
    },
    {
      id: "gen-load",
      label: "Generator Load",
      value: `${kpi.generatorLoadPercent}%`,
      sublabel: "Running Sets Avg",
      delta: `${kpi.generatorLoadDelta > 0 ? "+" : ""}${kpi.generatorLoadDelta}%`,
      isPositiveTrend: kpi.generatorLoadPercent < 80,
      icon: Gauge,
      accentColor: kpi.generatorLoadPercent > 80 ? "text-amber-400" : "text-cyan-400",
      borderColor: kpi.generatorLoadPercent > 80 ? "border-amber-500/30" : "border-cyan-500/20",
    },
    {
      id: "temperature",
      label: "Ambient Temperature",
      value: `${kpi.temperatureC}°C`,
      sublabel: "Katabatic Chill",
      delta: `${kpi.temperatureDelta > 0 ? "+" : ""}${kpi.temperatureDelta}°C`,
      isPositiveTrend: kpi.temperatureDelta >= 0,
      icon: Thermometer,
      accentColor: "text-sky-300",
      borderColor: "border-sky-500/20",
    },
    {
      id: "station-health",
      label: "Station Health",
      value: `${kpi.stationHealthScore}/100`,
      sublabel: "Multi-Domain Index",
      delta: `${kpi.stationHealthDelta > 0 ? "+" : ""}${kpi.stationHealthDelta} pts`,
      isPositiveTrend: kpi.stationHealthDelta >= 0,
      icon: Activity,
      accentColor: "text-emerald-400",
      borderColor: "border-emerald-500/20",
    },
    {
      id: "risk-level",
      label: "Risk Level",
      value: kpi.riskLevel,
      sublabel: `Score: ${kpi.riskScore}/100`,
      delta: kpi.riskLevel === "LOW" ? "Optimal" : kpi.riskLevel === "MODERATE" ? "Guarded" : "Elevated",
      isPositiveTrend: kpi.riskLevel === "LOW",
      icon: ShieldAlert,
      accentColor:
        kpi.riskLevel === "LOW"
          ? "text-emerald-400"
          : kpi.riskLevel === "MODERATE"
          ? "text-amber-400"
          : "text-rose-400",
      borderColor:
        kpi.riskLevel === "LOW"
          ? "border-emerald-500/30"
          : kpi.riskLevel === "MODERATE"
          ? "border-amber-500/30"
          : "border-rose-500/30",
    },
  ];

  return (
    <section aria-label="KPI Overview" className="w-full font-mono select-none">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            1. KPI OVERVIEW — [{stationName}]
          </h2>
        </div>
        <span className="text-[10px] text-slate-400">
          Telemetry Bus Active (1-sec cycle)
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.id}
              className={`flex flex-col justify-between p-3 rounded-xl bg-[#080d16]/90 border ${c.borderColor} backdrop-blur-md transition-all duration-200 hover:border-cyan-500/40 hover:bg-[#0c1322] shadow-sm`}
            >
              {/* Header: Label & Icon */}
              <div className="flex items-start justify-between gap-1">
                <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider leading-tight truncate">
                  {c.label}
                </span>
                <Icon className={`w-3.5 h-3.5 ${c.accentColor} shrink-0 mt-0.5`} />
              </div>

              {/* Main Metric Value */}
              <div className="my-2">
                <div className={`text-base sm:text-lg font-bold tracking-tight ${c.accentColor}`}>
                  {c.value}
                </div>
                <div className="text-[9px] text-slate-400 truncate mt-0.5">
                  {c.sublabel}
                </div>
              </div>

              {/* Footer: Trend Delta */}
              <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.04] text-[9px]">
                <span className="text-slate-400 truncate">Trend</span>
                <span
                  className={`flex items-center font-semibold ${
                    c.isPositiveTrend ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {c.isPositiveTrend ? (
                    <ArrowUpRight className="w-2.5 h-2.5 mr-0.5 inline" />
                  ) : (
                    <ArrowDownRight className="w-2.5 h-2.5 mr-0.5 inline" />
                  )}
                  {c.delta}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
