"use client";

import React from "react";
import { StationHealthRiskData } from "@/features/analytics/types";
import { SvgGauge } from "./charts/SvgGauge";
import {
  Activity,
  Zap,
  Building2,
  Wind,
  Truck,
  Wifi,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface StationHealthRiskPanelProps {
  healthRisk: StationHealthRiskData;
  stationName: string;
}

export function StationHealthRiskPanel({
  healthRisk,
  stationName,
}: StationHealthRiskPanelProps) {
  const domains = [
    {
      domain: healthRisk.domains.energy,
      icon: Zap,
      color: "text-amber-400",
    },
    {
      domain: healthRisk.domains.infrastructure,
      icon: Building2,
      color: "text-blue-400",
    },
    {
      domain: healthRisk.domains.environment,
      icon: Wind,
      color: "text-cyan-400",
    },
    {
      domain: healthRisk.domains.logistics,
      icon: Truck,
      color: "text-indigo-400",
    },
    {
      domain: healthRisk.domains.communications,
      icon: Wifi,
      color: "text-purple-400",
    },
    {
      domain: healthRisk.domains.safety,
      icon: ShieldCheck,
      color: "text-emerald-400",
    },
  ];

  return (
    <section
      aria-label="Station Health and Risk"
      className="p-4 rounded-2xl border border-white/[0.08] bg-[#080d16]/90 backdrop-blur-md font-mono select-none flex flex-col gap-3.5"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              6. STATION HEALTH & COMPOSITE RISK ASSESSMENT — [{stationName}]
            </h3>
            <p className="text-[10px] text-slate-400">
              Multi-Domain Subsystem Evaluation & Failure Probability Analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9.5px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold">
            HEALTH: {healthRisk.overallHealthScore}/100
          </span>
          <span
            className={`text-[9.5px] px-2 py-0.5 rounded border font-bold ${
              healthRisk.riskLevel === "LOW"
                ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                : healthRisk.riskLevel === "MODERATE"
                ? "bg-amber-950/60 border-amber-500/40 text-amber-300"
                : "bg-rose-950/60 border-rose-500/40 text-rose-300"
            }`}
          >
            RISK: {healthRisk.riskLevel} ({healthRisk.riskScore}/100)
          </span>
        </div>
      </div>

      {/* Main Grid: Overall Gauges (Left) + 6 Subsystem Domains (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-center">
        {/* Left 4 cols: Dual Gauges for Health & Risk */}
        <div className="lg:col-span-4 p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.05] flex flex-col items-center justify-between gap-3">
          <div className="w-full text-left pb-1.5 border-b border-white/[0.06]">
            <h4 className="text-xs font-bold text-slate-200">Overall Mission Readiness</h4>
            <span className="text-[9.5px] text-slate-400">Composite Index Assessment</span>
          </div>

          <div className="flex items-center justify-around w-full py-1">
            <div className="flex flex-col items-center">
              <SvgGauge
                value={healthRisk.overallHealthScore}
                maxValue={100}
                label="Health"
                unit="/100"
                size={115}
                strokeWidth={9}
                colorType="health"
              />
              <span className="text-[10px] text-emerald-400 font-semibold mt-1">
                Station Status: {healthRisk.overallHealthStatus}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <SvgGauge
                value={healthRisk.riskScore}
                maxValue={100}
                label="Risk"
                unit="/100"
                size={115}
                strokeWidth={9}
                colorType="risk"
              />
              <span
                className={`text-[10px] font-semibold mt-1 ${
                  healthRisk.riskLevel === "LOW"
                    ? "text-emerald-400"
                    : healthRisk.riskLevel === "MODERATE"
                    ? "text-amber-400"
                    : "text-rose-400"
                }`}
              >
                Severity: {healthRisk.riskLevel}
              </span>
            </div>
          </div>

          {/* Risk Factors breakdown mini list */}
          <div className="w-full pt-2 border-t border-white/[0.04] space-y-1.5 text-[9.5px]">
            <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">
              Top Vulnerability Drivers:
            </span>
            {healthRisk.riskBreakdown.slice(0, 2).map((rb, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 text-slate-300">
                <span className="truncate">{rb.category}</span>
                <span className="text-amber-400 font-semibold shrink-0">
                  {rb.score}/100
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right 8 cols: 6 Individual Subsystem Domains */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {domains.map(({ domain, icon: Icon, color }) => {
            const isHealthy = domain.status === "HEALTHY";
            const isWarning = domain.status === "WARNING";

            return (
              <div
                key={domain.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.05] flex flex-col justify-between gap-2 hover:border-white/[0.12] transition-colors"
              >
                {/* Title & Score */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-xs font-bold text-slate-200">
                      {domain.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">
                      {domain.score}%
                    </span>
                    {isHealthy ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      domain.score >= 85
                        ? "bg-emerald-500"
                        : domain.score >= 70
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${domain.score}%` }}
                  />
                </div>

                {/* Subsystems pills */}
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {domain.subsystems.map((sub, i) => (
                    <span
                      key={i}
                      className="text-[8.5px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
