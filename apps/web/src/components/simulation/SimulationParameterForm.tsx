"use client";

import React from "react";
import {
  SimulationParametersConfig,
  HeatingDemandLevel,
} from "@/features/simulation/types";
import {
  Play,
  RotateCcw,
  Sliders,
  Thermometer,
  Zap,
  Flame,
  Gauge,
  Droplets,
  Ship,
  Loader2,
} from "lucide-react";

interface SimulationParameterFormProps {
  scenarioName: string;
  setScenarioName: (name: string) => void;
  scenarioDesc: string;
  setScenarioDesc: (desc: string) => void;
  parameters: SimulationParametersConfig;
  onChangeParams: (newParams: SimulationParametersConfig) => void;
  onResetParams: () => void;
  onRunSimulation: () => void;
  isRunning: boolean;
}

export function SimulationParameterForm({
  scenarioName,
  setScenarioName,
  scenarioDesc,
  setScenarioDesc,
  parameters,
  onChangeParams,
  onResetParams,
  onRunSimulation,
  isRunning,
}: SimulationParameterFormProps) {
  const activeGensetCount =
    (parameters.generatorAvailability.gen1 ? 1 : 0) +
    (parameters.generatorAvailability.gen2 ? 1 : 0) +
    (parameters.generatorAvailability.gen3 ? 1 : 0);

  const handleToggleGen = (gen: "gen1" | "gen2" | "gen3") => {
    onChangeParams({
      ...parameters,
      generatorAvailability: {
        ...parameters.generatorAvailability,
        [gen]: !parameters.generatorAvailability[gen],
      },
    });
  };

  const handleHeatingSelect = (level: HeatingDemandLevel) => {
    onChangeParams({
      ...parameters,
      heatingDemand: level,
    });
  };

  return (
    <section
      aria-label="Simulation Parameter Form"
      className="p-4 sm:p-5 rounded-2xl border border-white/[0.08] bg-[#080d16]/90 backdrop-blur-md font-mono select-none flex flex-col gap-4 shadow-lg"
    >
      {/* Form Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-100">
              Scenario Configuration & What-If Stress Tuner
            </h3>
            <p className="text-[10px] text-slate-400">
              Tune thermodynamic, electrical, mechanical and logistics parameters
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onResetParams}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-slate-300 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3 text-slate-400" />
          <span>RESET TO BASELINE</span>
        </button>
      </div>

      {/* Scenario Name & Description Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
            Scenario Mission Identifier
          </label>
          <input
            type="text"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/[0.08] text-slate-100 text-xs focus:outline-none focus:border-cyan-500/60"
            placeholder="e.g. Extreme Polar Blizzard -55C"
          />
        </div>

        <div>
          <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
            Operational Objective & Context
          </label>
          <input
            type="text"
            value={scenarioDesc}
            onChange={(e) => setScenarioDesc(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/[0.08] text-slate-100 text-xs focus:outline-none focus:border-cyan-500/60"
            placeholder="Brief description of trigger conditions"
          />
        </div>
      </div>

      {/* 6 What-If Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
        {/* 1. Temperature Change */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/[0.06] flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-200">
                Temperature Change
              </span>
            </div>
            <span
              className={`text-xs font-bold ${
                parameters.temperatureDeltaC < 0
                  ? "text-sky-300"
                  : "text-emerald-400"
              }`}
            >
              {parameters.temperatureDeltaC > 0 ? "+" : ""}
              {parameters.temperatureDeltaC}°C
            </span>
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min="-40"
              max="15"
              step="1"
              value={parameters.temperatureDeltaC}
              onChange={(e) =>
                onChangeParams({
                  ...parameters,
                  temperatureDeltaC: parseInt(e.target.value, 10),
                })
              }
              className="w-full accent-cyan-400 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[8.5px] text-slate-500">
              <span>-40°C Drop</span>
              <span>0°C (Normal)</span>
              <span>+15°C Thaw</span>
            </div>
          </div>

          <span className="text-[9.5px] text-slate-400">
            {parameters.temperatureDeltaC <= -20
              ? "Severe polar cold snap forces emergency trace line heat"
              : parameters.temperatureDeltaC < 0
              ? "Cold katabatic air drains into oasis floor"
              : "Mild polar conditions within HVAC baseline"}
          </span>
        </div>

        {/* 2. Power Demand Change */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/[0.06] flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200">
                Power Demand Change
              </span>
            </div>
            <span
              className={`text-xs font-bold ${
                parameters.powerDemandDeltaPercent > 0
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {parameters.powerDemandDeltaPercent > 0 ? "+" : ""}
              {parameters.powerDemandDeltaPercent}%
            </span>
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min="-50"
              max="100"
              step="5"
              value={parameters.powerDemandDeltaPercent}
              onChange={(e) =>
                onChangeParams({
                  ...parameters,
                  powerDemandDeltaPercent: parseInt(e.target.value, 10),
                })
              }
              className="w-full accent-amber-400 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[8.5px] text-slate-500">
              <span>-50% (Curtail)</span>
              <span>Baseline</span>
              <span>+100% (Surge)</span>
            </div>
          </div>

          <span className="text-[9.5px] text-slate-400">
            {parameters.powerDemandDeltaPercent > 30
              ? "High load threatens generator overload threshold"
              : parameters.powerDemandDeltaPercent < 0
              ? "Defensive load shedding mode active"
              : "Nominal scientific and life support draw"}
          </span>
        </div>

        {/* 3. Heating Demand Level */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/[0.06] flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-bold text-slate-200">
                Heating Demand Mode
              </span>
            </div>
            <span className="text-xs font-bold text-rose-300">
              {parameters.heatingDemand}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[9px]">
            {(
              [
                { id: "LOW", label: "LOW (-20kW)" },
                { id: "NOMINAL", label: "NOMINAL" },
                { id: "ELEVATED", label: "ELEVATED (+25kW)" },
                { id: "CRITICAL_100", label: "100% TRACE (+45kW)" },
              ] as const
            ).map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => handleHeatingSelect(h.id)}
                className={`py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer truncate ${
                  parameters.heatingDemand === h.id
                    ? "bg-rose-950 text-rose-200 border border-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                    : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>

          <span className="text-[9.5px] text-slate-400">
            Controls HVAC heat pumps & lake water pipe trace heating
          </span>
        </div>

        {/* 4. Generator Availability */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/[0.06] flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">
                Generator Availability
              </span>
            </div>
            <span
              className={`text-xs font-bold ${
                activeGensetCount < 2 ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {activeGensetCount} of 3 Online
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-[9.5px]">
            {(
              [
                { id: "gen1", label: "GEN 01" },
                { id: "gen2", label: "GEN 02" },
                { id: "gen3", label: "GEN 03" },
              ] as const
            ).map((g) => {
              const isOnline = parameters.generatorAvailability[g.id];
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleToggleGen(g.id)}
                  className={`py-1.5 px-1.5 rounded-lg font-bold flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
                    isOnline
                      ? "bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                      : "bg-slate-900 border border-rose-500/40 text-rose-400"
                  }`}
                >
                  <span>{g.label}</span>
                  <span className="text-[8px] uppercase">
                    {isOnline ? "ONLINE" : "OFFLINE"}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="text-[9.5px] text-slate-400">
            {activeGensetCount === 1
              ? "Single point of failure: zero redundancy active!"
              : activeGensetCount === 0
              ? "BLACKOUT: Microgrid relying solely on BESS battery"
              : "Standard dual-set or full parallel power available"}
          </span>
        </div>

        {/* 5. Fuel Consumption Multiplier */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/[0.06] flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-slate-200">
                Fuel Consumption
              </span>
            </div>
            <span className="text-xs font-bold text-blue-300">
              {parameters.fuelConsumptionMultiplier.toFixed(2)}x Burn
            </span>
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min="0.8"
              max="2.5"
              step="0.05"
              value={parameters.fuelConsumptionMultiplier}
              onChange={(e) =>
                onChangeParams({
                  ...parameters,
                  fuelConsumptionMultiplier: parseFloat(e.target.value),
                })
              }
              className="w-full accent-blue-400 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[8.5px] text-slate-500">
              <span>0.8x (Conservation)</span>
              <span>1.0x (Norm)</span>
              <span>2.5x (Blizzard Burn)</span>
            </div>
          </div>

          <span className="text-[9.5px] text-slate-400">
            Simulates increased fuel viscosity and continuous thermal injection
          </span>
        </div>

        {/* 6. Resupply Vessel Delay */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/[0.06] flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Ship className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-slate-200">
                Resupply Vessel Delay
              </span>
            </div>
            <span
              className={`text-xs font-bold ${
                parameters.resupplyDelayDays > 20
                  ? "text-rose-400"
                  : parameters.resupplyDelayDays > 0
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              +{parameters.resupplyDelayDays} Days Delay
            </span>
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max="60"
              step="2"
              value={parameters.resupplyDelayDays}
              onChange={(e) =>
                onChangeParams({
                  ...parameters,
                  resupplyDelayDays: parseInt(e.target.value, 10),
                })
              }
              className="w-full accent-purple-400 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[8.5px] text-slate-500">
              <span>0 Days (On Time)</span>
              <span>+30 Days</span>
              <span>+60 Days (Ice Locked)</span>
            </div>
          </div>

          <span className="text-[9.5px] text-slate-400">
            Simulates sea-ice obstruction delaying tanker arrival
          </span>
        </div>
      </div>

      {/* Big RUN SIMULATION Button Bar */}
      <div className="pt-2 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-[10px] text-slate-400">
          Ready to compute multi-domain physical cascade for Antarctic winter station.
        </div>

        <button
          type="button"
          onClick={onRunSimulation}
          disabled={isRunning}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5 ${
            isRunning
              ? "bg-cyan-950 text-cyan-300 border border-cyan-500/50 opacity-80 cursor-wait"
              : "bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] border border-cyan-300/40 transform active:scale-95"
          }`}
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
              <span>COMPUTING WHAT-IF CASCADE...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>RUN SIMULATION</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
