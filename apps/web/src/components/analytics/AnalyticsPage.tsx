"use client";

import React, { useState } from "react";
import { useStationStore } from "@/stores/useStationStore";
import { StationId } from "@repo/shared/enums";
import { useAnalyticsData } from "@/lib/hooks/useAnalyticsData";
import { StationViewMode } from "@/features/analytics/types";
import { AnalyticsKpiOverview } from "./AnalyticsKpiOverview";
import { EnergyAnalyticsPanel } from "./EnergyAnalyticsPanel";
import { GeneratorPerformancePanel } from "./GeneratorPerformancePanel";
import { FuelAnalyticsPanel } from "./FuelAnalyticsPanel";
import { EnvironmentalAnalyticsPanel } from "./EnvironmentalAnalyticsPanel";
import { StationHealthRiskPanel } from "./StationHealthRiskPanel";
import { ForecastsPanel } from "./ForecastsPanel";
import { StationComparisonPanel } from "./StationComparisonPanel";
import { OperationalInsightsPanel } from "./OperationalInsightsPanel";
import { CrossDomainImpactPanel } from "./CrossDomainImpactPanel";
import { Station3DAnalyticsView } from "./Station3DAnalyticsView";
import {
  BarChart3,
  Scale,
  RefreshCw,
  Radio,
} from "lucide-react";

export function AnalyticsPage() {
  const activeStation = useStationStore((s) => s.activeStation);
  const setActiveStation = useStationStore((s) => s.setActiveStation);

  // Station view mode: MAITRI | BHARATI | BOTH
  const [stationViewMode, setStationViewMode] = useState<StationViewMode>(
    (activeStation as StationViewMode) || "MAITRI"
  );

  const handleSelectStationMode = (mode: StationViewMode) => {
    setStationViewMode(mode);
    if (mode === "MAITRI") {
      setActiveStation(StationId.MAITRI);
    } else if (mode === "BHARATI") {
      setActiveStation(StationId.BHARATI);
    }
  };

  // Live backend-connected analytics hook
  const {
    currentDataset,
    maitriDataset,
    bharatiDataset,
    comparison,
    loading,
    isLive,
    lastUpdated,
    refetch,
  } = useAnalyticsData(stationViewMode);


  return (
    <div className="flex-1 flex flex-col gap-5 h-full min-h-0 select-none font-mono pb-12">
      {/* ── Page Header Bar ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-[#080d16]/95 border border-white/[0.08] backdrop-blur-md shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-wider text-slate-100 uppercase">
                Antarctic Telemetry & Operational Analytics
              </h1>
              <p className="text-[10.5px] text-slate-400">
                NCPOR Mission Digital Twin — High-Density Engineering Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Right Header Status & Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Live Sync Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#040810] border border-white/[0.08] text-[11px]">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLive ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-emerald-500' : 'bg-cyan-500'}`} />
            </span>
            <span className="font-bold text-slate-300">
              {isLive ? 'LIVE TWIN SYNC' : 'CONNECTING...'}
            </span>
            {lastUpdated && (
              <span className="text-[10px] text-slate-500 hidden sm:inline" suppressHydrationWarning>
                {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <button
              type="button"
              onClick={() => refetch()}
              disabled={loading}
              title="Refresh Analytics Data"
              className="p-1 rounded text-slate-400 hover:text-cyan-400 transition-colors ml-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>

          {/* Station Mode Segmented Selector: MAITRI | BHARATI | BOTH */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase hidden sm:inline">
              Station Filter:
            </span>
            <div
              className="flex items-center p-1 rounded-xl bg-[#040810] border border-white/[0.08]"
              role="tablist"
              aria-label="Analytics Station Selector"
            >
              <button
                type="button"
                role="tab"
                aria-selected={stationViewMode === "MAITRI"}
                onClick={() => handleSelectStationMode("MAITRI")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  stationViewMode === "MAITRI"
                    ? "bg-cyan-950 text-cyan-200 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    stationViewMode === "MAITRI" ? "bg-cyan-400" : "bg-slate-600"
                  }`}
                />
                <span>MAITRI</span>
                <span className="text-[9px] text-slate-400 hidden lg:inline">
                  (70°S)
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={stationViewMode === "BHARATI"}
                onClick={() => handleSelectStationMode("BHARATI")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  stationViewMode === "BHARATI"
                    ? "bg-cyan-950 text-cyan-200 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    stationViewMode === "BHARATI" ? "bg-cyan-400" : "bg-slate-600"
                  }`}
                />
                <span>BHARATI</span>
                <span className="text-[9px] text-slate-400 hidden lg:inline">
                  (69°S)
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={stationViewMode === "BOTH"}
                onClick={() => handleSelectStationMode("BOTH")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  stationViewMode === "BOTH"
                    ? "bg-gradient-to-r from-cyan-950 to-emerald-950 text-cyan-200 border border-cyan-500/60 shadow-[0_0_14px_rgba(6,182,212,0.3)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-cyan-400" />
                <span>BOTH (COMPARE)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 8. MAITRI VS BHARATI COMPARISON SECTION (Shown prominently when BOTH is selected) ── */}
      {stationViewMode === "BOTH" && (
        <div className="space-y-4">
          <StationComparisonPanel
            comparison={comparison}
            isExpandedOnly
          />

          {/* Dual Quick Cards when in BOTH mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-[#080d16]/80 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-bold text-cyan-300">
                  [MAITRI] Live Quick Summary
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Health: {maitriDataset.kpi.stationHealthScore}% | Risk: {maitriDataset.kpi.riskLevel}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2 text-[10.5px]">
                <div>
                  <span className="text-slate-400 text-[9.5px]">Demand:</span>
                  <div className="font-bold text-cyan-400">{maitriDataset.kpi.powerDemandKw} kW</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[9.5px]">Fuel Reserve:</span>
                  <div className="font-bold text-slate-200">{(maitriDataset.kpi.fuelRemainingLitres / 1000).toFixed(1)}k L ({maitriDataset.kpi.fuelDaysRemaining}d)</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[9.5px]">Temp:</span>
                  <div className="font-bold text-sky-300">{maitriDataset.kpi.temperatureC}°C</div>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-[#080d16]/80 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-bold text-emerald-300">
                  [BHARATI] Live Quick Summary
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Health: {bharatiDataset.kpi.stationHealthScore}% | Risk: {bharatiDataset.kpi.riskLevel}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2 text-[10.5px]">
                <div>
                  <span className="text-slate-400 text-[9.5px]">Demand:</span>
                  <div className="font-bold text-emerald-400">{bharatiDataset.kpi.powerDemandKw} kW</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[9.5px]">Fuel Reserve:</span>
                  <div className="font-bold text-slate-200">{(bharatiDataset.kpi.fuelRemainingLitres / 1000).toFixed(1)}k L ({bharatiDataset.kpi.fuelDaysRemaining}d)</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[9.5px]">Temp:</span>
                  <div className="font-bold text-sky-300">{bharatiDataset.kpi.temperatureC}°C</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ── 1. KPI OVERVIEW ─────────────────────────────────────────── */}
      <AnalyticsKpiOverview
        kpi={currentDataset.kpi}
        stationName={currentDataset.stationName}
      />

      {/* ── 2. ENERGY ANALYTICS ─────────────────────────────────────── */}
      <EnergyAnalyticsPanel
        energy={currentDataset.energy}
        stationName={currentDataset.stationName}
      />

      {/* ── INTERACTIVE 3D STATION ANALYTICS VIEWPORT ─────────────────── */}
      <Station3DAnalyticsView
        stationName={currentDataset.stationName}
        stationId={currentDataset.stationId}
      />

      {/* ── 3. GENERATOR PERFORMANCE ────────────────────────────────── */}
      <GeneratorPerformancePanel
        generators={currentDataset.generators}
        stationName={currentDataset.stationName}
      />

      {/* ── 4. FUEL ANALYTICS ───────────────────────────────────────── */}
      <FuelAnalyticsPanel
        fuel={currentDataset.fuel}
        stationName={currentDataset.stationName}
      />

      {/* ── 5. ENVIRONMENTAL ANALYTICS ──────────────────────────────── */}
      <EnvironmentalAnalyticsPanel
        environmental={currentDataset.environmental}
        stationName={currentDataset.stationName}
      />

      {/* ── 6. STATION HEALTH / RISK ────────────────────────────────── */}
      <StationHealthRiskPanel
        healthRisk={currentDataset.healthRisk}
        stationName={currentDataset.stationName}
      />

      {/* ── 7. FORECASTS ────────────────────────────────────────────── */}
      <ForecastsPanel
        forecasts={currentDataset.forecasts}
        stationName={currentDataset.stationName}
      />

      {/* ── 8. MAITRI VS BHARATI (If not already shown in BOTH mode, show toggleable reference) ── */}
      {stationViewMode !== "BOTH" && (
        <StationComparisonPanel
          comparison={comparison}
        />
      )}


      {/* ── 9. OPERATIONAL INSIGHTS ─────────────────────────────────── */}
      <OperationalInsightsPanel
        insights={currentDataset.insights}
        stationName={currentDataset.stationName}
      />

      {/* ── 10. CROSS-DOMAIN IMPACT CASCADE ─────────────────────────── */}
      <CrossDomainImpactPanel
        crossDomain={currentDataset.crossDomain}
        stationName={currentDataset.stationName}
      />
    </div>
  );
}
