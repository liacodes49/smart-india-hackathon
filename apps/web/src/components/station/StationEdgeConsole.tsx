"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { useStationStore, type CameraPreset, type ViewMode } from "@/stores/useStationStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { StationId } from "@repo/shared/enums";
import AntarcticaOverview from "@/components/digital-twin/AntarcticaOverview";
import {
  Radio,
  Wifi,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  Flame,
  Zap,
  Droplets,
  Thermometer,
  Sliders,
  Send,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  LogOut,
  Camera,
  Layers,
  Box,
  Eye,
  Fuel,
  Home,
  Truck,
  Cpu,
} from "lucide-react";

interface StationEdgeConsoleProps {
  stationId: "MAITRI" | "BHARATI";
}

const CAMERA_PRESETS: { id: CameraPreset; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "OVERVIEW", label: "Overview", icon: Eye },
  { id: "POWER", label: "Power", icon: Zap },
  { id: "FUEL", label: "Fuel", icon: Fuel },
  { id: "HABITAT", label: "Habitat", icon: Home },
  { id: "LOGISTICS", label: "Logistics", icon: Truck },
];

export function StationEdgeConsole({ stationId }: StationEdgeConsoleProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const activeStation = useStationStore((s) => s.activeStation);
  const setActiveStation = useStationStore((s) => s.setActiveStation);
  const selectedAssetId = useStationStore((s) => s.selectedAssetId);
  const setSelectedAsset = useStationStore((s) => s.setSelectedAsset);
  const cameraPreset = useStationStore((s) => s.cameraPreset);
  const setCameraPreset = useStationStore((s) => s.setCameraPreset);
  const viewMode = useStationStore((s) => s.viewMode);
  const setViewMode = useStationStore((s) => s.setViewMode);

  // Synchronize store station on mount
  useEffect(() => {
    setActiveStation(stationId as StationId);
  }, [stationId, setActiveStation]);

  // Active dock tab: "TX" (Data Transmitted to HQ) vs "RX" (Directives Received from HQ)
  const [activeDockTab, setActiveDockTab] = useState<"TX" | "RX">("TX");

  // Local Station Edge Telemetry Controls (Interactive Sliders)
  const [gen1Temp, setGen1Temp] = useState<number>(76);
  const [genPowerKw, setGenPowerKw] = useState<number>(85);
  const [indoorTemp, setIndoorTemp] = useState<number>(21.5);
  const [waterPressureBar, setWaterPressureBar] = useState<number>(3.8);
  const [fuelTankPercent, setFuelTankPercent] = useState<number>(78);

  // Sensor Ingestion Status & Live Transmission Log
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [txLogs, setTxLogs] = useState<string[]>([
    `[SATCOM UPLINK ONLINE]: GSAT-7A Carrier lock verified at ${stationId} ground terminal.`,
    `[TELEMETRY SYNC]: Baseline telemetry packets streaming to NCPOR Goa Command.`,
  ]);

  // Directives / Work Orders from HQ
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sensors, setSensors] = useState<any[]>([]);

  // Station Metadata
  const stationName = stationId === "MAITRI" ? "Maitri Research Station" : "Bharati Research Station";
  const stationCoords = stationId === "MAITRI" ? "70°46′S 11°44′E (Schirmacher Oasis)" : "69°24′S 76°11′E (Larsemann Hills)";
  const stationTheme = stationId === "MAITRI" ? "cyan" : "blue";

  // Load sensors for this station
  useEffect(() => {
    apiClient.sensors.list({ stationId }).then((res: any) => {
      if (res?.data && Array.isArray(res.data)) {
        setSensors(res.data);
      }
    }).catch((err) => {
      console.warn("Could not preload station sensors:", err);
    });
  }, [stationId]);

  // Fetch Directives & Work Orders from HQ
  const fetchHQDirectives = useCallback(async () => {
    try {
      setLoadingOrders(true);
      const [woRes, alertsRes] = await Promise.all([
        apiClient.maintenance.list({ stationId, limit: 10 }),
        apiClient.alerts.list({ stationId, limit: 10 }),
      ]);
      setWorkOrders((woRes as any)?.data || []);
      setAlerts((alertsRes as any)?.data || []);
    } catch (err) {
      console.warn("Could not fetch HQ directives:", err);
    } finally {
      setLoadingOrders(false);
    }
  }, [stationId]);

  useEffect(() => {
    fetchHQDirectives();
    const interval = setInterval(fetchHQDirectives, 10000);
    return () => clearInterval(interval);
  }, [fetchHQDirectives]);

  // Transmit Single Sensor Reading to DB and SSE stream
  const handleTransmitReading = async (metricName: string, value: number, unit: string) => {
    try {
      setIsTransmitting(true);
      // Ingest sensor reading via API
      let target = sensors.find(
        (s) =>
          s.name.toLowerCase().includes(metricName.toLowerCase()) ||
          s.unit.toLowerCase() === unit.toLowerCase()
      );
      if (!target && sensors.length > 0) {
        target = sensors[0];
      }

      if (target) {
        await apiClient.telemetry.ingest({
          sensorId: target.id,
          stationId,
          timestamp: new Date().toISOString(),
          value,
          unit: target.unit,
          status: value >= (target.criticalThreshold ?? 90) ? "CRITICAL" : value >= (target.warningThreshold ?? 80) ? "WARNING" : "NORMAL",
          quality: 100,
        });
      }

      const logEntry = `[TX → GOA HQ]: ${metricName} = ${value} ${unit} (ACK)`;
      setTxLogs((prev) => [logEntry, ...prev.slice(0, 15)]);
      useStationStore.getState().recordTelemetryTick();
    } catch (err: any) {
      const errMsg = err?.message || err?.error?.message || (typeof err === "string" ? err : "Sensor transmission error");
      console.error("Sensor transmission failed:", errMsg, err);
      setTxLogs((prev) => [`[TX ERROR]: Failed to push ${metricName}: ${errMsg}`, ...prev.slice(0, 15)]);
    } finally {
      setIsTransmitting(false);
    }
  };

  // Push One-Touch Crisis Anomaly Scenario
  const handleTriggerAnomaly = async (scenario: "GEN_CRITICAL" | "FREEZE_WATER" | "BLIZZARD_SURGE") => {
    try {
      setIsTransmitting(true);
      if (scenario === "GEN_CRITICAL") {
        setGen1Temp(94.5);
        setGenPowerKw(145);
        const sensor = sensors.find((s) => s.type === "TEMPERATURE" || s.name.toLowerCase().includes("coolant")) || sensors[0];
        if (sensor) {
          await apiClient.telemetry.ingest({
            sensorId: sensor.id,
            stationId,
            timestamp: new Date().toISOString(),
            value: 94.5,
            unit: sensor.unit,
            status: "CRITICAL",
            quality: 100,
          });
        }
        setTxLogs((prev) => [
          `[🚨 EMERGENCY TX]: CRITICAL Coolant Overheat Injected (94.5°C) → Dispatched to HQ!`,
          ...prev.slice(0, 15),
        ]);
      } else if (scenario === "FREEZE_WATER") {
        setWaterPressureBar(0.2);
        const sensor = sensors.find((s) => s.name.toLowerCase().includes("pressure") || s.name.toLowerCase().includes("water")) || sensors[1] || sensors[0];
        if (sensor) {
          await apiClient.telemetry.ingest({
            sensorId: sensor.id,
            stationId,
            timestamp: new Date().toISOString(),
            value: 0.2,
            unit: sensor.unit,
            status: "WARNING",
            quality: 100,
          });
        }
        setTxLogs((prev) => [
          `[⚠️ WARNING TX]: Water Line Freeze / Flow Blockage Injected (0.2 bar) → Dispatched to HQ!`,
          ...prev.slice(0, 15),
        ]);
      } else if (scenario === "BLIZZARD_SURGE") {
        setIndoorTemp(12.0);
        const sensor = sensors.find((s) => s.name.toLowerCase().includes("temp") || s.name.toLowerCase().includes("ambient")) || sensors[0];
        if (sensor) {
          await apiClient.telemetry.ingest({
            sensorId: sensor.id,
            stationId,
            timestamp: new Date().toISOString(),
            value: 12.0,
            unit: sensor.unit,
            status: "WARNING",
            quality: 100,
          });
        }
        setTxLogs((prev) => [
          `[⚠️ ADVISORY TX]: Polar Cold Infiltration (12.0°C) → Dispatched to HQ!`,
          ...prev.slice(0, 15),
        ]);
      }
      useStationStore.getState().recordTelemetryTick();
      fetchHQDirectives();
    } catch (err: any) {
      console.error("Failed to inject anomaly:", err);
    } finally {
      setIsTransmitting(false);
    }
  };

  // Station Operator marks a Work Order as completed
  const handleCompleteOrder = async (orderId: string) => {
    try {
      setActionLoading(orderId);
      await apiClient.maintenance.update(orderId, {
        status: "COMPLETED",
        completedDate: new Date().toISOString(),
        notes: `Executed on-site by ${user?.name || "Station Operator"} at ${stationId}.`,
      });
      fetchHQDirectives();
      useStationStore.getState().recordTelemetryTick();
      setTxLogs((prev) => [
        `[STATUS TX]: Work Order #${orderId.slice(0, 8)} marked COMPLETED on-site. Alerts auto-resolved.`,
        ...prev.slice(0, 15),
      ]);
    } catch (err: any) {
      console.error("Failed to complete order:", err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3.5 h-full min-h-0 select-none font-mono">
      {/* ── Top Station Edge Header Bar ────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#080d16]/95 border border-white/[0.08] backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-cyan-950 text-cyan-300 border border-cyan-500/50 uppercase">
                {stationId} ON-SITE SCADA TERMINAL
              </span>
              <span className="text-xs font-bold text-slate-100">{stationName}</span>
            </div>
            <p className="text-[10px] text-slate-400">{stationCoords}</p>
          </div>
        </div>

        {/* Satellite Telemetry Uplink Status to HQ */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#040810] border border-white/[0.08] text-xs">
            <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider">
                GSAT-7A UPLINK ACTIVE
              </span>
              <span className="text-[9.5px] text-slate-400 hidden sm:inline">• Latency: 64ms • Goa HQ Connected</span>
            </div>
          </div>

          {/* User Badge & Switch Terminal */}
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] text-slate-300 hidden md:inline">
              Op: <strong>{user?.name || "Station Commander"}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="p-2 rounded-xl bg-[#040810] border border-white/[0.08] text-slate-400 hover:text-rose-400 cursor-pointer transition-all"
              title="Switch Terminal or Log Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Station Split View: 3D Twin Viewport + Edge Dock ─── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3.5 min-h-0">
        {/* 1. 3D DIGITAL TWIN FOR THIS STATION */}
        <div className="flex-1 min-w-0 flex flex-col rounded-2xl border border-white/[0.08] bg-[#03060c] shadow-2xl overflow-hidden relative min-h-[460px] lg:min-h-[560px]">
          {/* 3D Top HUD Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] bg-[#060a12]/90 px-4 py-2 backdrop-blur-md z-20 text-xs">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-slate-100 text-[11px] uppercase tracking-wide">
                3D Interactive Digital Twin — [{stationId}]
              </span>
            </div>

            {/* Camera Presets */}
            <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-slate-950/80 p-0.5">
              {CAMERA_PRESETS.map((p) => {
                const Icon = p.icon;
                const active = cameraPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setCameraPreset(p.id)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-semibold transition-all cursor-pointer ${
                      active
                        ? "bg-cyan-950 text-cyan-200 border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-2.5 h-2.5" />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>

            {/* View Modes */}
            <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-slate-950/80 p-0.5">
              {(["NORMAL", "ENERGY", "RISK", "LOGISTICS"] as ViewMode[]).map((vm) => (
                <button
                  key={vm}
                  type="button"
                  onClick={() => setViewMode(vm)}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                    viewMode === vm
                      ? "bg-cyan-950 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {vm}
                </button>
              ))}
            </div>
          </div>

          {/* 3D Canvas Viewport */}
          <div className="flex-1 relative w-full h-full min-h-[400px]">
            <AntarcticaOverview
              embedded={true}
              initialStationId={stationId}
            />
          </div>
        </div>

        {/* 2. DUAL INTERFACE DOCK: DATA TRANSMITTED TO HQ vs DATA RECEIVED FROM HQ */}
        <div className="w-full lg:w-[460px] xl:w-[500px] shrink-0 flex flex-col gap-3 min-h-0">
          {/* Dock Tab Selector */}
          <div className="flex items-center p-1 rounded-xl bg-[#080d16] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setActiveDockTab("TX")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeDockTab === "TX"
                  ? "bg-cyan-950 text-cyan-200 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
              <span>TRANSMIT TO HQ (Edge SCADA)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDockTab("RX")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeDockTab === "RX"
                  ? "bg-amber-950 text-amber-200 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>RECEIVED FROM HQ ({workOrders.length})</span>
            </button>
          </div>

          {/* TAB 1: DATA TRANSMITTED TO HQ (Interactive Edge SCADA Sensor Deck) */}
          {activeDockTab === "TX" && (
            <div className="flex-1 flex flex-col gap-3 p-4 rounded-2xl bg-[#080d16]/95 border border-white/[0.08] backdrop-blur-md overflow-y-auto max-h-[620px]">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-100 uppercase">
                    Edge Sensor Control & Ingestion Deck
                  </span>
                </div>
                <span className="text-[9.5px] text-slate-400">Live Satellite Uplink</span>
              </div>

              {/* Real-Time Sensor Sliders */}
              <div className="space-y-3.5 text-xs">
                {/* 1. Generator 01 Coolant Temperature */}
                <div className="p-3 rounded-xl bg-[#040810] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                      Generator 01 Coolant Temp
                    </span>
                    <span className="text-cyan-400 font-extrabold">{gen1Temp}°C</span>
                  </div>
                  <input
                    type="range"
                    min="55"
                    max="105"
                    step="0.5"
                    value={gen1Temp}
                    onChange={(e) => setGen1Temp(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between items-center mt-1.5 text-[9.5px] text-slate-500">
                    <span>Nominal: 70-82°C</span>
                    <button
                      type="button"
                      onClick={() => handleTransmitReading("Coolant Temperature", gen1Temp, "°C")}
                      className="px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold text-[9px] flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Send className="w-2.5 h-2.5" />
                      <span>PUSH VALUE</span>
                    </button>
                  </div>
                </div>

                {/* 2. Microgrid Power Generation Load */}
                <div className="p-3 rounded-xl bg-[#040810] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Active Power Demand
                    </span>
                    <span className="text-amber-400 font-extrabold">{genPowerKw} kW</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="160"
                    step="1"
                    value={genPowerKw}
                    onChange={(e) => setGenPowerKw(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                  <div className="flex justify-between items-center mt-1.5 text-[9.5px] text-slate-500">
                    <span>Rated: 125 kW</span>
                    <button
                      type="button"
                      onClick={() => handleTransmitReading("Power Demand", genPowerKw, "kW")}
                      className="px-2 py-0.5 rounded bg-amber-950 hover:bg-amber-900 border border-amber-500/40 text-amber-300 font-bold text-[9px] flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Send className="w-2.5 h-2.5" />
                      <span>PUSH VALUE</span>
                    </button>
                  </div>
                </div>

                {/* 3. Water Pump Pressure */}
                <div className="p-3 rounded-xl bg-[#040810] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-blue-400" />
                      Priyadarshini Pump Pressure
                    </span>
                    <span className="text-blue-400 font-extrabold">{waterPressureBar} bar</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="6"
                    step="0.1"
                    value={waterPressureBar}
                    onChange={(e) => setWaterPressureBar(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-400"
                  />
                  <div className="flex justify-between items-center mt-1.5 text-[9.5px] text-slate-500">
                    <span>Operating: 3.5 - 4.2 bar</span>
                    <button
                      type="button"
                      onClick={() => handleTransmitReading("Water Pressure", waterPressureBar, "bar")}
                      className="px-2 py-0.5 rounded bg-blue-950 hover:bg-blue-900 border border-blue-500/40 text-blue-300 font-bold text-[9px] flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Send className="w-2.5 h-2.5" />
                      <span>PUSH VALUE</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* One-Touch Crisis Anomaly Injections */}
              <div className="pt-2 border-t border-white/[0.06]">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-2">
                  One-Touch Station Crisis Triggers:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTriggerAnomaly("GEN_CRITICAL")}
                    className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/50 text-rose-200 text-[10px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-center"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>TRIP GENSET 02</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTriggerAnomaly("FREEZE_WATER")}
                    className="p-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/50 text-amber-200 text-[10px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-center"
                  >
                    <Droplets className="w-3.5 h-3.5 text-amber-400" />
                    <span>FREEZE WATER LINE</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTriggerAnomaly("BLIZZARD_SURGE")}
                    className="p-2 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/50 text-cyan-200 text-[10px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-center"
                  >
                    <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                    <span>POLAR BLIZZARD</span>
                  </button>
                </div>
              </div>

              {/* Satellite Uplink TX Transmission Log */}
              <div className="pt-2 border-t border-white/[0.06] flex-1 flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">
                  Satellite Outgoing Telemetry Stream:
                </span>
                <div className="flex-1 p-2.5 rounded-xl bg-[#020408] border border-white/[0.06] font-mono text-[9.5px] text-slate-400 space-y-1 overflow-y-auto max-h-36">
                  {txLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={
                        log.includes("🚨") || log.includes("CRITICAL")
                          ? "text-rose-400 font-bold"
                          : log.includes("⚠️")
                          ? "text-amber-300"
                          : "text-slate-300"
                      }
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATA RECEIVED FROM HQ (Directives, Work Orders & AI Advisories) */}
          {activeDockTab === "RX" && (
            <div className="flex-1 flex flex-col gap-3 p-4 rounded-2xl bg-[#080d16]/95 border border-white/[0.08] backdrop-blur-md overflow-y-auto max-h-[620px]">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-100 uppercase">
                    HQ Directives & AI Prognosis Feed
                  </span>
                </div>
                <span className="text-[9.5px] text-slate-400">From Goa Command</span>
              </div>

              {/* Active Alerts for this station */}
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">
                  Active Station Alarms ({alerts.filter((a) => a.status === "ACTIVE").length}):
                </span>
                {alerts.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">No active alarms at this station.</p>
                ) : (
                  <div className="space-y-2">
                    {alerts.slice(0, 3).map((a) => (
                      <div
                        key={a.id}
                        className={`p-2.5 rounded-xl border text-xs ${
                          a.severity === "CRITICAL"
                            ? "bg-rose-950/30 border-rose-500/40 text-rose-200"
                            : "bg-amber-950/30 border-amber-500/40 text-amber-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-[10px] uppercase tracking-wide">
                            {a.severity}: {a.title}
                          </span>
                          <span className="text-[9px] opacity-75">{a.status}</span>
                        </div>
                        <p className="text-[10px] text-slate-300">{a.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Work Orders Dispatched from HQ */}
              <div className="pt-2 border-t border-white/[0.06] flex-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">
                  HQ Maintenance Orders & Dispatches:
                </span>
                {workOrders.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">No pending work orders from HQ.</p>
                ) : (
                  <div className="space-y-2.5">
                    {workOrders.map((wo) => {
                      const isPending = wo.status === "PENDING" || wo.status === "RECOMMENDED" || wo.status === "IN_PROGRESS";
                      return (
                        <div
                          key={wo.id}
                          className="p-3 rounded-xl bg-[#040810] border border-white/[0.06] text-xs flex flex-col justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
                                {wo.priority} PRIORITY
                              </span>
                              <span className="text-[9.5px] text-slate-500">
                                {wo.status}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-100 text-[11px]">{wo.title}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">{wo.description}</p>
                          </div>

                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleCompleteOrder(wo.id)}
                              disabled={actionLoading === wo.id}
                              className="w-full py-1.5 px-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>{actionLoading === wo.id ? "Syncing with HQ..." : "MARK COMPLETED ON-SITE"}</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
