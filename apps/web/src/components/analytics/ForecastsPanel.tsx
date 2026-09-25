"use client";

import React, { useState } from "react";
import { ForecastData, ForecastItem } from "@/features/analytics/types";
import { SvgAreaChart } from "./charts/SvgAreaChart";
import {
  TrendingUp,
  Zap,
  Fuel,
  Gauge,
  Thermometer,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from "lucide-react";

interface ForecastsPanelProps {
  forecasts: ForecastData;
  stationName: string;
}

type ForecastKey = "powerDemand" | "fuelReserve" | "generatorLoad" | "temperature";

export function ForecastsPanel({ forecasts, stationName }: ForecastsPanelProps) {
  const [activeTab, setActiveTab] = useState<ForecastKey>("powerDemand");

  const forecastConfigs: Record<
    ForecastKey,
    {
      label: string;
      item: ForecastItem;
      icon: React.ComponentType<{ className?: string }>;
      color: string;
    }
  > = {
    powerDemand: {
      label: "Power Demand",
      item: forecasts.powerDemand,
      icon: Zap,
      color: "#06b6d4",
    },
    fuelReserve: {
      label: "Fuel Reserve",
      item: forecasts.fuelReserve,
      icon: Fuel,
      color: "#3b82f6",
    },
    generatorLoad: {
      label: "Generator Load",
      item: forecasts.generatorLoad,
      icon: Gauge,
      color: "#f59e0b",
    },
    temperature: {
      label: "Temperature",
      item: forecasts.temperature,
      icon: Thermometer,
      color: "#38bdf8",
    },
  };

  const current = forecastConfigs[activeTab];
  const chartData = current.item.series.map((pt) => ({
    timestamp: pt.timeOffset,
    primaryValue: pt.predicted,
    secondaryValue: pt.upperBound,
  }));

  return (
    <section
      aria-label="Predictive Forecasts"
      className="p-4 rounded-2xl border border-white/[0.08] bg-[#080d16]/90 backdrop-blur-md font-mono select-none flex flex-col gap-3.5"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              7. PREDICTIVE FORECASTS & ML PROJECTIONS — [{stationName}]
            </h3>
            <p className="text-[10px] text-slate-400">
              Time-Series Extrapolations with 95% Bayesian Confidence Intervals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-[9.5px] text-cyan-300">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Antarctic Neural Forecaster v2.4</span>
        </div>
      </div>

      {/* 4 Forecast Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {(Object.keys(forecastConfigs) as ForecastKey[]).map((key) => {
          const cfg = forecastConfigs[key];
          const Icon = cfg.icon;
          const isSelected = activeTab === key;
          const isRising = cfg.item.trendDirection === "UP";

          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 ${
                isSelected
                  ? "bg-cyan-950/70 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                  : "bg-slate-950/60 border-white/[0.06] hover:bg-slate-900 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider truncate ${
                    isSelected ? "text-cyan-300" : "text-slate-400"
                  }`}
                >
                  {cfg.label}
                </span>
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isSelected ? "text-cyan-400" : "text-slate-500"
                  }`}
                />
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-white">
                    {cfg.item.projectedValue} {cfg.item.unit}
                  </span>
                  <span
                    className={`text-[10px] font-semibold flex items-center ${
                      isRising ? "text-amber-400" : "text-emerald-400"
                    }`}
                  >
                    {isRising ? (
                      <ArrowUpRight className="w-3 h-3 inline" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 inline" />
                    )}
                    {cfg.item.horizon}
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 block truncate mt-0.5">
                  Confidence: {cfg.item.confidencePercent}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Forecast Chart & Explanation Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* Left 8 cols: Forecast Curve */}
        <div className="lg:col-span-8 p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.05] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-xs font-bold text-slate-200">
                {current.item.title}
              </h4>
              <span className="text-[9.5px] text-slate-400">
                Predicted Trajectory vs Upper Bound Ceiling
              </span>
            </div>
            <span className="text-[9.5px] text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
              Horizon: {current.item.horizon}
            </span>
          </div>

          <SvgAreaChart
            data={chartData}
            primaryLabel="Predicted"
            secondaryLabel="Upper Bound"
            primaryColor={current.color}
            secondaryColor="#64748b"
            unit={current.item.unit}
            height={190}
          />
        </div>

        {/* Right 4 cols: ML Analysis & Operational Advisory */}
        <div className="lg:col-span-4 p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.05] flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 pb-2 border-b border-white/[0.06]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <h4 className="text-xs font-bold text-slate-200">Model Inference Summary</h4>
            </div>

            <div className="mt-3 space-y-2.5 text-[10.5px]">
              <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20 leading-relaxed text-slate-200">
                {current.item.summary}
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-white/[0.04]">
                <span className="text-slate-400">Baseline Telemetry:</span>
                <span className="font-bold text-slate-200">
                  {current.item.currentValue} {current.item.unit}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-white/[0.04]">
                <span className="text-slate-400">Projected Peak / Dip:</span>
                <span className="font-bold text-cyan-300">
                  {current.item.projectedValue} {current.item.unit}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-white/[0.04]">
                <span className="text-slate-400">Prediction Certainty:</span>
                <span className="font-bold text-emerald-400">
                  {current.item.confidencePercent}%
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.04] text-[9px] text-slate-400 leading-relaxed">
            Inference model refreshes upon arrival of each hourly synoptic weather report.
          </div>
        </div>
      </div>
    </section>
  );
}
