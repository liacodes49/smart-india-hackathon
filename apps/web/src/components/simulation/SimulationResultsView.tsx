"use client";

import React, { useState } from "react";
import { Simulation } from "@repo/shared/types";
import { AlertSeverity } from "@repo/shared/enums";
import { SvgGauge } from "../analytics/charts/SvgGauge";
import { SvgAreaChart } from "../analytics/charts/SvgAreaChart";
import {
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  LineChart,
} from "lucide-react";

interface SimulationResultsViewProps {
  simulation: Simulation;
}

export function SimulationResultsView({ simulation }: SimulationResultsViewProps) {
  const { results } = simulation;

  if (!results) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono text-sm border border-dashed border-white/[0.1] rounded-2xl">
        Simulation is {simulation.status}. Awaiting results...
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<"ALL" | "DELTAS" | "TIMELINE" | "MITIGATIONS" | "CHARTS">("ALL");

  // Transform power trajectory for SvgAreaChart
  const powerChartData = results.timelineSteps.map((pt) => ({
    timestamp: pt.horizonLabel,
    primaryValue: pt.powerDemandKw,
    secondaryValue: pt.availableGenerationKw,
  }));

  // Transform fuel trajectory for SvgAreaChart
  const fuelChartData = results.timelineSteps.map((pt) => ({
    timestamp: pt.horizonLabel,
    primaryValue: Math.round(pt.fuelRemainingLiters / 1000), // in kL
    secondaryValue: 0, // No baseline in timeline steps currently
  }));

  const riskLevel =
    results.deltas.compositeRiskScore.projected > 75
      ? "CRITICAL"
      : results.deltas.compositeRiskScore.projected > 50
      ? "HIGH"
      : "MODERATE";

  const failureHorizon = results.timeline?.find(
    (t) => t.severity === AlertSeverity.CRITICAL || t.severity === AlertSeverity.EMERGENCY
  )?.timestamp;

  return (
    <section
      aria-label="Simulation Results View"
      className="p-4 sm:p-5 rounded-2xl border border-cyan-500/40 bg-[#080e1a]/95 backdrop-blur-md font-mono select-none flex flex-col gap-5 shadow-[0_0_30px_rgba(6,182,212,0.12)]"
    >
      {/* ── 1. Header Banner ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-300">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-cyan-200">
                WHAT-IF SIMULATION RESULTS — [{simulation.name}]
              </h2>
              <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
                {simulation.status}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Station: [{simulation.stationId}] • Type: {simulation.type} • Executed in{" "}
              {results.durationMs}ms
            </p>
          </div>
        </div>

        {/* Risk Badge & Navigation Filter Tabs */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="text-slate-400">Projected Risk:</span>
            <span
              className={`px-2.5 py-1 rounded font-bold uppercase ${
                riskLevel === "MODERATE"
                  ? "bg-emerald-950 text-emerald-300 border border-emerald-500/50"
                  : riskLevel === "HIGH"
                  ? "bg-amber-950 text-amber-300 border border-amber-500/50"
                  : "bg-rose-950 text-rose-300 border border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.25)]"
              }`}
            >
              {riskLevel}
            </span>
          </div>

          {/* Quick Section Filter */}
          <div
            className="hidden lg:flex items-center p-0.5 rounded-lg bg-slate-950 border border-white/[0.08] text-[9.5px]"
            role="tablist"
            aria-label="Result Sections"
          >
            {(["ALL", "DELTAS", "TIMELINE", "MITIGATIONS", "CHARTS"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-cyan-950 text-cyan-200 border border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2. Executive Summary Banner & Impact Gauge ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        <div className="lg:col-span-4 p-4 rounded-xl bg-slate-950/80 border border-white/[0.06] flex flex-col items-center justify-between text-center">
          <div className="w-full text-left pb-1 border-b border-white/[0.06]">
            <span className="text-xs font-bold text-slate-200 uppercase">
              Composite Impact Index
            </span>
            <span className="text-[9.5px] text-slate-400 block">
              Multi-subsystem contingency severity
            </span>
          </div>

          <div className="py-2">
            <SvgGauge
              value={results.impactScore}
              maxValue={100}
              label="Impact"
              unit="/100"
              size={135}
              strokeWidth={10}
              colorType="risk"
            />
          </div>

          <div className="w-full pt-2 border-t border-white/[0.04] text-[10px]">
            {failureHorizon ? (
              <span className="text-rose-400 font-bold flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Critical Horizon: {failureHorizon}
              </span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Operating margins stable
              </span>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col justify-between gap-3 p-4 rounded-xl bg-slate-950/80 border border-white/[0.06]">
          <div>
            <span className="font-bold text-cyan-300 text-xs block mb-1">
              EXECUTIVE CONTINGENCY BRIEFING:
            </span>
            <p className="text-xs leading-relaxed text-slate-300">
              {results.summary}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-white/[0.06] text-xs">
            <div className="p-2 rounded-lg bg-slate-900/60 border border-white/[0.04]">
              <span className="text-[9px] text-slate-400 uppercase block font-semibold">
                Power Demand
              </span>
              <span className="text-sm font-bold text-amber-300">
                {results.deltas.powerDemandKw.projected} kW
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/60 border border-white/[0.04]">
              <span className="text-[9px] text-slate-400 uppercase block font-semibold">
                Fuel Endurance
              </span>
              <span className="text-sm font-bold text-blue-300">
                {results.deltas.daysToDepletion.projected} Days
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/60 border border-white/[0.04] col-span-2 sm:col-span-1">
              <span className="text-[9px] text-slate-400 uppercase block font-semibold">
                Risk Score
              </span>
              <span className="text-sm font-bold text-rose-300">
                {results.deltas.compositeRiskScore.projected}/100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. DELTAS ──────────────────────────────────────────────── */}
      {(activeTab === "ALL" || activeTab === "DELTAS") && (
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06]">
          <h4 className="text-xs font-bold text-slate-200 mb-3 uppercase tracking-wide">Key Metric Deltas</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(results.deltas).map(([key, delta]) => {
              const isNegative = delta.delta < 0;
              const isZero = delta.delta === 0;
              return (
                <div key={key} className="p-2 rounded bg-slate-900/50 border border-white/[0.03]">
                  <div className="text-[9px] text-slate-400 font-bold uppercase">{key.replace(/([A-Z])/g, " $1").trim()}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-slate-200">{delta.projected} {delta.unit}</span>
                    {!isZero && (
                      <span className={`text-[10px] font-bold ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isNegative ? '' : '+'}{delta.delta} {delta.unit}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4. MITIGATIONS ─────────────────────────────────────────── */}
      {(activeTab === "ALL" || activeTab === "MITIGATIONS") && results.mitigations && results.mitigations.length > 0 && (
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06]">
          <h4 className="text-xs font-bold text-slate-200 mb-3 uppercase tracking-wide">Recommended Mitigations</h4>
          <div className="space-y-2">
            {results.mitigations.map((m, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-900/60 border border-cyan-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-cyan-300 text-xs">{m.action}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    m.priority === 'CRITICAL' ? 'bg-rose-950 text-rose-300' :
                    m.priority === 'HIGH' ? 'bg-amber-950 text-amber-300' :
                    'bg-slate-800 text-slate-300'
                  }`}>{m.priority}</span>
                </div>
                <p className="text-[10.5px] text-slate-300">{m.reasoning}</p>
                <div className="mt-2 text-[9.5px] text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Benefit: {m.expectedBenefit}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. CHARTS ──────────────────────────────────────────────── */}
      {(activeTab === "ALL" || activeTab === "CHARTS") && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <LineChart className="w-3.5 h-3.5 text-cyan-400" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Power Demand vs Capacity (kW)</h4>
                  <span className="text-[9.5px] text-slate-400">Cyan = Demand • Green = Available Capacity</span>
                </div>
              </div>
            </div>
            <SvgAreaChart
              data={powerChartData}
              primaryLabel="Demand"
              secondaryLabel="Capacity"
              primaryColor="#06b6d4"
              secondaryColor="#10b981"
              unit="kW"
              height={170}
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Fuel Reserve Depletion (kL)</h4>
                  <span className="text-[9.5px] text-slate-400">Blue = Projected Depletion</span>
                </div>
              </div>
            </div>
            <SvgAreaChart
              data={fuelChartData}
              primaryLabel="Projected"
              secondaryLabel="Baseline"
              primaryColor="#3b82f6"
              secondaryColor="#64748b"
              unit="kL"
              height={170}
            />
          </div>
        </div>
      )}

      {/* ── 6. TIMELINE ────────────────────────────────────────────── */}
      {(activeTab === "ALL" || activeTab === "TIMELINE") && results.timeline && results.timeline.length > 0 && (
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <h4 className="text-xs font-bold text-slate-200">Simulated Incident Timeline</h4>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {results.timeline.map((evt, idx) => {
              const isCrit = evt.severity === AlertSeverity.CRITICAL || evt.severity === AlertSeverity.EMERGENCY;
              const isWarn = evt.severity === AlertSeverity.WARNING;
              return (
                <div key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-white/[0.04]">
                  <span className="text-[10px] font-bold text-cyan-400 shrink-0 mt-0.5">{evt.timestamp}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        isCrit ? "bg-rose-950 text-rose-300 border-rose-500/50" :
                        isWarn ? "bg-amber-950 text-amber-300 border-amber-500/50" :
                        "bg-blue-950 text-blue-300 border-blue-500/50"
                      }`}>{evt.severity}</span>
                      <span className="text-[9.5px] text-slate-400 font-semibold">[{evt.system}]</span>
                    </div>
                    <p className="text-[10.5px] text-slate-200 leading-snug">{evt.event}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
