"use client";

import React from "react";
import { GeneratorPerformanceData, GeneratorUnit } from "@/features/analytics/types";
import { SvgGauge } from "./charts/SvgGauge";
import { Gauge, Flame, Clock, Thermometer, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

interface GeneratorPerformancePanelProps {
  generators: GeneratorPerformanceData;
  stationName: string;
}

export function GeneratorPerformancePanel({
  generators,
  stationName,
}: GeneratorPerformancePanelProps) {
  return (
    <section
      aria-label="Generator Performance"
      className="p-4 rounded-2xl border border-white/[0.08] bg-[#080d16]/90 backdrop-blur-md font-mono select-none flex flex-col gap-3.5"
    >
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              3. GENERATOR PERFORMANCE — [{stationName}]
            </h3>
            <p className="text-[10px] text-slate-400">
              Primary Powerhouse Diesel Genset Telemetry & Mechanical Health
            </p>
          </div>
        </div>

        {/* Aggregate Quick Status */}
        <div className="flex items-center gap-3 text-[10.5px]">
          <span className="text-slate-400">
            Active Sets:{" "}
            <span className="text-emerald-400 font-bold">
              {generators.totalRunningCount} of {generators.generators.length}
            </span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            Avg Load:{" "}
            <span className="text-cyan-300 font-bold">
              {generators.aggregateLoadPercent}%
            </span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            Fuel Burn:{" "}
            <span className="text-amber-400 font-bold">
              {generators.aggregateFuelBurnLph} L/h
            </span>
          </span>
        </div>
      </div>

      {/* 3 Generator Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {generators.generators.map((gen: GeneratorUnit) => {
          // Status badge styling
          const isRunning = gen.status === "RUNNING";
          const isStandby = gen.status === "STANDBY";
          const isWarning = gen.healthState === "WARNING";
          const isCritical = gen.healthState === "CRITICAL";

          const cardBorder = isCritical
            ? "border-rose-500/40 bg-rose-950/10"
            : isWarning
            ? "border-amber-500/40 bg-amber-950/10"
            : "border-white/[0.08] bg-slate-950/60";

          const statusBadge = isRunning ? (
            <span className="flex items-center gap-1 text-[9.5px] px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              RUNNING
            </span>
          ) : isStandby ? (
            <span className="flex items-center gap-1 text-[9.5px] px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              STANDBY
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[9.5px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 font-semibold">
              {gen.status}
            </span>
          );

          const healthBadge = isCritical ? (
            <span className="flex items-center gap-1 text-[9.5px] px-2 py-0.5 rounded bg-rose-950 border border-rose-500/50 text-rose-300 font-bold">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              CRITICAL
            </span>
          ) : isWarning ? (
            <span className="flex items-center gap-1 text-[9.5px] px-2 py-0.5 rounded bg-amber-950 border border-amber-500/50 text-amber-300 font-bold">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              WARNING
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[9.5px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              HEALTHY
            </span>
          );

          return (
            <div
              key={gen.id}
              className={`p-3.5 rounded-xl border ${cardBorder} flex flex-col justify-between gap-3 transition-all`}
            >
              {/* Card Header: Unit Name & Status */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                      <span>{gen.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({gen.id})
                      </span>
                    </h4>
                    <span className="text-[9.5px] text-slate-400 block truncate max-w-[200px]">
                      {gen.model}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {statusBadge}
                    {healthBadge}
                  </div>
                </div>

                {/* Main Gauge + Core Telemetry */}
                <div className="flex items-center justify-between gap-2 py-2">
                  <div className="flex-1 flex justify-center">
                    <SvgGauge
                      value={gen.loadPercent}
                      maxValue={100}
                      label="Load"
                      unit="%"
                      size={110}
                      strokeWidth={8}
                      colorType="load"
                    />
                  </div>

                  {/* Vitals side column */}
                  <div className="flex-1 space-y-1.5 text-[10.5px]">
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/80 border border-white/[0.04]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-slate-500" />
                        Temp
                      </span>
                      <span
                        className={`font-bold ${
                          gen.temperatureC > 90
                            ? "text-rose-400"
                            : gen.temperatureC > 85
                            ? "text-amber-400"
                            : "text-slate-200"
                        }`}
                      >
                        {gen.temperatureC}°C
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/80 border border-white/[0.04]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-slate-500" />
                        Burn
                      </span>
                      <span className="font-bold text-amber-300">
                        {gen.fuelConsumptionLph} L/h
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/80 border border-white/[0.04]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        Runtime
                      </span>
                      <span className="font-bold text-slate-200">
                        {gen.runtimeHours.toLocaleString()}h
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/80 border border-white/[0.04]">
                      <span className="text-slate-400">Efficiency</span>
                      <span className="font-bold text-emerald-400">
                        {gen.efficiencyPercent > 0 ? `${gen.efficiencyPercent}%` : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer: Mechanical diagnostics */}
              <div className="pt-2 border-t border-white/[0.04] grid grid-cols-2 gap-2 text-[9px] text-slate-400">
                <div>
                  Oil Pressure:{" "}
                  <span className="text-slate-300 font-semibold">
                    {gen.oilPressureBar > 0 ? `${gen.oilPressureBar} bar` : "0 bar"}
                  </span>
                </div>
                <div>
                  Vibration:{" "}
                  <span
                    className={`font-semibold ${
                      gen.vibrationMmS > 3.0 ? "text-amber-400" : "text-slate-300"
                    }`}
                  >
                    {gen.vibrationMmS} mm/s
                  </span>
                </div>
                <div className="col-span-2 text-slate-400">
                  Next Service:{" "}
                  <span className="text-cyan-400 font-semibold">
                    in {gen.nextServiceHours} operating hours
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
