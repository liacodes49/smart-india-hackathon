"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { useStationStore } from "@/stores/useStationStore";
import { StationId } from "@repo/shared/enums";
import {
  Bell,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Check,
  XCircle,
  Clock,
  Building2,
  Cpu,
  Wrench,
  X,
} from "lucide-react";

interface AlertItem {
  id: string;
  stationId: string;
  sensorId?: string | null;
  assetId?: string | null;
  title: string;
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL" | "EMERGENCY";
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED" | "ESCALATED" | "DISMISSED";
  category: string;
  createdAt: string;
  updatedAt: string;
  metadata?: any;
}

export function AlertsManager() {
  const searchParams = useSearchParams();
  const urlAssetId = searchParams.get("assetId");
  const urlStationId = searchParams.get("stationId");

  const activeStation = useStationStore((s) => s.activeStation);
  const setActiveStation = useStationStore((s) => s.setActiveStation);

  const [selectedStation, setSelectedStation] = useState<string>(urlStationId || activeStation || "MAITRI");
  const [assetFilter, setAssetFilter] = useState<string | null>(urlAssetId || null);
  const [stationAssets, setStationAssets] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [operatorNotes, setOperatorNotes] = useState<string>("");

  useEffect(() => {
    if (urlAssetId) {
      setAssetFilter(urlAssetId);
    }
    if (urlStationId && (urlStationId === "MAITRI" || urlStationId === "BHARATI")) {
      setSelectedStation(urlStationId);
    }
  }, [urlAssetId, urlStationId]);

  useEffect(() => {
    async function loadAssets() {
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
              name: s.asset?.name || s.name?.replace(/Sensor.*/i, "Equipment") || `Equipment ${s.assetId.slice(0, 8)}`,
            });
          }
        });
        setStationAssets(extracted);
      } catch (err) {
        console.warn("Could not load assets for alerts:", err);
      }
    }
    loadAssets();
  }, [selectedStation]);

  const assetNameMap = React.useMemo(() => {
    const map = new Map<string, string>();
    stationAssets.forEach((a) => {
      map.set(a.id, a.name);
    });
    return map;
  }, [stationAssets]);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.alerts.list({ stationId: selectedStation, limit: 100 });
      const alertData = (res as any)?.data || [];
      setAlerts(alertData);
    } catch (err: any) {
      console.error("[AlertsManager] Error fetching alerts:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedStation]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleStationChange = (station: string) => {
    setSelectedStation(station);
    if (station === "MAITRI") setActiveStation(StationId.MAITRI);
    else if (station === "BHARATI") setActiveStation(StationId.BHARATI);
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      setActionLoading(alertId);
      await apiClient.alerts.acknowledge(alertId, {
        acknowledgedBy: "00000000-0000-0000-0000-000000000000",
        notes: operatorNotes || "Acknowledged by Station Operator",
      });
      await fetchAlerts();
      setSelectedAlert(null);
    } catch (err: any) {
      console.error("Failed to acknowledge alert:", err?.message || err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      setActionLoading(alertId);
      await apiClient.alerts.resolve(alertId, {
        resolvedBy: "00000000-0000-0000-0000-000000000000",
        notes: operatorNotes || "Resolved after subsystem inspection",
      });
      await fetchAlerts();
      setSelectedAlert(null);
    } catch (err: any) {
      console.error("Failed to resolve alert:", err?.message || err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (assetFilter && a.assetId !== assetFilter) return false;
    if (severityFilter !== "ALL" && a.severity !== severityFilter) return false;
    if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.message.toLowerCase().includes(q);
    }
    return true;
  });

  const activeCount = alerts.filter((a) => a.status === "ACTIVE").length;
  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL" || a.severity === "EMERGENCY").length;

  return (
    <div className="flex-1 flex flex-col gap-5 font-mono select-none pb-12">
      {/* ── Header Bar ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-[#080d16]/95 border border-white/[0.08] backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.25)]">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold tracking-wider text-slate-100 uppercase">
                Antarctic Alert Storm & Safety Engine
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-950 text-rose-300 border border-rose-500/40">
                {activeCount} ACTIVE ALERTS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Deterministic threshold breaches, alert storm deduplication, and auto-recovery logging
            </p>
          </div>
        </div>

        {/* Station Filter Tabs & Refresh */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAlerts}
            className="p-2 rounded-xl bg-[#040810] border border-white/[0.08] text-slate-400 hover:text-cyan-400 cursor-pointer"
            title="Refresh Alerts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#080d16]/95 border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Alerts</span>
            <span className="text-2xl font-extrabold text-slate-100">{activeCount}</span>
          </div>
          <ShieldAlert className="w-6 h-6 text-rose-400" />
        </div>

        <div className="p-4 rounded-xl bg-[#080d16]/95 border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Critical / Emergency</span>
            <span className="text-2xl font-extrabold text-rose-400">{criticalCount}</span>
          </div>
          <AlertTriangle className="w-6 h-6 text-rose-500 animate-pulse" />
        </div>

        <div className="p-4 rounded-xl bg-[#080d16]/95 border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Acknowledged</span>
            <span className="text-2xl font-extrabold text-amber-300">
              {alerts.filter((a) => a.status === "ACKNOWLEDGED").length}
            </span>
          </div>
          <Clock className="w-6 h-6 text-amber-400" />
        </div>

        <div className="p-4 rounded-xl bg-[#080d16]/95 border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Resolved</span>
            <span className="text-2xl font-extrabold text-emerald-400">
              {alerts.filter((a) => a.status === "RESOLVED").length}
            </span>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      {/* ── Search & Filter Controls ────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-[#080d16]/95 border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search alerts by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#040810] border border-white/[0.1] text-xs font-semibold text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Severity & Status Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Severity:</span>
            {["ALL", "CRITICAL", "WARNING", "INFO"].map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                  severityFilter === sev
                    ? "bg-cyan-950 text-cyan-200 border border-cyan-500/50"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 ml-3">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Status:</span>
            {["ALL", "ACTIVE", "ACKNOWLEDGED", "RESOLVED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                  statusFilter === st
                    ? "bg-cyan-950 text-cyan-200 border border-cyan-500/50"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
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

      {/* ── Main Alert List Table / Feed ────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-[#080d16]/95 border border-white/[0.08] backdrop-blur-md shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Fetching station alerts from database...</span>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No alerts found matching selected filter criteria.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => {
              const isCritical = alert.severity === "CRITICAL" || alert.severity === "EMERGENCY";
              const isWarning = alert.severity === "WARNING";
              const isActive = alert.status === "ACTIVE";

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isCritical
                      ? "bg-rose-950/20 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.15)]"
                      : isWarning
                      ? "bg-amber-950/20 border-amber-500/40"
                      : "bg-[#040810] border-white/[0.06]"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Severity Badge */}
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                            isCritical
                              ? "bg-rose-950 text-rose-300 border border-rose-500/50"
                              : isWarning
                              ? "bg-amber-950 text-amber-300 border border-amber-500/50"
                              : "bg-cyan-950 text-cyan-300 border border-cyan-500/50"
                          }`}
                        >
                          {alert.severity}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            alert.status === "ACTIVE"
                              ? "bg-rose-500/20 text-rose-300"
                              : alert.status === "ACKNOWLEDGED"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {alert.status}
                        </span>

                        {/* Human-Readable Asset Badge */}
                        {alert.assetId && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#040810] text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                            <Cpu className="w-2.5 h-2.5 text-cyan-400" />
                            {assetNameMap.get(alert.assetId) || `Equipment ${alert.assetId.slice(0, 8)}`}
                          </span>
                        )}

                        <span className="text-[10px] text-slate-500">
                          {new Date(alert.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <h3 className="text-xs font-bold text-slate-100">{alert.title}</h3>
                      <p className="text-[11px] text-slate-400">{alert.message}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {alert.status !== "RESOLVED" && (
                        <Link
                          href={`/maintenance?action=create&stationId=${selectedStation}&assetId=${alert.assetId || ""}&title=${encodeURIComponent(`Investigate: ${alert.title}`)}&priority=${alert.severity === "CRITICAL" ? "HIGH" : "MEDIUM"}`}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Wrench className="w-3 h-3 text-cyan-400" />
                          <span className="hidden sm:inline">DISPATCH WORK ORDER</span>
                          <span className="sm:hidden">ORDER</span>
                        </Link>
                      )}

                      {isActive && (
                        <button
                          type="button"
                          onClick={() => handleAcknowledge(alert.id)}
                          disabled={actionLoading === alert.id}
                          className="px-3 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-500/50 text-amber-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                        >
                          {actionLoading === alert.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Clock className="w-3 h-3 text-amber-400" />
                          )}
                          <span>ACKNOWLEDGE</span>
                        </button>
                      )}

                      {alert.status !== "RESOLVED" && (
                        <button
                          type="button"
                          onClick={() => handleResolve(alert.id)}
                          disabled={actionLoading === alert.id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                        >
                          {actionLoading === alert.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3 text-emerald-400" />
                          )}
                          <span>RESOLVE</span>
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
    </div>
  );
}
