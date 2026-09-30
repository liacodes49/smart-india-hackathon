"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { useStationStore } from "@/stores/useStationStore";
import { StationId } from "@repo/shared/enums";
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  Check,
  Building2,
  Sparkles,
  Calendar,
  X,
  FileText,
  Cpu,
} from "lucide-react";

interface MaintenanceItem {
  id: string;
  stationId: string;
  assetId: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  assignedTo?: string | null;
  scheduledDate?: string | null;
  completedDate?: string | null;
  notes?: string | null;
  createdAt: string;
}

export function MaintenanceManager() {
  const searchParams = useSearchParams();
  const urlAssetId = searchParams.get("assetId");
  const urlTitle = searchParams.get("title");
  const urlPriority = searchParams.get("priority");
  const urlAction = searchParams.get("action");
  const urlStationId = searchParams.get("stationId");

  const activeStation = useStationStore((s) => s.activeStation);
  const setActiveStation = useStationStore((s) => s.setActiveStation);

  const [selectedStation, setSelectedStation] = useState<string>(urlStationId || activeStation || "MAITRI");
  const [assetFilter, setAssetFilter] = useState<string | null>(urlAssetId && urlAction !== "create" ? urlAssetId : null);
  const [workOrders, setWorkOrders] = useState<MaintenanceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"RECOMMENDED" | "ACTIVE" | "ALL">("RECOMMENDED");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Station Assets State for Human-Readable Equipment Display & Selection
  const [stationAssets, setStationAssets] = useState<any[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");

  // New Work Order Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState("MEDIUM");
  const [newType, setNewType] = useState("CORRECTIVE");

  useEffect(() => {
    if (urlTitle) {
      setNewTitle(decodeURIComponent(urlTitle));
    }
    if (urlPriority) {
      setNewPriority(urlPriority.toUpperCase());
    }
    if (urlAssetId) {
      setSelectedAssetId(urlAssetId);
    }
    if (urlStationId && (urlStationId === "MAITRI" || urlStationId === "BHARATI")) {
      setSelectedStation(urlStationId);
    }
    if (urlAction === "create" || urlTitle) {
      setShowCreateModal(true);
      setActiveTab("ALL");
    }
  }, [urlTitle, urlPriority, urlAssetId, urlAction, urlStationId]);

  const fetchAssets = useCallback(async () => {
    try {
      const res = await (apiClient as any).client.get('/assets', { stationId: selectedStation, limit: 100 });
      const list = res?.data || [];
      if (list.length > 0) {
        setStationAssets(list);
        setSelectedAssetId(list[0].id);
        return;
      }
    } catch {}

    // Fallback: extract from sensors or digital twin
    try {
      const sensorsRes = await apiClient.sensors.list({ stationId: selectedStation, limit: 50 });
      const sensorList: any[] = (sensorsRes as any)?.data || [];
      const extracted: any[] = [];
      const seen = new Set<string>();
      sensorList.forEach((s) => {
        if (s.assetId && !seen.has(s.assetId)) {
          seen.add(s.assetId);
          extracted.push({
            id: s.assetId,
            name: s.asset?.name || s.name?.replace(/Sensor.*/i, 'Equipment') || `Equipment ${s.assetId.slice(0, 8)}`,
            category: s.category || "EQUIPMENT",
          });
        }
      });
      setStationAssets(extracted);
      if (extracted.length > 0) setSelectedAssetId(extracted[0].id);
    } catch (err) {
      console.warn("Could not load assets for maintenance:", err);
    }
  }, [selectedStation]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const assetNameMap = React.useMemo(() => {
    const map = new Map<string, string>();
    stationAssets.forEach((a) => {
      map.set(a.id, a.name);
    });
    return map;
  }, [stationAssets]);

  const fetchWorkOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.maintenance.list({ stationId: selectedStation, limit: 100 });
      const data = (res as any)?.data || [];
      setWorkOrders(data);
    } catch (err: any) {
      console.error("[MaintenanceManager] Error fetching maintenance records:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedStation]);

  useEffect(() => {
    fetchWorkOrders();
    const interval = setInterval(fetchWorkOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchWorkOrders]);

  const handleStationChange = (station: string) => {
    setSelectedStation(station);
    if (station === "MAITRI") setActiveStation(StationId.MAITRI);
    else if (station === "BHARATI") setActiveStation(StationId.BHARATI);
  };

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      await apiClient.maintenance.approve(id);
      await fetchWorkOrders();
      useStationStore.getState().recordTelemetryTick();
    } catch (err: any) {
      console.error("Failed to approve work order:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      setActionLoading(id);
      await apiClient.maintenance.update(id, {
        status: "COMPLETED",
        completedDate: new Date().toISOString(),
        notes: "Work completed & verified by Station Operations Engineer",
      });
      await fetchWorkOrders();
      // Tick store so alerts and telemetry refresh
      useStationStore.getState().recordTelemetryTick();
    } catch (err: any) {
      console.error("Failed to complete work order:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    try {
      setActionLoading("CREATE");
      const assetId = selectedAssetId || stationAssets[0]?.id || "1e948b14-5aeb-4c23-91ae-55e7cbc351b1";

      await apiClient.maintenance.create({
        stationId: selectedStation,
        assetId,
        title: newTitle,
        description: newDesc,
        type: newType,
        priority: newPriority,
        notes: "Scheduled via NCPOR Operations Console",
      });

      setShowCreateModal(false);
      setNewTitle("");
      setNewDesc("");
      await fetchWorkOrders();
      useStationStore.getState().recordTelemetryTick();
    } catch (err: any) {
      console.error("Failed to create work order:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredOrders = workOrders.filter((w) => {
    if (assetFilter && w.assetId !== assetFilter) return false;
    if (activeTab === "RECOMMENDED" && w.status !== "RECOMMENDED") return false;
    if (activeTab === "ACTIVE" && w.status === "RECOMMENDED") return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return w.title.toLowerCase().includes(q) || w.description.toLowerCase().includes(q);
    }
    return true;
  });

  const recommendedCount = workOrders.filter((w) => w.status === "RECOMMENDED").length;
  const pendingCount = workOrders.filter((w) => w.status === "PENDING" || w.status === "IN_PROGRESS").length;
  const completedCount = workOrders.filter((w) => w.status === "COMPLETED").length;

  return (
    <div className="flex-1 flex flex-col gap-5 font-mono select-none pb-12">
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-[#080d16]/95 border border-white/[0.08] backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold tracking-wider text-slate-100 uppercase">
                Antarctic Maintenance & Asset Health Manager
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
                HUMAN-IN-THE-LOOP AUTHORIZATION
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Automated AI predictions propose work orders $\rightarrow$ Station Engineer reviews & dispatches
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>NEW WORK ORDER</span>
          </button>

          <div className="flex items-center p-1 rounded-xl bg-[#040810] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => handleStationChange("MAITRI")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedStation === "MAITRI"
                  ? "bg-cyan-950 text-cyan-200 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              MAITRI
            </button>
            <button
              type="button"
              onClick={() => handleStationChange("BHARATI")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedStation === "BHARATI"
                  ? "bg-cyan-950 text-cyan-200 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              BHARATI
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Summary Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#080d16]/95 border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Automated AI Recommendations</span>
            <span className="text-2xl font-extrabold text-amber-300">{recommendedCount}</span>
          </div>
          <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
        </div>

        <div className="p-4 rounded-xl bg-[#080d16]/95 border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Work Orders</span>
            <span className="text-2xl font-extrabold text-cyan-400">{pendingCount}</span>
          </div>
          <Clock className="w-6 h-6 text-cyan-400" />
        </div>

        <div className="p-4 rounded-xl bg-[#080d16]/95 border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Completed Maintenance</span>
            <span className="text-2xl font-extrabold text-emerald-400">{completedCount}</span>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      {/* ── Tabs & Search Bar ────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-[#080d16]/95 border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-[#040810] border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setActiveTab("RECOMMENDED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "RECOMMENDED"
                ? "bg-amber-950 text-amber-200 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI RECOMMENDATIONS ({recommendedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "ACTIVE"
                ? "bg-cyan-950 text-cyan-200 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ACTIVE WORK ORDERS ({pendingCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "ALL"
                ? "bg-slate-800 text-slate-100 border border-white/[0.1]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ALL ({workOrders.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search work orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#040810] border border-white/[0.1] text-xs font-semibold text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* ── Active Asset Filter Chip ───────────────────────────────── */}
      {assetFilter && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-xs">
          <div className="flex items-center gap-2 text-cyan-200">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>
              FILTERED BY ASSET: <strong>{assetNameMap.get(assetFilter) || `Asset ${assetFilter.slice(0, 8)}`}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAssetFilter(null)}
            className="px-2.5 py-1 rounded-lg bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
          >
            <X className="w-3 h-3" />
            <span>CLEAR FILTER</span>
          </button>
        </div>
      )}

      {/* ── Work Order List Table / Cards ────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-[#080d16]/95 border border-white/[0.08] backdrop-blur-md shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Fetching work orders from database...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No work orders found matching selected tab [{activeTab}].
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const isRecommended = order.status === "RECOMMENDED";
              const isHigh = order.priority === "HIGH" || order.priority === "CRITICAL";
              const assetDisplayName =
                assetNameMap.get(order.assetId) || (order as any).assetName || `Asset #${order.assetId?.slice(0, 8) || 'N/A'}`;

              return (
                <div
                  key={order.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isRecommended
                      ? "bg-amber-950/20 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                      : isHigh
                      ? "bg-rose-950/20 border-rose-500/40"
                      : "bg-[#040810] border-white/[0.06]"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Priority Badge */}
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                            isHigh
                              ? "bg-rose-950 text-rose-300 border border-rose-500/50"
                              : "bg-amber-950 text-amber-300 border border-amber-500/50"
                          }`}
                        >
                          {order.priority}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            isRecommended
                              ? "bg-amber-500/20 text-amber-300"
                              : order.status === "COMPLETED"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-cyan-500/20 text-cyan-300"
                          }`}
                        >
                          {order.status}
                        </span>

                        <span className="text-[10px] text-slate-500">{order.type}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(order.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Human-Readable Target Asset */}
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{assetDisplayName}</span>
                      </div>

                      <h3 className="text-xs font-bold text-slate-100">{order.title}</h3>
                      <p className="text-[11px] text-slate-400">{order.description}</p>
                      {order.notes && (
                        <div className="text-[10px] text-slate-500 italic mt-1">{order.notes}</div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isRecommended && (
                        <button
                          type="button"
                          onClick={() => handleApprove(order.id)}
                          disabled={actionLoading === order.id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                        >
                          {actionLoading === order.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                          ) : (
                            <Check className="w-3 h-3 text-emerald-400" />
                          )}
                          <span>APPROVE WORK ORDER</span>
                        </button>
                      )}

                      {(order.status === "PENDING" || order.status === "IN_PROGRESS") && (
                        <button
                          type="button"
                          onClick={() => handleComplete(order.id)}
                          disabled={actionLoading === order.id}
                          className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                          title="Complete work order & auto-resolve linked alerts"
                        >
                          {actionLoading === order.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                          )}
                          <span>MARK COMPLETED</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Schedule Work Order Modal ────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#080d16] border border-white/[0.1] rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase">
                  Schedule New Work Order [{selectedStation}]
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkOrder} className="space-y-4">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                  Target Equipment / Asset
                </label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#040810] border border-white/[0.12] text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {stationAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} ({asset.category || "EQUIPMENT"})
                    </option>
                  ))}
                  {stationAssets.length === 0 && (
                    <option value="1e948b14-5aeb-4c23-91ae-55e7cbc351b1">
                      Primary Power Generator 1 (Diesel)
                    </option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                  Work Order Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inspect Generator Bearing Lubrication"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#040810] border border-white/[0.12] text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                  Description & Task Steps
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detailed instructions for station technicians..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#040810] border border-white/[0.12] text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#040810] border border-white/[0.12] text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                    Maintenance Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#040810] border border-white/[0.12] text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="PREVENTIVE">PREVENTIVE</option>
                    <option value="CORRECTIVE">CORRECTIVE</option>
                    <option value="PREDICTIVE">PREDICTIVE</option>
                    <option value="EMERGENCY">EMERGENCY</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading === "CREATE"}
                className="w-full py-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 font-bold text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {actionLoading === "CREATE" ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                ) : (
                  <Plus className="w-4 h-4 text-cyan-400" />
                )}
                <span>DISPATCH WORK ORDER TO STATION</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
