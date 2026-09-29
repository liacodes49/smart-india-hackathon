"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useStationStore } from "@/stores/useStationStore";
import { STATIONS } from "@repo/shared/constants";
import { getStationEquipment, EquipmentAsset } from "@/features/maintenance";
import { 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Search, 
  Crosshair, 
  ArrowUpRight, 
  Cpu, 
  Info,
  Package
} from "lucide-react";

export function MaintenanceManagement() {
  const activeStation = useStationStore((s) => s.activeStation);
  const selectedAssetId = useStationStore((s) => s.selectedAssetId);
  const setSelectedAsset = useStationStore((s) => s.setSelectedAsset);
  const requestAssetFocus = useStationStore((s) => s.requestAssetFocus);

  const stationMeta = STATIONS[activeStation];
  const equipment = getStationEquipment(activeStation);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");

  // Summary Metrics
  const totalMonitored = equipment.length;
  const healthyCount = equipment.filter((a) => a.status === "NORMAL").length;
  const attentionCount = equipment.filter((a) => a.status === "WARNING").length;
  const criticalDueCount = equipment.filter((a) => a.status === "CRITICAL" || a.status === "OFFLINE").length;

  const handleFocus = (assetId: string) => {
    setSelectedAsset(assetId);
    requestAssetFocus(assetId);
  };

  // Filter Assets
  const filteredAssets = equipment.filter((asset) => {
    if (categoryFilter !== "ALL" && asset.category !== categoryFilter) {
      return false;
    }
    if (statusFilter !== "ALL") {
      if (statusFilter === "HEALTHY" && asset.status !== "NORMAL") return false;
      if (statusFilter === "ATTENTION" && asset.status !== "WARNING") return false;
      if (statusFilter === "DUE" && asset.status !== "CRITICAL" && asset.status !== "OFFLINE") return false;
    }
    if (riskFilter !== "ALL") {
      const prob = asset.prediction?.failureProbability72h;
      if (prob === undefined) return false;
      if (riskFilter === "HIGH" && prob < 0.5) return false;
      if (riskFilter === "MEDIUM" && (prob < 0.1 || prob >= 0.5)) return false;
      if (riskFilter === "LOW" && prob >= 0.1) return false;
    }
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      return (
        asset.name.toLowerCase().includes(q) ||
        asset.assetId.toLowerCase().includes(q) ||
        asset.subType.toLowerCase().includes(q) ||
        asset.spatial.boundingZone.toLowerCase().includes(q) ||
        (asset.prediction?.recommendedAction && asset.prediction.recommendedAction.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getMaintenanceStatusBadge = (status: EquipmentAsset["status"]) => {
    switch (status) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border border-rose-500/50 bg-rose-950/80 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse">
            <Flame className="w-3 h-3 text-rose-400" /> MAINTENANCE DUE / CRITICAL
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border border-amber-500/50 bg-amber-950/80 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.25)]">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> ATTENTION REQUIRED
          </span>
        );
      case "NORMAL":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-500/40 bg-emerald-950/70 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> HEALTHY
          </span>
        );
      case "OFFLINE":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border border-slate-700 bg-slate-800 text-slate-400">
            OFFLINE
          </span>
        );
      default:
        return <span className="text-[10px] text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-4 font-mono select-none overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-mono font-medium border-cyan-500/30 bg-cyan-950/60 text-cyan-300">
              EQUIPMENT RELIABILITY & APM
            </span>
            <span className="text-xs text-slate-400">
              {stationMeta.name} — EXPEDITION ASSET PREDICTIVE MAINTENANCE
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 uppercase mt-1 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            <span>EQUIPMENT PREDICTIVE MAINTENANCE</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Active Station Link Indicator */}
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/[0.08] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">TELEMETRY:</span>
            <span className="text-slate-200 font-bold">10 Hz LIVE</span>
          </div>

          {/* Quick Cross Navigation to Logistics & Inventory */}
          <Link
            href="/inventory"
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Package className="w-3.5 h-3.5 text-cyan-400" />
            <span>LOGISTICS & INVENTORY</span>
            <ArrowUpRight className="w-3 h-3 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {/* Equipment Monitored */}
        <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#080d16]/90 backdrop-blur-md">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Equipment Monitored</span>
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            {totalMonitored}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Telemetric subsystem assets in {activeStation}
          </p>
        </div>

        {/* Healthy Equipment */}
        <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#080d16]/90 backdrop-blur-md">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Healthy Equipment</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            {healthyCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Nominal status ({totalMonitored > 0 ? ((healthyCount / totalMonitored) * 100).toFixed(0) : 0}% of fleet)
          </p>
        </div>

        {/* Attention Required */}
        <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#080d16]/90 backdrop-blur-md">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Attention Required</span>
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">
            {attentionCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Warning threshold or parameter deviation
          </p>
        </div>

        {/* Critical / Maintenance Due */}
        <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#080d16]/90 backdrop-blur-md">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Critical / Maintenance Due</span>
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">
            {criticalDueCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {criticalDueCount > 0 ? "Immediate preventive intervention required" : "Zero critical excursions"}
          </p>
        </div>
      </div>

      {/* Main Equipment Table & Filters */}
      <div className="rounded-xl border border-white/[0.08] bg-[#070b14]/90 flex-1 flex flex-col min-h-0">
        <div className="p-3.5 border-b border-white/[0.08]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-200 text-sm font-bold flex items-center gap-2">
                <Wrench className="w-4 h-4 text-cyan-400" />
                <span>PREDICTIVE HEALTH & MAINTENANCE SCHEDULE ({activeStation})</span>
              </span>
              <span className="text-[10px] py-0 px-2 rounded border text-cyan-300 border-cyan-500/30 bg-cyan-950/40 font-mono">
                AI POLAR TWIN
              </span>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-900 border border-white/[0.08] rounded-lg text-xs text-slate-300 py-1.5 px-2.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="ALL">ALL CATEGORIES</option>
                <option value="ENERGY">ENERGY</option>
                <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
                <option value="LOGISTICS">LOGISTICS</option>
                <option value="ENVIRONMENT">ENVIRONMENT</option>
                <option value="CONNECTIVITY">CONNECTIVITY</option>
              </select>

              {/* Maintenance Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-white/[0.08] rounded-lg text-xs text-slate-300 py-1.5 px-2.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="ALL">ALL STATUSES</option>
                <option value="HEALTHY">HEALTHY</option>
                <option value="ATTENTION">ATTENTION REQUIRED</option>
                <option value="DUE">MAINTENANCE DUE / CRITICAL</option>
              </select>

              {/* Risk Level Filter */}
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="bg-slate-900 border border-white/[0.08] rounded-lg text-xs text-slate-300 py-1.5 px-2.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="ALL">ALL RISK LEVELS</option>
                <option value="HIGH">HIGH RISK (&gt;50%)</option>
                <option value="MEDIUM">MEDIUM RISK (10-50%)</option>
                <option value="LOW">LOW RISK (&lt;10%)</option>
              </select>

              {/* Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search equipment, task, ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-900 border border-white/[0.08] rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44 sm:w-56"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-0 flex-1 overflow-x-auto">
          {filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 gap-2">
              <Info className="w-6 h-6 text-slate-500" />
              <p className="text-xs text-slate-300 font-semibold">
                No equipment records found matching the specified filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("ALL");
                  setStatusFilter("ALL");
                  setRiskFilter("ALL");
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer underline mt-1"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-white/[0.08] uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Equipment Name / ID</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Station</th>
                  <th className="py-2.5 px-3">Health Score</th>
                  <th className="py-2.5 px-3">Maintenance Status</th>
                  <th className="py-2.5 px-3">72h Fail Prob.</th>
                  <th className="py-2.5 px-3">Est. Time to Failure</th>
                  <th className="py-2.5 px-3">Operating Hours</th>
                  <th className="py-2.5 px-3">Pending Maintenance Task</th>
                  <th className="py-2.5 px-3">Scheduled Maint.</th>
                  <th className="py-2.5 px-3">Last Sync</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-slate-300">
                {filteredAssets.map((asset) => {
                  const isFocused = selectedAssetId === asset.assetId;
                  const prob = asset.prediction?.failureProbability72h;
                  const rul = asset.prediction?.estimatedTimeToFailureHours;
                  const opHours = asset.metrics?.operatingHours;

                  return (
                    <tr
                      key={asset.assetId}
                      className={`transition-colors hover:bg-slate-900/50 ${
                        isFocused ? "bg-cyan-950/40 border-l-2 border-cyan-400" : ""
                      }`}
                    >
                      {/* Equipment Name / ID */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          <span>{asset.name}</span>
                          {isFocused && (
                            <span className="text-[9px] py-0 px-1 rounded border border-cyan-400 text-cyan-300">
                              LOCKED
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-cyan-400">
                          {asset.assetId} • {asset.subType}
                        </div>
                        <div className="text-[9px] text-slate-400">
                          Zone: {asset.spatial.boundingZone}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="text-[10px] py-0 px-1.5 rounded border border-slate-700 text-slate-300">
                          {asset.category}
                        </span>
                      </td>

                      {/* Station */}
                      <td className="py-3 px-3 text-[11px] text-slate-300">
                        {asset.stationId}
                      </td>

                      {/* Health Status / Score */}
                      <td className="py-3 px-3 font-bold">
                        <div className="flex flex-col gap-1 w-20">
                          <span
                            className={
                              asset.healthIndex < 60
                                ? "text-rose-400"
                                : asset.healthIndex < 80
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }
                          >
                            {asset.healthIndex.toFixed(1)}%
                          </span>
                          <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                asset.healthIndex < 60
                                  ? "bg-rose-500"
                                  : asset.healthIndex < 80
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(100, asset.healthIndex)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Maintenance Status */}
                      <td className="py-3 px-3">
                        {getMaintenanceStatusBadge(asset.status)}
                      </td>

                      {/* Predicted Failure Probability */}
                      <td className="py-3 px-3 font-bold">
                        {prob !== undefined ? (
                          <span className={prob > 0.5 ? "text-rose-400" : prob > 0.15 ? "text-amber-400" : "text-slate-300"}>
                            {(prob * 100).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Data unavailable</span>
                        )}
                      </td>

                      {/* Estimated Time to Failure */}
                      <td className="py-3 px-3 text-[11px]">
                        {rul !== undefined ? (
                          <span className={rul < 24 ? "text-rose-400 font-bold" : rul < 72 ? "text-amber-400" : "text-slate-300"}>
                            {rul.toFixed(1)} hrs
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Data unavailable</span>
                        )}
                      </td>

                      {/* Operating Hours */}
                      <td className="py-3 px-3 text-[11px] text-slate-300">
                        {opHours !== undefined ? (
                          <span>{opHours.toLocaleString()} hrs</span>
                        ) : (
                          <span className="text-slate-400 text-xs">Data unavailable</span>
                        )}
                      </td>

                      {/* Pending Maintenance Task */}
                      <td className="py-3 px-3 text-[11px] text-slate-400 max-w-[220px]">
                        <p className="line-clamp-2 leading-relaxed">
                          {asset.prediction?.recommendedAction || "Pending"}
                        </p>
                      </td>

                      {/* Scheduled Maintenance (not in backend schema) */}
                      <td className="py-3 px-3 text-[10px] text-slate-400">
                        Data unavailable
                      </td>

                      {/* Last Telemetry Sync - Deterministic UTC format (avoids React hydration mismatch) */}
                      <td className="py-3 px-3 text-[10px] text-slate-400">
                        {new Date(asset.lastUpdated).toISOString().slice(11, 19)} UTC
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleFocus(asset.assetId)}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer border ${
                              isFocused
                                ? "bg-cyan-950 text-cyan-200 border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.25)]"
                                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-white/[0.08]"
                            }`}
                            title="Locate and lock target in Digital Twin"
                          >
                            <Crosshair className="w-3 h-3 text-cyan-400" />
                            <span>{isFocused ? "LOCKED" : "LOCATE"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
