"use client";

import React, { useState } from "react";
import { RecommendedAction } from "@/features/simulation/types";
import {
  Lightbulb,
  CheckCircle2,
  Shield,
  Zap,
  Sliders,
  Fuel,
  Play,
  RotateCcw,
  Sparkles,
  Check,
} from "lucide-react";

interface RecommendedActionsViewProps {
  actions: RecommendedAction[];
  stationName: string;
}

export function RecommendedActionsView({
  actions,
  stationName,
}: RecommendedActionsViewProps) {
  // Interactive state for simulating mitigation execution
  const [appliedActions, setAppliedActions] = useState<Record<string, boolean>>({});

  const toggleApplyAction = (id: string) => {
    setAppliedActions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleApplyAll = () => {
    const all: Record<string, boolean> = {};
    actions.forEach((a) => {
      all[a.id] = true;
    });
    setAppliedActions(all);
  };

  const handleResetAll = () => {
    setAppliedActions({});
  };

  const appliedCount = Object.values(appliedActions).filter(Boolean).length;

  // Helper for action icon
  const getActionIcon = (actionableKey: string) => {
    switch (actionableKey) {
      case "START_BACKUP_GEN":
        return Zap;
      case "REDUCE_LOAD":
        return Sliders;
      case "SCHEDULE_RESUPPLY":
        return Fuel;
      default:
        return Shield;
    }
  };

  // Helper for priority pill styling
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-rose-950 text-rose-300 border-rose-500/70 shadow-[0_0_10px_rgba(244,63,94,0.2)]";
      case "HIGH":
        return "bg-amber-950 text-amber-300 border-amber-500/70 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
      default:
        return "bg-blue-950 text-blue-300 border-blue-500/70";
    }
  };

  return (
    <section
      aria-label="Recommended Actions Section"
      className="p-4 sm:p-5 rounded-2xl border border-cyan-500/30 bg-[#080d16]/95 backdrop-blur-md font-mono select-none flex flex-col gap-4 shadow-[0_0_20px_rgba(6,182,212,0.08)]"
    >
      {/* ── Section Header ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-cyan-200">
                RECOMMENDED ACTIONS
              </h3>
              <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
                {actions.length} DIRECTIVES
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Prescriptive mitigation protocols and operational directives for [{stationName}]
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2">
          {appliedCount > 0 && (
            <button
              type="button"
              onClick={handleResetAll}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/[0.08] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Mitigations</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleApplyAll}
            className="px-3 py-1 rounded-lg text-[10px] font-bold bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/50 flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)] cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Simulate All Mitigations</span>
          </button>
        </div>
      </div>

      {/* ── Mitigation Impact Active Banner ───────────────────────── */}
      {appliedCount > 0 && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs text-emerald-200 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>{appliedCount} Mitigation(s) Active in Simulation:</strong> Generator loads
              relieved, busbar stability recovered, and fuel burn trimmed.
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 font-bold text-emerald-300">
            STRESS RELIEVED
          </span>
        </div>
      )}

      {/* ── Actions List ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {actions.map((act, index) => {
          const isApplied = !!appliedActions[act.id];
          const ActionIcon = getActionIcon(act.actionableKey);

          return (
            <div
              key={act.id}
              className={`p-3.5 rounded-xl transition-all duration-200 flex flex-col justify-between gap-3 ${
                isApplied
                  ? "bg-emerald-950/20 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.12)]"
                  : "bg-slate-950/80 border border-white/[0.08] hover:border-cyan-500/40"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border mt-0.5 ${
                      isApplied
                        ? "bg-emerald-950 text-emerald-300 border-emerald-500/60"
                        : "bg-slate-900 text-cyan-400 border-white/[0.08]"
                    }`}
                  >
                    <ActionIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-cyan-400 font-bold">
                        #{index + 1}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                        {act.title}
                      </h4>
                    </div>
                    <span className="text-[9.5px] text-slate-400">
                      Authority: {act.suggestedBy}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[8.5px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${getPriorityBadge(
                    act.priority
                  )}`}
                >
                  {act.priority}
                </span>
              </div>

              {/* Description */}
              <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-white/[0.04]">
                {act.description}
              </p>

              {/* Expected Benefit & Interactive Action Toggle */}
              <div className="pt-2 border-t border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px]">
                <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[9.5px]">{act.expectedBenefit}</span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleApplyAction(act.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isApplied
                      ? "bg-emerald-950 text-emerald-200 border border-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/[0.1] hover:border-cyan-500/40"
                  }`}
                >
                  {isApplied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Mitigation Applied</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 text-cyan-400" />
                      <span>Simulate Mitigation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="pt-2 border-t border-white/[0.04] text-[9.5px] text-slate-400 flex items-center justify-between">
        <span>Generated by NCPOR Automated Antarctic Contingency Engine.</span>
        <span className="text-slate-500">Adheres to Antarctic Treaty Station Safety Code</span>
      </div>
    </section>
  );
}
