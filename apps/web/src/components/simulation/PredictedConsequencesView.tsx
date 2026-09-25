"use client";

import React from "react";
import { PredictedConsequence } from "@/features/simulation/types";
import { AlertSeverity } from "@repo/shared/enums";
import {
  Clock,
  Zap,
  Building2,
  Droplets,
  Flame,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";

interface PredictedConsequencesViewProps {
  consequences: PredictedConsequence[];
  stationName: string;
}

export function PredictedConsequencesView({
  consequences,
  stationName,
}: PredictedConsequencesViewProps) {
  // Helper for subsystem icon
  const getSubsystemIcon = (subsystem: string) => {
    if (subsystem.toLowerCase().includes("power") || subsystem.toLowerCase().includes("grid")) {
      return Zap;
    }
    if (subsystem.toLowerCase().includes("fuel") || subsystem.toLowerCase().includes("pol")) {
      return Flame;
    }
    if (subsystem.toLowerCase().includes("water") || subsystem.toLowerCase().includes("lake")) {
      return Droplets;
    }
    return Building2;
  };

  // Helper for severity badge
  const getSeverityBadge = (sev: AlertSeverity) => {
    switch (sev) {
      case AlertSeverity.EMERGENCY:
      case AlertSeverity.CRITICAL:
        return "bg-rose-950/90 text-rose-300 border-rose-500/70 shadow-[0_0_12px_rgba(244,63,94,0.25)]";
      case AlertSeverity.WARNING:
        return "bg-amber-950/90 text-amber-300 border-amber-500/70 shadow-[0_0_12px_rgba(245,158,11,0.2)]";
      default:
        return "bg-blue-950/90 text-blue-300 border-blue-500/70";
    }
  };

  return (
    <section
      aria-label="Predicted Consequences Section"
      className="p-4 sm:p-5 rounded-2xl border border-rose-500/30 bg-[#080d16]/95 backdrop-blur-md font-mono select-none flex flex-col gap-4 shadow-[0_0_20px_rgba(244,63,94,0.06)]"
    >
      {/* ── Section Header ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-950 border border-rose-500/50 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-rose-200">
                PREDICTED CONSEQUENCES
              </h3>
              <span className="text-[9px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40 font-bold">
                {consequences.length} CASCADES DETECTED
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Downstream physical domino effects and critical failure horizons for [{stationName}]
            </p>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-rose-400" />
          <span>Timeline: Immediate to T+72 Hours</span>
        </div>
      </div>

      {/* ── Consequences Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {consequences.map((c) => {
          const SubIcon = getSubsystemIcon(c.subsystem);
          const isCritical =
            c.severity === AlertSeverity.CRITICAL ||
            c.severity === AlertSeverity.EMERGENCY;

          return (
            <div
              key={c.id}
              className={`p-3.5 rounded-xl bg-slate-950/80 border transition-all duration-200 flex flex-col justify-between gap-3 ${
                isCritical
                  ? "border-rose-500/40 hover:border-rose-500/70 shadow-[0_0_15px_rgba(244,63,94,0.08)]"
                  : "border-amber-500/30 hover:border-amber-500/60"
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border mt-0.5 ${
                      isCritical
                        ? "bg-rose-950/80 border-rose-500/50 text-rose-400"
                        : "bg-amber-950/80 border-amber-500/50 text-amber-400"
                    }`}
                  >
                    <SubIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 leading-snug">
                      {c.title}
                    </h4>
                    <span className="text-[9.5px] text-slate-400">
                      Domain: [{c.subsystem}]
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-[8.5px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${getSeverityBadge(
                      c.severity
                    )}`}
                  >
                    {c.severity}
                  </span>
                  <span className="text-[9px] text-slate-400 flex items-center gap-1 font-semibold">
                    <Clock className="w-2.5 h-2.5 text-cyan-400" />
                    {c.timeHorizon}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-white/[0.04]">
                {c.description}
              </p>

              {/* Impact Metric & Secondary Impact Callout */}
              <div className="pt-2 border-t border-white/[0.04] flex flex-col gap-1.5 text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Primary Stress Parameter:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[9.5px] ${
                      isCritical
                        ? "bg-rose-950/80 text-rose-300 border border-rose-500/40"
                        : "bg-amber-950/80 text-amber-300 border border-amber-500/40"
                    }`}
                  >
                    {c.impactMetric}
                  </span>
                </div>

                {c.secondaryImpact && (
                  <div className="text-[9.5px] text-slate-400 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="text-slate-400 italic">
                      Cascade effect: {c.secondaryImpact}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
