"use client";

import React, { useState } from "react";
import { OperationalInsight } from "@/features/analytics/types";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  Lightbulb,
} from "lucide-react";

interface OperationalInsightsPanelProps {
  insights: OperationalInsight[];
  stationName: string;
}

export function OperationalInsightsPanel({
  insights,
  stationName,
}: OperationalInsightsPanelProps) {
  const [filter, setFilter] = useState<"ALL" | "WARNING" | "NORMAL">("ALL");

  const filtered = insights.filter((ins) => {
    if (filter === "ALL") return true;
    if (filter === "WARNING") return ins.severity === "WARNING" || ins.severity === "CRITICAL";
    if (filter === "NORMAL") return ins.severity === "NORMAL" || ins.severity === "INFO";
    return true;
  });

  return (
    <section
      aria-label="Operational Insights"
      className="p-4 rounded-2xl border border-white/[0.08] bg-[#080d16]/90 backdrop-blur-md font-mono select-none flex flex-col gap-3.5"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              9. OPERATIONAL INSIGHTS & ADVISORIES — [{stationName}]
            </h3>
            <p className="text-[10px] text-slate-400">
              Subsystem Telemetry Diagnostics, Anomalies & Predictive Warnings
            </p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-slate-950 border border-white/[0.08] text-[10px]">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={`px-2 py-0.5 rounded cursor-pointer ${
              filter === "ALL"
                ? "bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ALL ({insights.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("WARNING")}
            className={`px-2 py-0.5 rounded cursor-pointer ${
              filter === "WARNING"
                ? "bg-amber-950 text-amber-300 font-bold border border-amber-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            WARNINGS
          </button>
          <button
            type="button"
            onClick={() => setFilter("NORMAL")}
            className={`px-2 py-0.5 rounded cursor-pointer ${
              filter === "NORMAL"
                ? "bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            NORMAL
          </button>
        </div>
      </div>

      {/* Insights List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((item) => {
          const isWarning = item.severity === "WARNING";
          const isCritical = item.severity === "CRITICAL";
          const isNormal = item.severity === "NORMAL";

          const borderStyle = isCritical
            ? "border-rose-500/40 bg-rose-950/15"
            : isWarning
            ? "border-amber-500/40 bg-amber-950/15"
            : "border-white/[0.05] bg-slate-950/60";

          const Icon = isCritical
            ? ShieldAlert
            : isWarning
            ? AlertTriangle
            : isNormal
            ? CheckCircle2
            : Info;

          const badgeColor = isCritical
            ? "bg-rose-950 text-rose-300 border-rose-500/50"
            : isWarning
            ? "bg-amber-950 text-amber-300 border-amber-500/50"
            : "bg-emerald-950 text-emerald-300 border-emerald-500/50";

          return (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border ${borderStyle} flex flex-col justify-between gap-2.5 transition-all`}
            >
              {/* Header: Badge, Category, Timestamp */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded border font-bold uppercase ${badgeColor} flex items-center gap-1`}
                  >
                    <Icon className="w-3 h-3" />
                    {item.severity}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {item.subsystem}
                  </span>
                </div>
                <span className="text-[9.5px] text-slate-400">{item.timestamp}</span>
              </div>

              {/* Title & Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-100 leading-snug">
                  {item.title}
                </h4>
                <p className="text-[10.5px] text-slate-300 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Recommendation Callout if available */}
              {item.recommendation && (
                <div className="p-2 rounded bg-amber-950/30 border border-amber-500/20 text-[9.5px] text-amber-200/90 leading-normal flex items-start gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300">Action: </span>
                    {item.recommendation}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
