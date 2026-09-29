"use client";

import React, { useState } from "react";
import { CrossDomainImpactData } from "@/features/analytics/types";
import {
  GitFork,
  ArrowDown,
  CloudSnow,
  Building2,
  Zap,
  Gauge,
  Fuel,
  Truck,
  ShieldAlert,
  Sparkles,
  Sliders,
} from "lucide-react";

interface CrossDomainImpactPanelProps {
  crossDomain: CrossDomainImpactData;
  stationName: string;
}

export function CrossDomainImpactPanel({
  crossDomain,
  stationName,
}: CrossDomainImpactPanelProps) {
  const scenarios = crossDomain.scenarios;
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    scenarios[0]?.id || "sc-blizzard"
  );
  const [interactiveTemp, setInteractiveTemp] = useState<number>(-35);

  const activeScenario =
    scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  // Icons corresponding to the 7 cascade nodes in order
  const nodeIcons = [
    CloudSnow, // Environment
    Building2, // Infrastructure
    Zap, // Energy
    Gauge, // Generator
    Fuel, // Fuel
    Truck, // Logistics
    ShieldAlert, // Risk
  ];

  // Dynamic calculation when user adjusts temperature slider
  // Baseline is -28°C: 180kW demand, 76% gen load, 1,735 L/d burn, 74 days reserve
  const tempDeltaFromBaseline = -28 - interactiveTemp; // positive if colder
  const dynamicHeatingIncrease = Math.max(0, Math.round(tempDeltaFromBaseline * 2.2));
  const dynamicPowerDemand = Math.round(180 + tempDeltaFromBaseline * 2.4);
  const dynamicGenLoad = Math.min(
    99,
    Math.round(72 + (tempDeltaFromBaseline / 25) * 22)
  );
  const dynamicFuelBurn = Math.round(1700 + tempDeltaFromBaseline * 22);
  const dynamicDaysRemaining = Math.max(
    38,
    Math.round(128400 / dynamicFuelBurn)
  );
  const dynamicRiskScore = Math.min(
    95,
    Math.max(20, Math.round(25 + tempDeltaFromBaseline * 2.1))
  );

  return (
    <section
      aria-label="Cross-Domain Impact Cascade"
      className="p-4 rounded-2xl border border-cyan-500/30 bg-[#080d16]/95 backdrop-blur-md font-mono select-none flex flex-col gap-4 shadow-[0_0_20px_rgba(6,182,212,0.08)]"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
            <GitFork className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-cyan-200">
              10. CROSS-DOMAIN IMPACT CASCADE — [{stationName}]
            </h3>
            <p className="text-[10px] text-slate-400">
              Causal Telemetry Chain: Environment → Infrastructure → Energy → Generator → Fuel → Logistics → Risk
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9.5px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            INTERACTIVE CAUSAL ENGINE
          </span>
        </div>
      </div>

      {/* Scenario Selector & Interactive Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/80 border border-white/[0.06]">
        {/* Preset Scenarios Switcher */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Select Operational Incident Scenario:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {scenarios.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setSelectedScenarioId(sc.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  selectedScenarioId === sc.id
                    ? "bg-cyan-950 text-cyan-200 border border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.25)]"
                    : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-850"
                }`}
              >
                {sc.title}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Temperature Slider */}
        <div className="flex flex-col gap-1 md:min-w-[260px] pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-white/[0.06] md:pl-4">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-cyan-400" />
              Simulate Ambient Temp:
            </span>
            <span className="text-cyan-300 font-bold text-xs">
              {interactiveTemp}°C
            </span>
          </div>
          <input
            type="range"
            min="-60"
            max="-20"
            step="1"
            value={interactiveTemp}
            onChange={(e) => setInteractiveTemp(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-400 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[8.5px] text-slate-500">
            <span>-60°C (Extreme Chill)</span>
            <span>-40°C</span>
            <span>-20°C (Mild)</span>
          </div>
        </div>
      </div>

      {/* Scenario Context Banner */}
      <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs">
        <span className="font-bold text-cyan-300 block mb-0.5">
          {activeScenario.title}:
        </span>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          {activeScenario.mechanicsDescription}
        </p>
      </div>

      {/* 7-Step Visual Cascade Flow Pipeline */}
      <div className="relative">
        {/* Desktop / Tablet Horizontal Pipeline */}
        <div className="hidden xl:grid grid-cols-7 gap-2 items-stretch relative">
          {activeScenario.nodes.map((node, index) => {
            const Icon = nodeIcons[index] || GitFork;
            const isCritical = node.status === "CRITICAL";
            const isWarning = node.status === "WARNING";

            const borderClass = isCritical
              ? "border-rose-500/50 bg-rose-950/20 shadow-[0_0_12px_rgba(244,63,94,0.15)]"
              : isWarning
              ? "border-amber-500/50 bg-amber-950/20"
              : "border-white/[0.08] bg-slate-950/70";

            const textAccent = isCritical
              ? "text-rose-400"
              : isWarning
              ? "text-amber-400"
              : "text-emerald-400";

            return (
              <div key={node.id} className="relative flex flex-col">
                <div
                  className={`p-3 rounded-xl border ${borderClass} flex flex-col justify-between gap-2 h-full`}
                >
                  {/* Step Number & Node Name */}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-500">
                      STEP 0{index + 1}
                    </span>
                    <Icon className={`w-3.5 h-3.5 ${textAccent}`} />
                  </div>

                  <div className="my-1">
                    <span className="text-[10.5px] font-bold text-slate-200 uppercase tracking-wider block">
                      {node.label}
                    </span>
                    <span className={`text-xs font-bold ${textAccent} block mt-0.5`}>
                      {node.value}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5 leading-tight">
                      {node.parameter}
                    </span>
                  </div>

                  <p className="text-[8.5px] text-slate-400 pt-1.5 border-t border-white/[0.04] leading-relaxed">
                    {node.impactText}
                  </p>
                </div>

                {/* Connecting Right Arrow between cards (except last) */}
                {index < activeScenario.nodes.length - 1 && (
                  <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 hidden xl:flex items-center justify-center w-5 h-5 rounded-full bg-[#080d16] border border-cyan-500/40 text-cyan-400 shadow-md">
                    <span className="text-[10px] font-bold">→</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile / Compact Vertical Flow */}
        <div className="xl:hidden flex flex-col gap-2">
          {activeScenario.nodes.map((node, index) => {
            const Icon = nodeIcons[index] || GitFork;
            const isCritical = node.status === "CRITICAL";
            const isWarning = node.status === "WARNING";

            const borderClass = isCritical
              ? "border-rose-500/40 bg-rose-950/20"
              : isWarning
              ? "border-amber-500/40 bg-amber-950/20"
              : "border-white/[0.08] bg-slate-950/70";

            const textAccent = isCritical
              ? "text-rose-400"
              : isWarning
              ? "text-amber-400"
              : "text-emerald-400";

            return (
              <React.Fragment key={node.id}>
                <div
                  className={`p-3 rounded-xl border ${borderClass} flex items-center justify-between gap-3`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 border border-white/[0.06] flex items-center justify-center shrink-0">
                      <Icon className={`w-3.5 h-3.5 ${textAccent}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-500 font-bold">
                          STEP 0{index + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-200 uppercase">
                          {node.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {node.impactText}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-xs font-bold ${textAccent} block`}>
                      {node.value}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {node.parameter}
                    </span>
                  </div>
                </div>

                {index < activeScenario.nodes.length - 1 && (
                  <div className="flex justify-center my-0.5">
                    <ArrowDown className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Live Calculated Slider Feedback Box */}
      <div className="p-3 rounded-xl bg-slate-950/90 border border-white/[0.06] flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs pb-1.5 border-b border-white/[0.04]">
          <span className="text-slate-300 font-bold flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Live Simulated Impact for Ambient {interactiveTemp}°C:
          </span>
          <span
            className={`font-bold text-[11px] ${
              dynamicRiskScore > 70
                ? "text-rose-400"
                : dynamicRiskScore > 40
                ? "text-amber-400"
                : "text-emerald-400"
            }`}
          >
            Projected Risk: {dynamicRiskScore}/100
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px]">
          <div className="p-2 rounded bg-slate-900/60 border border-white/[0.04]">
            <span className="text-slate-400 block text-[9.5px]">Heating Load:</span>
            <span className="font-bold text-cyan-300">
              +{dynamicHeatingIncrease}% thermal loss
            </span>
          </div>
          <div className="p-2 rounded bg-slate-900/60 border border-white/[0.04]">
            <span className="text-slate-400 block text-[9.5px]">Power Demand:</span>
            <span className="font-bold text-amber-300">
              {dynamicPowerDemand} kW (Load: {dynamicGenLoad}%)
            </span>
          </div>
          <div className="p-2 rounded bg-slate-900/60 border border-white/[0.04]">
            <span className="text-slate-400 block text-[9.5px]">Daily Fuel Burn:</span>
            <span className="font-bold text-amber-400">
              {dynamicFuelBurn} L/day
            </span>
          </div>
          <div className="p-2 rounded bg-slate-900/60 border border-white/[0.04]">
            <span className="text-slate-400 block text-[9.5px]">Reserve Endurance:</span>
            <span className="font-bold text-blue-300">
              {dynamicDaysRemaining} Days autonomous
            </span>
          </div>
        </div>

        <div className="text-[9.5px] text-slate-400 pt-1 leading-relaxed">
          <span className="text-cyan-400 font-semibold">Causal Mechanics: </span>
          Temperature drops ({interactiveTemp}°C) → heating demand increases (+{dynamicHeatingIncrease}%) → power demand increases ({dynamicPowerDemand} kW) → generator load increases ({dynamicGenLoad}%) → fuel consumption increases ({dynamicFuelBurn} L/day) → reserve decreases ({dynamicDaysRemaining} days) → resupply risk shifts to {dynamicRiskScore > 65 ? "ELEVATED" : "MODERATE"}.
        </div>
      </div>
    </section>
  );
}
