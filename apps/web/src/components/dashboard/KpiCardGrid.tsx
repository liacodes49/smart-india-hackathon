"use client";

import React from "react";
import { Zap, Fuel, Thermometer, Truck, Radio, Activity } from "lucide-react";

interface KpiItem {
  id: string;
  label: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
}

const KPI_CATEGORIES: KpiItem[] = [
  {
    id: "power",
    label: "Total Power Load",
    category: "Primary Microgrid",
    icon: Zap,
  },
  {
    id: "fuel",
    label: "Fuel Reserve Days",
    category: "POL Storage Farm",
    icon: Fuel,
  },
  {
    id: "weather",
    label: "Ambient Weather",
    category: "Meteorological Vitals",
    icon: Thermometer,
  },
  {
    id: "logistics",
    label: "Logistics Readiness",
    category: "Consumables & Fleet",
    icon: Truck,
  },
  {
    id: "comms",
    label: "Communication Bandwidth",
    category: "SATCOM Data Bus",
    icon: Radio,
  },
  {
    id: "health",
    label: "Station Health Index",
    category: "Composite Assessment",
    icon: Activity,
  },
];

export function KpiCardGrid() {
  return (
    <section aria-label="Key Performance Indicators" className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {KPI_CATEGORIES.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex flex-col justify-between p-3 rounded-xl bg-[#080d16]/90 border border-white/[0.08] backdrop-blur-sm font-mono select-none"
            >
              {/* Header: Label & Icon */}
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase leading-tight truncate">
                  {item.label}
                </span>
                <Icon className="w-3.5 h-3.5 text-cyan-400/80 shrink-0 mt-0.5" />
              </div>

              {/* Metric Value: Neutral Placeholder */}
              <div className="my-2">
                <span className="text-xs sm:text-sm font-semibold text-slate-400 tracking-wide italic">
                  Awaiting telemetry
                </span>
              </div>

              {/* Footer: Category Context & Offline State */}
              <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-white/[0.04] pt-1.5 mt-0.5">
                <span className="truncate text-slate-400">{item.category}</span>
                <span className="shrink-0 text-slate-400 font-medium">Pending</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}