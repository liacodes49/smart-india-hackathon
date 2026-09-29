"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useStationStore } from "@/stores/useStationStore";
import { STATIONS } from "@repo/shared/constants";
import { getStationLogistics, LogisticsAssetItem } from "@/features/logistics";
import { 
  Package, 
  Fuel, 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Search, 
  Crosshair, 
  ArrowUpRight, 
  Layers, 
  ShieldCheck, 
  Info,
  PackageSearch,
  Wrench
} from "lucide-react";

export function InventoryManagement() {
  const activeStation = useStationStore((s) => s.activeStation);
  const selectedAssetId = useStationStore((s) => s.selectedAssetId);
  const setSelectedAsset = useStationStore((s) => s.setSelectedAsset);
  const requestAssetFocus = useStationStore((s) => s.requestAssetFocus);

  const stationMeta = STATIONS[activeStation];
  const { kpis, assets: logisticsAssets } = getStationLogistics(activeStation);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const criticalCount = logisticsAssets.filter((a) => a.status === "CRITICAL").length;
  const warningCount = logisticsAssets.filter((a) => a.status === "WARNING").length;

  const handleFocus = (assetId: string) => {
    setSelectedAsset(assetId);
    requestAssetFocus(assetId);
  };

  const filteredAssets = logisticsAssets.filter((asset) => {
    if (categoryFilter === "CONSUMABLES") {
      return false;
    }
    if (categoryFilter === "FUEL" && asset.subType !== "CRYOGENIC_FUEL_STORAGE") {
      return false;
    }
    if (categoryFilter === "FLEET" && asset.subType !== "OVERLAND_FLEET") {
      return false;
    }
    if (statusFilter !== "ALL" && asset.status !== statusFilter) {
      return false;
    }
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      return (
        asset.name.toLowerCase().includes(q) ||
        asset.assetId.toLowerCase().includes(q) ||
        asset.subType.toLowerCase().includes(q) ||
        asset.locationZone.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: LogisticsAssetItem["status"]) => {
    switch (status) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border border-rose-500/50 bg-rose-950/80 text-rose-300">
            <Flame className="w-3 h-3 text-rose-400" /> CRITICAL
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border border-amber-500/50 bg-amber-950/80 text-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> LOW / WARNING
          </span>
        );
      case "NORMAL":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-500/40 bg-emerald-950/70 text-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> NORMAL
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
              EXPEDITION SUPPLY & POL
            </span>
            <span className="text-xs text-slate-400">
              {stationMeta.name} — LOGISTICS & MATERIAL TELEMETRY
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 uppercase mt-1 flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" />
            <span>LOGISTICS & INVENTORY</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Live Data Sync Indicator */}
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/[0.08] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">BUS SYNC:</span>
            <span className="text-slate-200 font-bold">10 Hz LIVE</span>
          </div>

          {/* Quick Cross Navigation to Maintenance */}
          <Link
            href="/maintenance"
            className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-[0_0_10px_rgba(6,182,212,0.15)]"
          >
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            <span>MAINTENANCE UI</span>
            <ArrowUpRight className="w-3 h-3 text-cyan-400" />
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 shrink-0">
        {/* Total Logistics Assets */}
        <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#080d16]/90 backdrop-blur-md">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Logistics Assets</span>
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            {logisticsAssets.length}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Active POL & Depot units
          </p>
        </div>

        {/* Fuel / POL Availability */}
        <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#080d16]/90 backdrop-blur-md">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Fuel className="w-3.5 h-3.5 text-emerald-400" />
            <span>POL Fuel Reserve</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2 flex items-baseline gap-1.5">
            <span>{kpis.fuelReserveDays}</span>
            <span className="text-xs text-slate-400 font-normal">Days Autonomy</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
            <span>Burn Delta:</span>
            <span className={kpis.fuelReserveTrend < 0 ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
              {kpis.fuelReserveTrend > 0 ? "+" : ""}{kpis.fuelReserveTrend.toFixed(1)} d/hr
            </span>
          </p>
        </div>

        {/* Logistics Readiness */}
        <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#080d16]/90 backdrop-blur-md">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Logistics Readiness</span>
          </div>
          <div className="text-2xl font-bold text-cyan-300 mt-2 flex items-baseline gap-1">
            <span>{kpis.logisticsReadiness.toFixed(1)}%</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Convoy & base support readiness
          </p>
        </div>

        {/* Critical / Low Stock Alert Items */}
        <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#080d16]/90 backdrop-blur-md">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Critical / Low Stock</span>
          </div>
          <div className={`text-2xl font-bold mt-2 ${criticalCount > 0 ? "text-rose-400" : warningCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
            {criticalCount + warningCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {criticalCount > 0 ? `${criticalCount} Critical alert active` : warningCount > 0 ? `${warningCount} Low warning active` : "All reserves nominal"}
          </p>
        </div>

        {/* Supplies / Consumables Status */}
        <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#080d16]/90 backdrop-blur-md">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <PackageSearch className="w-3.5 h-3.5 text-slate-400" />
            <span>Itemized Consumables</span>
          </div>
          <div className="text-sm font-bold text-slate-400 flex items-center gap-1.5 mt-3">
            <span className="w-2 h-2 rounded-full bg-slate-600" />
            <span>API Disconnected</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Endpoint not in backend
          </p>
        </div>
      </div>

      {/* Main Inventory Section: Search & Filters */}
      <div className="rounded-xl border border-white/[0.08] bg-[#070b14]/90 flex-1 flex flex-col min-h-0">
        <div className="p-3.5 border-b border-white/[0.08]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-200 text-sm font-bold flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-400" />
                <span>EXPEDITION INVENTORY & POL ASSET REGISTER ({activeStation})</span>
              </span>
              <span className="text-[10px] py-0 px-2 rounded border text-slate-400 border-slate-700 bg-slate-900 font-mono">
                {activeStation === "MAITRI" ? "Schirmacher Oasis" : "Larsemann Hills"}
              </span>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Category tabs */}
              <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("ALL")}
                  className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                    categoryFilter === "ALL"
                      ? "bg-cyan-950 text-cyan-200 font-bold border border-cyan-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  ALL LOGISTICS
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("FUEL")}
                  className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                    categoryFilter === "FUEL"
                      ? "bg-cyan-950 text-cyan-200 font-bold border border-cyan-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  POL / FUEL
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("FLEET")}
                  className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                    categoryFilter === "FLEET"
                      ? "bg-cyan-950 text-cyan-200 font-bold border border-cyan-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  OVERLAND FLEET
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("CONSUMABLES")}
                  className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                    categoryFilter === "CONSUMABLES"
                      ? "bg-cyan-950 text-cyan-200 font-bold border border-cyan-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  CONSUMABLES & SPARES
                </button>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-white/[0.08] rounded-lg text-xs text-slate-300 py-1.5 px-2.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="ALL">ALL STATUSES</option>
                <option value="NORMAL">NORMAL</option>
                <option value="WARNING">WARNING / LOW</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search item, ID, zone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-900 border border-white/[0.08] rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44 sm:w-52"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-0 flex-1 overflow-x-auto">
          {categoryFilter === "CONSUMABLES" ? (
            /* Explicit Empty State for Consumables & Spares (endpoint not implemented in backend) */
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/[0.08] flex items-center justify-center text-slate-400">
                <PackageSearch className="w-6 h-6" />
              </div>
              <div className="max-w-md">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                  No Itemized Consumable Data Available
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  The item-level inventory API endpoint for consumables, rations, and spare parts is not registered in the backend service. Only bulk POL fuel reserves and expedition fleet telemetry are currently connected via the station telemetry bus.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCategoryFilter("ALL")}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs text-slate-200 cursor-pointer mt-2"
              >
                View Available POL & Fleet Logistics
              </button>
            </div>
          ) : filteredAssets.length === 0 ? (
            /* Filter/Search Empty State */
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 gap-2">
              <Info className="w-6 h-6 text-slate-400" />
              <p className="text-xs text-slate-300 font-semibold">
                No inventory or logistics items match the current filter criteria.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("ALL");
                  setStatusFilter("ALL");
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer underline mt-1"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            /* Table of actual confirmed backend logistics assets */
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-white/[0.08] uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Item / Asset Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Current Quantity / Level</th>
                  <th className="py-2.5 px-3">Storage Location / Area</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Operational Directive</th>
                  <th className="py-2.5 px-3">Last Telemetry Sync</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-slate-300">
                {filteredAssets.map((asset) => {
                  const isFocused = selectedAssetId === asset.assetId;
                  const currentLevel = asset.tankLevelPct;
                  
                  return (
                    <tr
                      key={asset.assetId}
                      className={`transition-colors hover:bg-slate-900/50 ${
                        isFocused ? "bg-cyan-950/40 border-l-2 border-cyan-400" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          {asset.subType === "CRYOGENIC_FUEL_STORAGE" ? (
                            <Fuel className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Truck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          )}
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
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-[10px] py-0 px-1.5 rounded border border-slate-700 text-slate-300">
                          {asset.category}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-bold">
                        {currentLevel !== undefined ? (
                          <div className="flex flex-col gap-1 w-28">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className={currentLevel < 30 ? "text-rose-400" : currentLevel < 60 ? "text-amber-400" : "text-emerald-400"}>
                                {currentLevel.toFixed(1)}%
                              </span>
                              <span className="text-[9px] text-slate-400">CAPACITY</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  currentLevel < 30 ? "bg-rose-500" : currentLevel < 60 ? "bg-amber-500" : "bg-emerald-500"
                                }`}
                                style={{ width: `${Math.min(100, currentLevel)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Data unavailable</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-[11px]">
                        <div className="text-slate-300 truncate max-w-[180px]">
                          {asset.locationZone}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Coord: [{asset.position.join(", ")}]
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {getStatusBadge(asset.status)}
                      </td>

                      <td className="py-3 px-3 text-[11px] text-slate-400 max-w-[240px]">
                        <p className="line-clamp-2 leading-relaxed">
                          {asset.recommendedAction || "Nominal operations."}
                        </p>
                      </td>

                      <td className="py-3 px-3 text-[10px] text-slate-400">
                        {new Date(asset.lastUpdated).toISOString().slice(11, 19)} UTC
                      </td>

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
                            title="Select and Lock Asset in Digital Twin"
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
