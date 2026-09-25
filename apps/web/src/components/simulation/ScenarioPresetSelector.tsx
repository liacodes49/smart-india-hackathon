"use client";

import React from "react";
import { SimulationType } from "@repo/shared/enums";
import { ScenarioPreset } from "@/features/simulation/types";
import {
  CloudSnow,
  ZapOff,
  Wrench,
  Ship,
  ShieldAlert,
  Sliders,
} from "lucide-react";

interface ScenarioPresetSelectorProps {
  presets: ScenarioPreset[];
  selectedType: SimulationType;
  onSelectPreset: (preset: ScenarioPreset) => void;
}

export function ScenarioPresetSelector({
  presets,
  selectedType,
  onSelectPreset,
}: ScenarioPresetSelectorProps) {
  const getPresetIcon = (type: SimulationType) => {
    switch (type) {
      case SimulationType.WEATHER_EXTREME:
        return CloudSnow;
      case SimulationType.POWER_FAILURE:
        return ZapOff;
      case SimulationType.EQUIPMENT_FAILURE:
        return Wrench;
      case SimulationType.SUPPLY_SHORTAGE:
        return Ship;
      case SimulationType.EVACUATION:
        return ShieldAlert;
      case SimulationType.CUSTOM:
      default:
        return Sliders;
    }
  };

  return (
    <section aria-label="Scenario Presets" className="w-full font-mono select-none">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Select Simulation Scenario Archetype
          </h3>
        </div>
        <span className="text-[10px] text-slate-400">
          6 Official Archetypes Configured
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {presets.map((p) => {
          const Icon = getPresetIcon(p.type);
          const isSelected = selectedType === p.type;

          return (
            <button
              key={p.type}
              type="button"
              onClick={() => onSelectPreset(p)}
              className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 ${
                isSelected
                  ? "bg-cyan-950/70 border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.25)]"
                  : "bg-[#080d16]/90 border-white/[0.08] hover:bg-slate-900 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-cyan-900/50 border-cyan-400 text-cyan-300"
                        : "bg-slate-900 border-white/[0.06] text-slate-400"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span
                      className={`text-xs font-bold block ${
                        isSelected ? "text-cyan-200" : "text-slate-200"
                      }`}
                    >
                      {p.title}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">
                      TYPE: {p.type}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[10.5px] text-slate-300 line-clamp-2 leading-relaxed mt-1">
                {p.shortDesc}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-[9.5px]">
                <span className="text-slate-400">
                  {p.type === SimulationType.CUSTOM ? "Manual Tuning" : "Preset Applied"}
                </span>
                <span
                  className={`font-semibold ${
                    isSelected ? "text-cyan-300" : "text-slate-400"
                  }`}
                >
                  {isSelected ? "ACTIVE" : "SELECT →"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
