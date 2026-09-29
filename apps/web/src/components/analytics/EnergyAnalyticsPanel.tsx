"use client";

import React, { useState } from "react";
import { EnergyAnalytics, TimeframeOption } from "@/features/analytics/types";
import { SvgAreaChart } from "./charts/SvgAreaChart";
import { Zap, ShieldCheck, Sun, Flame } from "lucide-react";

interface EnergyAnalyticsPanelProps {
  energy: EnergyAnalytics;
  stationName: string;
}

const TIMEFRAMES: TimeframeOption[] = ["24H", "7D", "30D", "90D"];

export function EnergyAnalyticsPanel({ energy, stationName }: EnergyAnalyticsPanelProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>("24H");

  const currentSeries = energy.history[selectedTimeframe] || [];
  const chartData = currentSeries.map((item) => ({
    timestamp: item.timestamp,
    primaryValue: item.demandKw,
    secondaryValue: item.generationKw,
    extraValue: item.dieselKw,
  }));

  return (
    <section
      aria-label="Energy Analytics"
      className="p-4 rounded-2xl border border-white/[0.08] bg-[#080d16]/90 backdrop-blur-md font-mono select-none flex flex-col gap-3.5"
    >
      {/* Header: Title, Station tag, Timeframe Filter Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              2. ENERGY ANALYTICS — [{stationName}]
            </h3>
            <p className="text-[10px] text-slate-400">
              Microgrid Power Generation vs Electrical Demand Load
            </p>
          </div>
        </div>

        {/* Timeframe Filter Tabs: 24H / 7D / 30D / 90D */}
        <div
          className="flex items-center p-0.5 rounded-lg bg-[#040810] border border-white/[0.08]"
          role="tablist"
          aria-label="Energy Timeframe Selector"
        >
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              type="button"
              role="tab"
              aria-selected={selectedTimeframe === tf}
              onClick={() => setSelectedTimeframe(tf)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                selectedTimeframe === tf
                  ? "bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Top Stat Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-white/[0.04] flex flex-col justify-between">
          <span className="text-[10px] text-slate-400">Current Demand</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-base font-bold text-cyan-400">
              {energy.currentDemandKw} kW
            </span>
            <span className="text-[9.5px] text-slate-400">load</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-white/[0.04] flex flex-col justify-between">
          <span className="text-[10px] text-slate-400">Active Generation</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-base font-bold text-emerald-400">
              {energy.currentGenerationKw} kW
            </span>
            <span className="text-[9.5px] text-emerald-500/80 font-semibold">
              +{energy.reserveHeadroomKw} kW margin
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-white/[0.04] flex flex-col justify-between">
          <span className="text-[10px] text-slate-400">Peak Demand Recorded</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-base font-bold text-rose-400">
              {energy.peakDemandKw} kW
            </span>
            <span className="text-[9px] text-slate-400">@{energy.peakDemandTime}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-white/[0.04] flex flex-col justify-between">
          <span className="text-[10px] text-slate-400">Energy Trend ({selectedTimeframe})</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`text-base font-bold ${
                energy.trendPercentage > 0 ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {energy.trendPercentage > 0 ? "+" : ""}
              {energy.trendPercentage}%
            </span>
            <span className="text-[9px] text-slate-400">vs historical</span>
          </div>
        </div>
      </div>

      {/* Main SVG Area Chart */}
      <div className="p-3 rounded-xl bg-slate-950/80 border border-white/[0.05] relative">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[10.5px] text-slate-400 mb-2 px-1">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-cyan-400 rounded-full" />
              <span className="text-cyan-200 font-semibold">Power Demand (kW)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-400 rounded-full" />
              <span className="text-emerald-200 font-semibold">Power Generation (kW)</span>
            </div>
            <div className="flex items-center gap-1.5 hidden sm:flex">
              <span className="w-3 h-0.5 border-b-2 border-dashed border-rose-500" />
              <span className="text-rose-400">Peak Threshold</span>
            </div>
          </div>
          <span className="text-[9.5px] text-slate-400">
            Hover points to inspect exact telemetry
          </span>
        </div>

        <SvgAreaChart
          data={chartData}
          primaryLabel="Demand"
          secondaryLabel="Generation"
          primaryColor="#06b6d4"
          secondaryColor="#10b981"
          unit="kW"
          height={220}
          peakThreshold={energy.peakDemandKw}
          peakLabel="Peak Spike"
        />
      </div>

      {/* Energy Mix Breakdown & Microgrid Health Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-[10.5px]">
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-white/[0.04]">
          <Flame className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-slate-400 block text-[9.5px]">PRIMARY DIESEL SOURCE</span>
            <span className="text-slate-200 font-semibold">
              Genset 01 & 02 Synchronized ({Math.round(energy.currentDemandKw * 0.88)} kW)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-white/[0.04]">
          <Sun className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-slate-400 block text-[9.5px]">RENEWABLE / BESS ASSIST</span>
            <span className="text-slate-200 font-semibold">
              Polar Solar & Wind Hybrid ({Math.round(energy.currentDemandKw * 0.12)} kW)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-white/[0.04]">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-slate-400 block text-[9.5px]">MICROGRID STABILITY</span>
            <span className="text-emerald-300 font-semibold">
              Nominal 50.04 Hz ±0.03 | PF 0.94 Lagging
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
