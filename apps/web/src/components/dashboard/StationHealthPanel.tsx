"use client";

import React from "react";
import { useStationStore } from "@/stores/useStationStore";
import { Activity, Zap, Building2, Truck, Wind, Wifi } from "lucide-react";

interface HealthDomain {
  id: string;
  label: string;
  subsystem: string;
  icon: React.ComponentType<{ className?: string }>;
}

const HEALTH_DOMAINS: HealthDomain[] = [
  {
    id: "energy",
    label: "Energy",
    subsystem: "Gensets & BESS Microgrid",
    icon: Zap,
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    subsystem: "Station Habitats & Modules",
    icon: Building2,
  },
  {
    id: "logistics",
    label: "Logistics",
    subsystem: "POL Fuel & Supply Chain",
    icon: Truck,
  },
  {
    id: "environment",
    label: "Environment",
    subsystem: "Life Support & HVAC",
    icon: Wind,
  },
  {
    id: "connectivity",
    label: "Connectivity",
    subsystem: "SATCOM Telemetry Bus",
    icon: Wifi,
  },
];

export function StationHealthPanel() {
  const activeStation = useStationStore((s) => s.activeStation);

  return (
    <section
      aria-label="Station Health Assessment"
      className="flex flex-col p-4 rounded-2xl border border-white/[0.08] bg-[#080d16]/90 backdrop-blur-md font-mono select-none"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              STATION HEALTH
            </h3>
            <p className="text-[10px] text-slate-400">
              [{activeStation}] Multi-Domain Health Index
            </p>
          </div>
        </div>

        <span className="text-[9.5px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-semibold italic">
          Awaiting telemetry
        </span>
      </div>

      {/* 5 Health Domains List */}
      <div className="mt-3 space-y-2.5">
        {HEALTH_DOMAINS.map((domain) => {
          const Icon = domain.icon;

          return (
            <div key={domain.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-300 font-medium text-[11px]">{domain.label}</span>
                  <span className="text-[9.5px] text-slate-400 hidden sm:inline">
                    ({domain.subsystem})
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 italic">Data pending</span>
              </div>

              {/* Neutral Unlinked Progress Track (No Fake Filled Percentages) */}
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
                <div className="h-full bg-slate-800 w-0" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Panel Footer */}
      <div className="mt-4 pt-2.5 border-t border-white/[0.04] text-[9.5px] text-slate-400 leading-relaxed">
        Algorithm awaits multi-domain telemetry packets from backend API.
      </div>
    </section>
  );
}