"use client";

import React from "react";
import { MaitriVsBharatiComparison } from "@/features/analytics/types";
import {
  Scale,
  Zap,
  Cpu,
  Fuel,
  Clock,
  Gauge,
  Thermometer,
  Activity,
  ShieldAlert,
  ArrowRightLeft,
} from "lucide-react";

interface StationComparisonPanelProps {
  comparison: MaitriVsBharatiComparison;
  isExpandedOnly?: boolean;
}

export function StationComparisonPanel({
  comparison,
  isExpandedOnly = false,
}: StationComparisonPanelProps) {
  const getIconForMetric = (key: string) => {
    switch (key) {
      case "powerDemand":
        return Zap;
      case "powerGeneration":
        return Cpu;
      case "fuelReserve":
        return Fuel;
      case "fuelDaysRemaining":
        return Clock;
      case "generatorLoad":
        return Gauge;
      case "temperature":
        return Thermometer;
      case "stationHealth":
        return Activity;
      case "riskLevel":
        return ShieldAlert;
      default:
        return ArrowRightLeft;
    }
  };

  return (
    <section
      aria-label="Maitri vs Bharati Comparison"
      className="p-4 rounded-2xl border border-cyan-500/30 bg-[#070e1b]/95 backdrop-blur-md font-mono select-none flex flex-col gap-3.5 shadow-[0_0_25px_rgba(6,182,212,0.1)]"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
            <Scale className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-cyan-200">
              8. MAITRI VS BHARATI — COMPARATIVE FLEET ANALYTICS
            </h3>
            <p className="text-[10px] text-slate-400">
              Dual-Station Benchmarking Across All 8 Critical Operational Telemetry Dimensions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isExpandedOnly && (
            <span className="text-[9.5px] px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-bold">
              SPOTLIGHT DUAL MODE
            </span>
          )}
          <span className="text-[10px] px-2.5 py-1 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-bold">
            DUAL TELEMETRY BUS ACTIVE
          </span>
        </div>
      </div>

      {/* Summary Narrative Banner */}
      <div className="p-3 rounded-xl bg-slate-950/80 border border-white/[0.06] flex items-start gap-2.5 text-[11px] leading-relaxed">
        <ArrowRightLeft className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-200">Fleet Operations Comparison: </span>
          <span className="text-slate-300">{comparison.summaryNote}</span>
        </div>
      </div>

      {/* Station Headers for Comparison Grid */}
      <div className="grid grid-cols-12 gap-2 text-xs font-bold uppercase tracking-wider border-b border-white/[0.06] pb-2 text-slate-400 px-2">
        <div className="col-span-4 sm:col-span-3">METRIC</div>
        <div className="col-span-3 sm:col-span-3 text-cyan-300 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>MAITRI (70°S)</span>
        </div>
        <div className="col-span-3 sm:col-span-3 text-emerald-300 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>BHARATI (69°S)</span>
        </div>
        <div className="col-span-2 sm:col-span-3 text-right hidden sm:block">
          OPERATIONAL DELTA
        </div>
      </div>

      {/* 8 Comparative Rows */}
      <div className="space-y-2">
        {comparison.metrics.map((item) => {
          const Icon = getIconForMetric(item.key);

          // Calculate normalized percentage bar for visual comparison
          const maxVal = Math.max(
            Math.abs(item.maitriNumeric),
            Math.abs(item.bharatiNumeric)
          );
          const maitriPercent = maxVal ? (Math.abs(item.maitriNumeric) / maxVal) * 100 : 50;
          const bharatiPercent = maxVal ? (Math.abs(item.bharatiNumeric) / maxVal) * 100 : 50;

          return (
            <div
              key={item.key}
              className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.04] hover:border-cyan-500/30 transition-colors"
            >
              <div className="grid grid-cols-12 gap-2 items-center text-xs">
                {/* Metric Name */}
                <div className="col-span-4 sm:col-span-3 flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="font-bold text-slate-200 text-[11px] truncate">
                    {item.metric}
                  </span>
                </div>

                {/* Maitri Value */}
                <div className="col-span-4 sm:col-span-3">
                  <span className="font-bold text-cyan-300 text-xs sm:text-sm">
                    {item.maitriValue}
                  </span>
                  {/* Visual Bar */}
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1 max-w-[140px]">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${maitriPercent}%` }}
                    />
                  </div>
                </div>

                {/* Bharati Value */}
                <div className="col-span-4 sm:col-span-3">
                  <span className="font-bold text-emerald-300 text-xs sm:text-sm">
                    {item.bharatiValue}
                  </span>
                  {/* Visual Bar */}
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1 max-w-[140px]">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${bharatiPercent}%` }}
                    />
                  </div>
                </div>

                {/* Delta Commentary */}
                <div className="col-span-12 sm:col-span-3 text-[10px] text-slate-400 sm:text-right mt-1 sm:mt-0 leading-tight">
                  <span className="text-slate-300 font-medium">
                    {item.deltaText}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[9.5px] text-slate-400">
        <span>Cross-station telemetry synchronized over encrypted GSAT Satellite Trunk</span>
        <span className="text-cyan-400 font-semibold">{comparison.lastSyncTime}</span>
      </div>
    </section>
  );
}
