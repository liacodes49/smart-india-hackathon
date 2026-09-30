"use client";

import React from "react";
import { FuelAnalyticsData } from "@/features/analytics/types";
import { SvgBarChart } from "./charts/SvgBarChart";
import { Fuel, Ship, Droplets, CheckCircle2 } from "lucide-react";

interface FuelAnalyticsPanelProps {
  fuel: FuelAnalyticsData;
  stationName: string;
}

export function FuelAnalyticsPanel({ fuel, stationName }: FuelAnalyticsPanelProps) {
  const barData = fuel.history.map((h) => ({
    label: h.date,
    value: h.dailyBurnL,
    secondaryValue: h.projectedBurnL,
    highlight: h.dailyBurnL > 1750,
  }));

  return (
    <section
      aria-label="Fuel Analytics"
      className="p-4 rounded-2xl border border-white/[0.08] bg-[#080d16]/90 backdrop-blur-md font-mono select-none flex flex-col gap-3.5"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Fuel className="w-4 h-4 text-cyan-400" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              4. FUEL ANALYTICS & POL INVENTORY — [{stationName}]
            </h3>
            <p className="text-[10px] text-slate-400">
              Bulk Polar Fuel Storage, Burn Trajectory & Depletion Schedule
            </p>
          </div>
        </div>

        {/* Resupply status badge */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 border border-white/[0.06] text-[10.5px]">
          <Ship className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Resupply Vessel:</span>
          <span className="text-cyan-300 font-bold">{fuel.resupplyDate}</span>
          <span className="text-emerald-400 font-semibold">
            (+{fuel.resupplyBufferDays}d buffer)
          </span>
        </div>
      </div>

      {/* 4 Key Fuel KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.05] flex flex-col justify-between">
          <span className="text-[10px] text-slate-400">Current Reserve</span>
          <div className="my-1" suppressHydrationWarning>
            <span className="text-lg font-bold text-cyan-400">
              {fuel.currentReserveLitres.toLocaleString("en-US")} L
            </span>
            <span className="text-[9.5px] text-slate-400 block mt-0.5">
              {fuel.reservePercent}% of {fuel.totalCapacityLitres.toLocaleString("en-US")} L
            </span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1 border border-white/[0.04]">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-700"
              style={{ width: `${fuel.reservePercent}%` }}
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.05] flex flex-col justify-between">
          <span className="text-[10px] text-slate-400">Daily Consumption</span>
          <div className="my-1" suppressHydrationWarning>
            <span className="text-lg font-bold text-amber-400">
              {fuel.dailyConsumptionLitres.toLocaleString("en-US")} L/d
            </span>
            <span className="text-[9.5px] text-slate-400 block mt-0.5">
              ~{(fuel.dailyConsumptionLitres / 24).toFixed(1)} L/hour burn
            </span>
          </div>
          <span className="text-[9px] text-emerald-400 font-semibold mt-1">
            Within scheduled budget
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.05] flex flex-col justify-between">
          <span className="text-[10px] text-slate-400">Days Remaining</span>
          <div className="my-1">
            <span className="text-lg font-bold text-blue-400">
              {fuel.daysRemaining} Days
            </span>
            <span className="text-[9.5px] text-slate-400 block mt-0.5">
              at current burn rate
            </span>
          </div>
          <span className="text-[9px] text-cyan-300 font-semibold mt-1">
            Autonomous endurance
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.05] flex flex-col justify-between">
          <span className="text-[10px] text-slate-400">Projected Depletion</span>
          <div className="my-1">
            <span className="text-base font-bold text-slate-100">
              {fuel.projectedDepletionDate}
            </span>
            <span className="text-[9.5px] text-slate-400 block mt-0.5">
              Vessel arrival: {fuel.resupplyDate}
            </span>
          </div>
          <span className="text-[9px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Zero-deficit security
          </span>
        </div>
      </div>

      {/* Mid split: Consumption Trend Bar Chart + Tank Farm Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left 7 cols: Daily Burn Rate Bar Chart */}
        <div className="lg:col-span-7 p-3 rounded-xl bg-slate-950/80 border border-white/[0.05] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-xs font-bold text-slate-200">
                Daily Fuel Consumption Trend (Past 7 Days)
              </h4>
              <span className="text-[9.5px] text-slate-400">
                Litres consumed per 24-hour cycle
              </span>
            </div>
            <span className="text-[9.5px] text-slate-400">
              Baseline: 1,750 L/d
            </span>
          </div>

          <SvgBarChart
            data={barData}
            unit="L"
            height={160}
            baseline={1750}
            baselineLabel="Target"
          />
        </div>

        {/* Right 5 cols: Tank Farm Level Meters */}
        <div className="lg:col-span-5 p-3 rounded-xl bg-slate-950/80 border border-white/[0.05] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/[0.06]">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              POL Bulk Storage Farm
            </h4>
            <span className="text-[9px] text-slate-400">4 Active Vessels</span>
          </div>

          <div className="space-y-2.5">
            {fuel.tanks.map((tank) => (
              <div key={tank.id} className="flex flex-col gap-1 text-[10.5px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-200 font-semibold">{tank.name}</span>
                    <span className="text-[9px] text-slate-400">({tank.type})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-cyan-300 font-bold">{tank.percent}%</span>
                    <span className="text-[9px] text-slate-400">
                      ({(tank.currentLitres / 1000).toFixed(1)}k L)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/[0.04]">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      tank.percent > 70
                        ? "bg-cyan-500"
                        : tank.percent > 40
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${tank.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 pt-2 border-t border-white/[0.04] text-[9px] text-slate-400">
            Emergency fuel cross-feed manifold active. Fuel heating coils operational.
          </div>
        </div>
      </div>
    </section>
  );
}
