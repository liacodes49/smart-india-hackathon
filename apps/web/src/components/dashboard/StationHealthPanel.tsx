"use client";

import React from "react";
import { useStationStore } from "@/stores/useStationStore";
import { useLiveTelemetry } from "@/lib/hooks/useLiveTelemetry";
import { Activity, Zap, Building2, Truck, Wind, Wifi, ShieldAlert, CheckCircle2 } from "lucide-react";

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
  const { stationHealthScore, riskLevel, riskAssessment, edgeStatus, loading } = useLiveTelemetry(activeStation);

  // Compute live 0-100 health metrics from risk pillars
  const domainHealthMap: Record<string, { health: number; statusText: string; level: string }> = React.useMemo(() => {
    const energyRisk = riskAssessment?.pillars?.energy?.score ?? 20;
    const equipRisk = riskAssessment?.pillars?.equipment?.score ?? 15;
    const supplyRisk = riskAssessment?.pillars?.supply?.score ?? 25;
    const weatherRisk = riskAssessment?.pillars?.weather?.score ?? 35;
    const connHealth = edgeStatus === "ONLINE" ? 98 : edgeStatus === "DEGRADED" ? 55 : 15;

    return {
      energy: {
        health: Math.max(0, Math.min(100, Math.round(100 - energyRisk))),
        statusText: riskAssessment?.pillars?.energy?.level ? `${riskAssessment.pillars.energy.level} RISK` : "NORMAL",
        level: riskAssessment?.pillars?.energy?.level || "LOW",
      },
      infrastructure: {
        health: Math.max(0, Math.min(100, Math.round(100 - equipRisk))),
        statusText: riskAssessment?.pillars?.equipment?.level ? `${riskAssessment.pillars.equipment.level} RISK` : "NORMAL",
        level: riskAssessment?.pillars?.equipment?.level || "LOW",
      },
      logistics: {
        health: Math.max(0, Math.min(100, Math.round(100 - supplyRisk))),
        statusText: riskAssessment?.pillars?.supply?.level ? `${riskAssessment.pillars.supply.level} RISK` : "NORMAL",
        level: riskAssessment?.pillars?.supply?.level || "LOW",
      },
      environment: {
        health: Math.max(0, Math.min(100, Math.round(100 - weatherRisk))),
        statusText: riskAssessment?.pillars?.weather?.level ? `${riskAssessment.pillars.weather.level} RISK` : "NORMAL",
        level: riskAssessment?.pillars?.weather?.level || "LOW",
      },
      connectivity: {
        health: connHealth,
        statusText: edgeStatus,
        level: edgeStatus === "ONLINE" ? "LOW" : edgeStatus === "DEGRADED" ? "MEDIUM" : "CRITICAL",
      },
    };
  }, [riskAssessment, edgeStatus]);

  const getHealthColorClass = (health: number) => {
    if (health >= 80) return { bar: "bg-emerald-500", text: "text-emerald-400", badge: "bg-emerald-950/80 text-emerald-300 border-emerald-600/40" };
    if (health >= 60) return { bar: "bg-cyan-500", text: "text-cyan-400", badge: "bg-cyan-950/80 text-cyan-300 border-cyan-600/40" };
    if (health >= 40) return { bar: "bg-amber-500", text: "text-amber-400", badge: "bg-amber-950/80 text-amber-300 border-amber-600/40" };
    return { bar: "bg-rose-500", text: "text-rose-400", badge: "bg-rose-950/80 text-rose-300 border-rose-600/40" };
  };

  const topDriver = riskAssessment?.topDrivers?.[0];

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

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-100">
            {stationHealthScore}%
          </span>
          <span className={`text-[9.5px] px-2 py-0.5 rounded border font-semibold ${
            riskLevel === "LOW" ? "bg-emerald-950/80 text-emerald-300 border-emerald-600/40" :
            riskLevel === "MEDIUM" ? "bg-amber-950/80 text-amber-300 border-amber-600/40" :
            "bg-rose-950/80 text-rose-300 border-rose-600/40"
          }`}>
            {riskLevel} RISK
          </span>
        </div>
      </div>

      {/* 5 Health Domains List */}
      <div className="mt-3 space-y-2.5">
        {HEALTH_DOMAINS.map((domain) => {
          const Icon = domain.icon;
          const metric = domainHealthMap[domain.id] || { health: 85, statusText: "ONLINE", level: "LOW" };
          const styling = getHealthColorClass(metric.health);

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
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold ${styling.text}`}>
                    {metric.health}%
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase">
                    [{metric.statusText}]
                  </span>
                </div>
              </div>

              {/* Real-time Dynamic Progress Track */}
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${styling.bar}`}
                  style={{ width: `${metric.health}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Panel Footer: Real Driver telemetry */}
      <div className="mt-4 pt-2.5 border-t border-white/[0.04] text-[9.5px] text-slate-400 flex items-center justify-between gap-2">
        {topDriver ? (
          <div className="flex items-center gap-1.5 truncate text-amber-300/90">
            <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">Driver: {topDriver.factor} ({topDriver.impact})</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-emerald-400/90">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>All systems nominal • Telemetry synchronized</span>
          </div>
        )}
        <span className="text-slate-400 shrink-0">Live 4-Pillar Model</span>
      </div>
    </section>
  );
}