"use client";

import React, { useState } from "react";
import {
  CurrentVsSimulatedState,
  GeneratorUnitComparison,
} from "@/features/simulation/types";
import {
  Zap,
  Activity,
  Fuel,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Gauge,
} from "lucide-react";

interface CurrentVsSimulatedProps {
  stateComparison: CurrentVsSimulatedState;
  stationName: string;
}

export function CurrentVsSimulatedCard({
  stateComparison,
  stationName,
}: CurrentVsSimulatedProps) {
  const [showGenBreakdown, setShowGenBreakdown] = useState<boolean>(true);
  const [showHealthBreakdown, setShowHealthBreakdown] = useState<boolean>(false);

  const {
    powerDemand,
    generatorLoad,
    fuelConsumption,
    fuelReserve,
    stationHealth,
    riskLevel,
  } = stateComparison;

  // Helper for status badge styling
  const getStatusBadge = (status: "nominal" | "warning" | "critical" | "improved") => {
    switch (status) {
      case "critical":
        return "bg-rose-950/80 text-rose-300 border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.2)]";
      case "warning":
        return "bg-amber-950/80 text-amber-300 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
      case "improved":
        return "bg-cyan-950/80 text-cyan-300 border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]";
      default:
        return "bg-emerald-950/80 text-emerald-300 border-emerald-500/60";
    }
  };

  // Helper for Risk Level pill badge styling
  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "EMERGENCY":
      case "CRITICAL":
        return "bg-rose-950 text-rose-200 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.35)]";
      case "HIGH":
        return "bg-orange-950 text-orange-200 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.35)]";
      case "MEDIUM":
      case "MODERATE":
        return "bg-amber-950 text-amber-200 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.25)]";
      default:
        return "bg-emerald-950 text-emerald-200 border-emerald-500/80";
    }
  };

  return (
    <div className="flex flex-col gap-3 font-mono">
      {/* ── Section Header ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-950/90 border border-cyan-500/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <span>CURRENT STATE vs SIMULATED STATE</span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                [{stationName}]
              </span>
            </h4>
            <p className="text-[10px] text-slate-400">
              Direct telemetry baseline comparison against simulated physical stress envelope
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
            <span>Current Telemetry</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block animate-pulse" />
            <span>Simulated Stress</span>
          </div>
        </div>
      </div>

      {/* ── 6-Metric Comparison Cards Grid ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {/* ── 1. Power Demand ───────────────────────────────────────── */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.08] hover:border-amber-500/40 transition-colors flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Power Demand
                </span>
                <span className="text-[9px] text-slate-400 block">Total Active Load</span>
              </div>
            </div>
            <span
              className={`text-[9.5px] px-2 py-0.5 rounded border font-bold uppercase ${getStatusBadge(
                powerDemand.status
              )}`}
            >
              {powerDemand.status}
            </span>
          </div>

          {/* Comparison Numbers */}
          <div className="flex items-center justify-between px-2 py-2.5 rounded-lg bg-slate-900/70 border border-white/[0.04]">
            <div className="text-left">
              <span className="text-[9px] text-slate-400 block uppercase font-medium">
                Current State
              </span>
              <span className="text-base sm:text-lg font-bold text-slate-300">
                {powerDemand.formattedCurrent}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <ArrowRight className="w-4 h-4 text-amber-400 animate-pulse" />
              <span
                className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded mt-0.5 flex items-center gap-0.5 ${
                  powerDemand.delta > 0
                    ? "text-amber-300 bg-amber-950/60"
                    : "text-emerald-300 bg-emerald-950/60"
                }`}
              >
                {powerDemand.delta > 0 ? (
                  <TrendingUp className="w-2.5 h-2.5" />
                ) : (
                  <TrendingDown className="w-2.5 h-2.5" />
                )}
                {powerDemand.delta > 0 ? "+" : ""}
                {powerDemand.delta} kW ({powerDemand.deltaPercent}%)
              </span>
            </div>

            <div className="text-right">
              <span className="text-[9px] text-amber-400 block uppercase font-bold">
                Simulated State
              </span>
              <span className="text-base sm:text-lg font-bold text-amber-300">
                {powerDemand.formattedSimulated}
              </span>
            </div>
          </div>

          {/* Load visual bar */}
          <div className="flex flex-col gap-1 text-[9.5px]">
            <div className="flex justify-between text-slate-400">
              <span>Transition:</span>
              <span className="text-amber-200 font-bold">{powerDemand.changeSummary}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden flex">
              <div
                className="h-full bg-slate-600 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (powerDemand.currentValue / Math.max(powerDemand.simulatedValue, 250)) * 100
                  )}%`,
                }}
                title={`Current: ${powerDemand.currentValue} kW`}
              />
              <div
                className="h-full bg-amber-400 transition-all duration-500 animate-pulse"
                style={{
                  width: `${Math.min(
                    100,
                    (Math.max(0, powerDemand.delta) /
                      Math.max(powerDemand.simulatedValue, 250)) *
                      100
                  )}%`,
                }}
                title={`Surge: +${powerDemand.delta} kW`}
              />
            </div>
          </div>
        </div>

        {/* ── 2. Generator Load (With Generator 02 highlighted) ─────── */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.08] hover:border-cyan-500/40 transition-colors flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Generator Load
                </span>
                <span className="text-[9px] text-slate-400 block">
                  Grid Capacity & Generator 02 Stress
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowGenBreakdown((prev) => !prev)}
              className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/[0.08] flex items-center gap-1 cursor-pointer"
            >
              <span>Units</span>
              {showGenBreakdown ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>

          {/* Comparison Numbers */}
          <div className="flex items-center justify-between px-2 py-2.5 rounded-lg bg-slate-900/70 border border-white/[0.04]">
            <div className="text-left">
              <span className="text-[9px] text-slate-400 block uppercase font-medium">
                Current Load
              </span>
              <span className="text-base sm:text-lg font-bold text-slate-300">
                {generatorLoad.formattedCurrent}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <ArrowRight className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span
                className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded mt-0.5 flex items-center gap-0.5 ${
                  generatorLoad.delta > 0
                    ? "text-rose-300 bg-rose-950/60"
                    : "text-emerald-300 bg-emerald-950/60"
                }`}
              >
                {generatorLoad.delta > 0 ? "+" : ""}
                {generatorLoad.delta}%
              </span>
            </div>

            <div className="text-right">
              <span className="text-[9px] text-cyan-400 block uppercase font-bold">
                Simulated Load
              </span>
              <span
                className={`text-base sm:text-lg font-bold ${
                  generatorLoad.simulatedValue > 88
                    ? "text-rose-400"
                    : generatorLoad.simulatedValue > 78
                    ? "text-amber-300"
                    : "text-cyan-300"
                }`}
              >
                {generatorLoad.formattedSimulated}
              </span>
            </div>
          </div>

          {/* Highlight Callout: Generator 02 load: 74% → 91% */}
          <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-[10px] flex items-center justify-between">
            <span className="text-slate-400 font-semibold">Generator 02 load:</span>
            <span className="font-bold text-cyan-200">
              {generatorLoad.changeSummary.replace("Generator 02 load: ", "")}
            </span>
          </div>

          {/* Unit Breakdown Expandable */}
          {showGenBreakdown && (
            <div className="space-y-1.5 pt-1 border-t border-white/[0.04] text-[9.5px]">
              {generatorLoad.generatorUnits.map((u: GeneratorUnitComparison) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-white/[0.02]"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        u.status === "ONLINE"
                          ? "bg-emerald-400"
                          : u.status === "OVERLOADED"
                          ? "bg-rose-400 animate-pulse"
                          : u.status === "TRIPPED"
                          ? "bg-rose-600"
                          : "bg-slate-500"
                      }`}
                    />
                    <span className="text-slate-300 font-semibold">{u.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{u.baselineLoadPercent}%</span>
                    <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
                    <span
                      className={`font-bold ${
                        u.simulatedLoadPercent > 88
                          ? "text-rose-400"
                          : u.simulatedLoadPercent > 75
                          ? "text-amber-400"
                          : "text-slate-200"
                      }`}
                    >
                      {u.simulatedLoadPercent}%
                    </span>
                    <span
                      className={`text-[8.5px] px-1 py-0.2 rounded uppercase ${
                        u.status === "OVERLOADED"
                          ? "bg-rose-950 text-rose-300 border border-rose-500/50"
                          : u.status === "TRIPPED"
                          ? "bg-rose-950 text-rose-300"
                          : u.status === "STANDBY"
                          ? "bg-slate-800 text-slate-400"
                          : "bg-emerald-950 text-emerald-300"
                      }`}
                    >
                      {u.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 3. Fuel Consumption ───────────────────────────────────── */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.08] hover:border-blue-500/40 transition-colors flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Fuel className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Fuel Consumption
                </span>
                <span className="text-[9px] text-slate-400 block">Daily POL Burn Rate</span>
              </div>
            </div>
            <span
              className={`text-[9.5px] px-2 py-0.5 rounded border font-bold uppercase ${getStatusBadge(
                fuelConsumption.status
              )}`}
            >
              {fuelConsumption.status}
            </span>
          </div>

          {/* Comparison Numbers */}
          <div className="flex items-center justify-between px-2 py-2.5 rounded-lg bg-slate-900/70 border border-white/[0.04]">
            <div className="text-left">
              <span className="text-[9px] text-slate-400 block uppercase font-medium">
                Current Burn
              </span>
              <span className="text-base sm:text-lg font-bold text-slate-300">
                {fuelConsumption.formattedCurrent}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <ArrowRight className="w-4 h-4 text-blue-400 animate-pulse" />
              <span
                className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded mt-0.5 flex items-center gap-0.5 ${
                  fuelConsumption.delta > 0
                    ? "text-rose-300 bg-rose-950/60"
                    : "text-emerald-300 bg-emerald-950/60"
                }`}
              >
                {fuelConsumption.delta > 0 ? "+" : ""}
                {fuelConsumption.delta.toLocaleString()} L ({fuelConsumption.deltaPercent}%)
              </span>
            </div>

            <div className="text-right">
              <span className="text-[9px] text-blue-400 block uppercase font-bold">
                Simulated Burn
              </span>
              <span className="text-base sm:text-lg font-bold text-blue-300">
                {fuelConsumption.formattedSimulated}
              </span>
            </div>
          </div>

          {/* Change Summary & Multiplier */}
          <div className="flex flex-col gap-1 text-[9.5px]">
            <div className="flex justify-between text-slate-400">
              <span>Rate Change:</span>
              <span className="text-blue-200 font-bold">{fuelConsumption.changeSummary}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden flex">
              <div
                className="h-full bg-slate-600"
                style={{
                  width: `${Math.min(
                    100,
                    (fuelConsumption.currentValue / Math.max(fuelConsumption.simulatedValue, 3000)) *
                      100
                  )}%`,
                }}
              />
              <div
                className="h-full bg-blue-500 animate-pulse"
                style={{
                  width: `${Math.min(
                    100,
                    (Math.max(0, fuelConsumption.delta) /
                      Math.max(fuelConsumption.simulatedValue, 3000)) *
                      100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* ── 4. Fuel Reserve (42 days → 34 days) ───────────────────── */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.08] hover:border-indigo-500/40 transition-colors flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Fuel Reserve
                </span>
                <span className="text-[9px] text-slate-400 block">Endurance Days Remaining</span>
              </div>
            </div>
            <span
              className={`text-[9.5px] px-2 py-0.5 rounded border font-bold uppercase ${getStatusBadge(
                fuelReserve.status
              )}`}
            >
              {fuelReserve.status}
            </span>
          </div>

          {/* Comparison Numbers */}
          <div className="flex items-center justify-between px-2 py-2.5 rounded-lg bg-slate-900/70 border border-white/[0.04]">
            <div className="text-left">
              <span className="text-[9px] text-slate-400 block uppercase font-medium">
                Current Reserve
              </span>
              <span className="text-base sm:text-lg font-bold text-slate-300">
                {fuelReserve.formattedCurrent}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <ArrowRight className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span
                className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded mt-0.5 flex items-center gap-0.5 ${
                  fuelReserve.delta < 0
                    ? "text-rose-300 bg-rose-950/60"
                    : "text-emerald-300 bg-emerald-950/60"
                }`}
              >
                {fuelReserve.delta} days ({fuelReserve.deltaPercent}%)
              </span>
            </div>

            <div className="text-right">
              <span className="text-[9px] text-indigo-400 block uppercase font-bold">
                Simulated Reserve
              </span>
              <span
                className={`text-base sm:text-lg font-bold ${
                  fuelReserve.simulatedValue < 35
                    ? "text-rose-400"
                    : fuelReserve.simulatedValue < 50
                    ? "text-amber-300"
                    : "text-indigo-300"
                }`}
              >
                {fuelReserve.formattedSimulated}
              </span>
            </div>
          </div>

          {/* Resupply Buffer Warning Pill */}
          <div className="p-2 rounded-lg bg-slate-900/80 border border-white/[0.04] text-[10px] flex items-center justify-between">
            <span className="text-slate-400">Resupply Window:</span>
            <span
              className={`font-bold ${
                fuelReserve.resupplyBufferDays < 0
                  ? "text-rose-400"
                  : fuelReserve.resupplyBufferDays < 15
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {fuelReserve.resupplyBufferDays >= 0
                ? `+${fuelReserve.resupplyBufferDays}d Safety Margin`
                : `${Math.abs(fuelReserve.resupplyBufferDays)}d Exhaustion Deficit`}
            </span>
          </div>

          <div className="flex justify-between text-[9px] text-slate-400 pt-0.5 border-t border-white/[0.04]">
            <span>Endurance Shift:</span>
            <span className="text-indigo-300 font-bold">{fuelReserve.changeSummary}</span>
          </div>
        </div>

        {/* ── 5. Station Health ─────────────────────────────────────── */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.08] hover:border-emerald-500/40 transition-colors flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Station Health
                </span>
                <span className="text-[9px] text-slate-400 block">
                  Composite Multi-Domain Index
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowHealthBreakdown((prev) => !prev)}
              className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/[0.08] flex items-center gap-1 cursor-pointer"
            >
              <span>Domains</span>
              {showHealthBreakdown ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>

          {/* Comparison Numbers */}
          <div className="flex items-center justify-between px-2 py-2.5 rounded-lg bg-slate-900/70 border border-white/[0.04]">
            <div className="text-left">
              <span className="text-[9px] text-slate-400 block uppercase font-medium">
                Current Health
              </span>
              <span className="text-base sm:text-lg font-bold text-emerald-400">
                {stationHealth.formattedCurrent}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <ArrowRight className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span
                className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded mt-0.5 flex items-center gap-0.5 ${
                  stationHealth.delta < 0
                    ? "text-rose-300 bg-rose-950/60"
                    : "text-emerald-300 bg-emerald-950/60"
                }`}
              >
                {stationHealth.delta}% ({stationHealth.deltaPercent}%)
              </span>
            </div>

            <div className="text-right">
              <span className="text-[9px] text-emerald-400 block uppercase font-bold">
                Simulated Health
              </span>
              <span
                className={`text-base sm:text-lg font-bold ${
                  stationHealth.simulatedValue < 50
                    ? "text-rose-400"
                    : stationHealth.simulatedValue < 75
                    ? "text-amber-400"
                    : "text-emerald-300"
                }`}
              >
                {stationHealth.formattedSimulated}
              </span>
            </div>
          </div>

          {/* Subsystems Breakdown */}
          {showHealthBreakdown ? (
            <div className="space-y-1 pt-1 border-t border-white/[0.04] text-[9.5px]">
              {stationHealth.subsystems.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-1 rounded bg-slate-900/50"
                >
                  <span className="text-slate-300">{sub.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">{sub.currentPercent}%</span>
                    <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
                    <span
                      className={`font-bold ${
                        sub.status === "critical"
                          ? "text-rose-400"
                          : sub.status === "warning"
                          ? "text-amber-400"
                          : "text-emerald-300"
                      }`}
                    >
                      {sub.simulatedPercent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-between text-[9.5px] text-slate-400">
              <span>Overall Integrity:</span>
              <span
                className={`font-bold ${
                  stationHealth.simulatedValue < 60 ? "text-rose-400" : "text-amber-300"
                }`}
              >
                {stationHealth.changeSummary}
              </span>
            </div>
          )}
        </div>

        {/* ── 6. Risk Level (MEDIUM → HIGH) ─────────────────────────── */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.08] hover:border-rose-500/40 transition-colors flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Risk Level
                </span>
                <span className="text-[9px] text-slate-400 block">Mission Contingency Rating</span>
              </div>
            </div>
            <span
              className={`text-[9.5px] px-2 py-0.5 rounded border font-bold uppercase ${getStatusBadge(
                riskLevel.status
              )}`}
            >
              {riskLevel.simulated}
            </span>
          </div>

          {/* Comparison Numbers */}
          <div className="flex items-center justify-between px-2 py-2.5 rounded-lg bg-slate-900/70 border border-white/[0.04]">
            <div className="text-left">
              <span className="text-[9px] text-slate-400 block uppercase font-medium">
                Current Risk
              </span>
              <span
                className={`text-xs sm:text-sm font-bold px-2 py-0.5 rounded border uppercase inline-block mt-0.5 ${getRiskBadge(
                  riskLevel.current
                )}`}
              >
                {riskLevel.current}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <ArrowRight className="w-5 h-5 text-rose-400 animate-pulse" />
              <span className="text-[9px] font-bold text-rose-400 mt-0.5 uppercase">
                ESCALATED
              </span>
            </div>

            <div className="text-right">
              <span className="text-[9px] text-rose-400 block uppercase font-bold">
                Simulated Risk
              </span>
              <span
                className={`text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded border uppercase inline-block mt-0.5 ${getRiskBadge(
                  riskLevel.simulated
                )}`}
              >
                {riskLevel.simulated}
              </span>
            </div>
          </div>

          {/* Risk Callout pill matching user example: Risk: MEDIUM → HIGH */}
          <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/30 text-[10px] flex items-center justify-between">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Projected Shift:</span>
            </span>
            <span className="font-bold text-rose-300 tracking-wider">
              {riskLevel.changeSummary}
            </span>
          </div>

          <div className="flex justify-between text-[9px] text-slate-400 pt-0.5 border-t border-white/[0.04]">
            <span>Composite Severity Index:</span>
            <span className="text-rose-400 font-bold">
              {riskLevel.currentScore}/100 → {riskLevel.simulatedScore}/100
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
