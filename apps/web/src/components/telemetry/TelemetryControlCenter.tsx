'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { useStationStore } from '@/stores/useStationStore';
import { StationId } from '@repo/shared/enums';
import {
  Radio,
  Zap,
  Flame,
  Wind,
  Droplets,
  Activity,
  Send,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

interface Sensor {
  id: string;
  assetId: string;
  stationId: string;
  name: string;
  type: string;
  unit: string;
  minThreshold: number | null;
  maxThreshold: number | null;
  warningThreshold: number | null;
  criticalThreshold: number | null;
  status: string;
  lastReading: number | null;
  lastReadingAt?: string | null;
}

export function TelemetryControlCenter() {
  const activeStation = useStationStore((s) => s.activeStation);
  const setActiveStation = useStationStore((s) => s.setActiveStation);

  const [selectedStation, setSelectedStation] = useState<string>(activeStation || 'MAITRI');
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [transmitting, setTransmitting] = useState<boolean>(false);
  const [packetCount, setPacketCount] = useState<number>(1420);
  const [selectedSensorId, setSelectedSensorId] = useState<string>('');
  const [customValue, setCustomValue] = useState<number>(85);
  const [customStatus, setCustomStatus] = useState<string>('NORMAL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [message, setMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Fetch sensors for active station
  const fetchSensors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.sensors.list({ stationId: selectedStation, limit: 50 });
      const sensorData = (res as any)?.data || [];
      setSensors(sensorData);
      if (sensorData.length > 0 && !selectedSensorId) {
        setSelectedSensorId(sensorData[0].id);
        setCustomValue(sensorData[0].lastReading ?? 50);
      }
    } catch (err: any) {
      console.error('[TelemetryControlCenter] Error fetching sensors:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedStation, selectedSensorId]);

  useEffect(() => {
    fetchSensors();
    const interval = setInterval(() => {
      fetchSensors();
      setPacketCount((p) => p + Math.floor(Math.random() * 5) + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchSensors]);

  const handleStationChange = (station: string) => {
    setSelectedStation(station);
    if (station === 'MAITRI') setActiveStation(StationId.MAITRI);
    else if (station === 'BHARATI') setActiveStation(StationId.BHARATI);
  };

  // Ingest manual custom sensor reading
  const handleInjectReading = async (e: React.FormEvent) => {
    e.preventDefault();
    const sensor = sensors.find((s) => s.id === selectedSensorId);
    if (!sensor) return;

    try {
      setTransmitting(true);
      setMessage(null);

      await apiClient.telemetry.ingest({
        sensorId: sensor.id,
        stationId: sensor.stationId,
        timestamp: new Date().toISOString(),
        value: Number(customValue),
        unit: sensor.unit,
        status: customStatus as any,
        quality: 100,
      });

      setMessage({
        text: `Transmitted ${sensor.name} = ${customValue} ${sensor.unit} to NCPOR HQ Twin in India!`,
        type: 'success',
      });
      setPacketCount((p) => p + 1);
      fetchSensors();
    } catch (err: any) {
      setMessage({
        text: err?.message || 'Failed to transmit telemetry payload',
        type: 'error',
      });
    } finally {
      setTransmitting(false);
    }
  };

  // Trigger Antarctic Emergency Scenario
  const handleTriggerScenario = async (scenario: 'OVERHEAT' | 'BLIZZARD' | 'FREEZE' | 'NORMAL') => {
    try {
      setTransmitting(true);
      setMessage(null);

      if (scenario === 'OVERHEAT') {
        const coolantGen = sensors.find(
          (s) =>
            s.name.toLowerCase().includes('coolant') ||
            (s.type === 'TEMPERATURE' &&
              (s.name.toLowerCase().includes('gen') || s.name.toLowerCase().includes('engine'))) ||
            (s.type === 'TEMPERATURE' && s.unit.includes('°C')),
        );
        if (!coolantGen) {
          throw new Error('No coolant/temperature sensor found for this station');
        }
        await apiClient.telemetry.ingest({
          sensorId: coolantGen.id,
          stationId: coolantGen.stationId,
          timestamp: new Date().toISOString(),
          value: 96.5,
          unit: coolantGen.unit,
          status: 'CRITICAL',
          quality: 100,
        });
        setMessage({
          text: `🚨 EXECUTED: Generator Overheat Scenario (96.5${coolantGen.unit}) transmitted to HQ Twin via ${coolantGen.name}!`,
          type: 'error',
        });
      } else if (scenario === 'BLIZZARD') {
        const windSensor = sensors.find(
          (s) =>
            s.type === 'WIND_SPEED' ||
            s.name.toLowerCase().includes('wind') ||
            s.unit.toLowerCase().includes('km/h') ||
            s.unit.toLowerCase().includes('m/s') ||
            s.unit.toLowerCase().includes('knot'),
        );
        const tempSensor =
          sensors.find(
            (s) =>
              (s.type === 'TEMPERATURE' || s.unit.includes('°C')) &&
              (s.name.toLowerCase().includes('outside') ||
                s.name.toLowerCase().includes('ambient') ||
                s.name.toLowerCase().includes('weather')),
          ) || sensors.find((s) => s.type === 'TEMPERATURE');

        if (!windSensor && !tempSensor) {
          throw new Error('No meteorological or temperature sensor found for this station');
        }

        if (windSensor) {
          await apiClient.telemetry.ingest({
            sensorId: windSensor.id,
            stationId: windSensor.stationId,
            timestamp: new Date().toISOString(),
            value: windSensor.criticalThreshold ? windSensor.criticalThreshold + 15 : 165.4,
            unit: windSensor.unit,
            status: 'CRITICAL',
            quality: 100,
          });
        }
        if (tempSensor) {
          await apiClient.telemetry.ingest({
            sensorId: tempSensor.id,
            stationId: tempSensor.stationId,
            timestamp: new Date().toISOString(),
            value: -58.2,
            unit: tempSensor.unit,
            status: 'CRITICAL',
            quality: 100,
          });
        }
        setMessage({
          text: '❄️ EXECUTED: Katabatic Blizzard Scenario transmitted to HQ Twin!',
          type: 'error',
        });
      } else if (scenario === 'FREEZE') {
        const flowSensor = sensors.find(
          (s) =>
            s.type === 'WATER' ||
            s.type === 'PRESSURE' ||
            s.name.toLowerCase().includes('water') ||
            s.name.toLowerCase().includes('pump') ||
            s.name.toLowerCase().includes('flow'),
        );
        if (!flowSensor) {
          throw new Error('No water/pressure sensor found for this station');
        }
        await apiClient.telemetry.ingest({
          sensorId: flowSensor.id,
          stationId: flowSensor.stationId,
          timestamp: new Date().toISOString(),
          value: 2.1,
          unit: flowSensor.unit,
          status: 'CRITICAL',
          quality: 100,
        });
        setMessage({
          text: `💧 EXECUTED: Intake Water Freeze Scenario (2.1 ${flowSensor.unit}) transmitted to HQ Twin via ${flowSensor.name}!`,
          type: 'error',
        });
      } else if (scenario === 'NORMAL') {
        for (const s of sensors) {
          const normalVal = s.warningThreshold ? (s.minThreshold ?? 0) + 10 : 50;
          await apiClient.telemetry.ingest({
            sensorId: s.id,
            stationId: s.stationId,
            timestamp: new Date().toISOString(),
            value: normalVal,
            unit: s.unit,
            status: 'NORMAL',
            quality: 100,
          });
        }
        setMessage({
          text: '🟢 RESTORED: Safe Antarctic baseline operational state transmitted to HQ Twin!',
          type: 'info',
        });
      }

      setPacketCount((p) => p + 5);
      fetchSensors();
    } catch (err: any) {
      setMessage({ text: err?.message || 'Scenario injection failed', type: 'error' });
    } finally {
      setTransmitting(false);
    }
  };

  const selectedSensor = sensors.find((s) => s.id === selectedSensorId);

  const filteredSensors = sensors.filter((s) => {
    if (filterType === 'ALL') return true;
    return s.type === filterType;
  });

  return (
    <div className="flex-1 flex flex-col gap-5 font-mono select-none pb-12">
      {/* ── Top Satellite Header Bar ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-[#080d16]/95 border border-white/[0.08] backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold tracking-wider text-slate-100 uppercase">
                Antarctic Field Terminal Telemetry Console
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ISRO GSAT UPLINK ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Station Edge Node Transmitter → Real-time Satellite Sync to NCPOR HQ (Goa, India)
            </p>
          </div>
        </div>

        {/* Satellite Link Status Pill */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#040810] border border-white/[0.08] text-[10.5px]">
            <div>
              <span className="text-slate-500 block text-[9px]">UPLINK PACKETS</span>
              <span className="font-bold text-cyan-400">{packetCount.toLocaleString()} pkts</span>
            </div>
            <div className="w-[1px] h-6 bg-white/10" />
            <div>
              <span className="text-slate-500 block text-[9px]">LATENCY</span>
              <span className="font-bold text-emerald-400">38 ms (GSAT-14)</span>
            </div>
          </div>

          {/* Station Filter Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-[#040810] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => handleStationChange('MAITRI')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedStation === 'MAITRI'
                  ? 'bg-cyan-950 text-cyan-200 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              MAITRI (70°S)
            </button>
            <button
              type="button"
              onClick={() => handleStationChange('BHARATI')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedStation === 'BHARATI'
                  ? 'bg-cyan-950 text-cyan-200 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              BHARATI (69°S)
            </button>
          </div>
        </div>
      </div>

      {/* ── Status Message Toast Banner ─────────────────────────────────────── */}
      {message && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              : message.type === 'error'
                ? 'bg-rose-950/80 border-rose-500/50 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : message.type === 'error' ? (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-200 text-xs cursor-pointer ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Main Two-Column Layout: Injector Form + Scenario Quick Triggers ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 Cols): Manual Sensor Ingestion Form */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#080d16]/95 border border-white/[0.08] backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs sm:text-sm font-bold tracking-wider text-slate-100 uppercase">
                  Manual Telemetry Delta Injector
                </h2>
              </div>
              <span className="text-[10px] text-slate-400">
                Target Station: <span className="font-bold text-cyan-300">[{selectedStation}]</span>
              </span>
            </div>

            <form onSubmit={handleInjectReading} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sensor Selector */}
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                    Select Target Station Sensor
                  </label>
                  <select
                    value={selectedSensorId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedSensorId(id);
                      const s = sensors.find((x) => x.id === id);
                      if (s && s.lastReading != null) setCustomValue(s.lastReading);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#040810] border border-white/[0.12] text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {sensors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.unit}) — Current: {s.lastReading ?? 'N/A'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Selector */}
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                    Telemetry Quality / Status
                  </label>
                  <select
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#040810] border border-white/[0.12] text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="NORMAL">NORMAL (Safe Baseline)</option>
                    <option value="WARNING">WARNING (Elevated Risk)</option>
                    <option value="CRITICAL">CRITICAL (Red Alert Threshold)</option>
                    <option value="MAINTENANCE">MAINTENANCE (Offline Sensor)</option>
                  </select>
                </div>
              </div>

              {/* Slider & Numerical Value Input */}
              {selectedSensor && (
                <div className="p-4 rounded-xl bg-[#040810] border border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">
                      Inject Reading Value for {selectedSensor.name}:
                    </span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-base font-extrabold text-cyan-400">{customValue}</span>
                      <span className="text-xs text-slate-400">{selectedSensor.unit}</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={selectedSensor.minThreshold ?? -80}
                    max={selectedSensor.maxThreshold ?? 350}
                    step={selectedSensor.unit === '°C' || selectedSensor.unit === '%' ? 0.5 : 1}
                    value={customValue}
                    onChange={(e) => setCustomValue(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>
                      Min: {selectedSensor.minThreshold ?? -80} {selectedSensor.unit}
                    </span>
                    <span>
                      Warning: {selectedSensor.warningThreshold ?? 'N/A'} {selectedSensor.unit}
                    </span>
                    <span>
                      Critical: {selectedSensor.criticalThreshold ?? 'N/A'} {selectedSensor.unit}
                    </span>
                    <span>
                      Max: {selectedSensor.maxThreshold ?? 350} {selectedSensor.unit}
                    </span>
                  </div>
                </div>
              )}

              {/* Transmit Button */}
              <button
                type="submit"
                disabled={transmitting || !selectedSensorId}
                className="w-full py-3 px-4 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-pointer disabled:opacity-50"
              >
                {transmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                ) : (
                  <Send className="w-4 h-4 text-cyan-400" />
                )}
                <span>TRANSMIT TELEMETRY PAYLOAD TO INDIA HQ TWIN</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (1 Col): One-Touch Polar Disaster Scenario Triggers */}
        <div className="p-5 rounded-2xl bg-[#080d16]/95 border border-white/[0.08] backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-white/[0.08]">
              <Zap className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs sm:text-sm font-bold tracking-wider text-slate-100 uppercase">
                Polar Disaster Presets (Live Demo)
              </h2>
            </div>

            <p className="text-[10.5px] text-slate-400 mb-4 leading-relaxed">
              One-touch emergency triggers for live multi-laptop demonstration. Watch the 3D Twin on
              Laptop 3 react instantly!
            </p>

            <div className="space-y-3">
              {/* Trigger 1: Generator Overheat */}
              <button
                type="button"
                onClick={() => handleTriggerScenario('OVERHEAT')}
                disabled={transmitting}
                className="w-full p-3 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-900/80 border border-rose-500/50 flex items-center justify-center text-rose-300">
                    <Flame className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-rose-200 group-hover:text-white">
                      ⚡ Genset-1 Overheat (96.5°C)
                    </div>
                    <div className="text-[9.5px] text-slate-400">
                      Spikes coolant temp & triggers RUL drop
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-rose-400" />
              </button>

              {/* Trigger 2: Katabatic Blizzard */}
              <button
                type="button"
                onClick={() => handleTriggerScenario('BLIZZARD')}
                disabled={transmitting}
                className="w-full p-3 rounded-xl bg-sky-950/50 hover:bg-sky-900/60 border border-sky-500/40 text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-900/80 border border-sky-500/50 flex items-center justify-center text-sky-300">
                    <Wind className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-sky-200 group-hover:text-white">
                      ❄️ Katabatic Blizzard (165 km/h)
                    </div>
                    <div className="text-[9.5px] text-slate-400">
                      Wind surge + temp drop to -58°C
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-sky-400" />
              </button>

              {/* Trigger 3: Lake Intake Freeze */}
              <button
                type="button"
                onClick={() => handleTriggerScenario('FREEZE')}
                disabled={transmitting}
                className="w-full p-3 rounded-xl bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-500/40 text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-900/80 border border-indigo-500/50 flex items-center justify-center text-indigo-300">
                    <Droplets className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-indigo-200 group-hover:text-white">
                      💧 Lake Intake Freeze (2.1 L/min)
                    </div>
                    <div className="text-[9.5px] text-slate-400">
                      Triggers water safety emergency alert
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-indigo-400" />
              </button>

              {/* Trigger 4: Normal Baseline */}
              <button
                type="button"
                onClick={() => handleTriggerScenario('NORMAL')}
                disabled={transmitting}
                className="w-full p-3 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-900/80 border border-emerald-500/50 flex items-center justify-center text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-200 group-hover:text-white">
                      🟢 Restore Normal Baseline
                    </div>
                    <div className="text-[9.5px] text-slate-400">
                      Resets all station sensors to safe state
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Registered Station Sensors Live Grid ────────────────── */}
      <div className="p-5 rounded-2xl bg-[#080d16]/95 border border-white/[0.08] backdrop-blur-md shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs sm:text-sm font-bold tracking-wider text-slate-100 uppercase">
              Registered Station Sensors ({sensors.length}) — [{selectedStation}]
            </h2>
          </div>

          {/* Type Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            {['ALL', 'TEMPERATURE', 'POWER', 'FUEL', 'WIND_SPEED', 'WATER', 'PRESSURE'].map(
              (type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    filterType === type
                      ? 'bg-cyan-950 text-cyan-200 border border-cyan-500/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {type}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Sensor Cards Grid */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Loading registered station sensors...</span>
          </div>
        ) : filteredSensors.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No sensors found for filter [{filterType}].
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredSensors.map((sensor) => {
              const val = sensor.lastReading ?? 0;
              const isWarning = sensor.status === 'WARNING';
              const isCritical = sensor.status === 'CRITICAL';

              return (
                <div
                  key={sensor.id}
                  onClick={() => {
                    setSelectedSensorId(sensor.id);
                    setCustomValue(val);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:border-cyan-500/60 ${
                    selectedSensorId === sensor.id
                      ? 'bg-cyan-950/40 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : isCritical
                        ? 'bg-rose-950/30 border-rose-500/40'
                        : isWarning
                          ? 'bg-amber-950/30 border-amber-500/40'
                          : 'bg-[#040810] border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.04]">
                    <span
                      className="text-xs font-bold text-slate-200 truncate max-w-[170px]"
                      title={sensor.name}
                    >
                      {sensor.name}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                        isCritical
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                          : isWarning
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                      }`}
                    >
                      {sensor.status}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-[10px] text-slate-400">{sensor.type}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-extrabold text-cyan-300">{val}</span>
                      <span className="text-[10px] text-slate-400">{sensor.unit}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-500 mt-2">
                    <span>Min: {sensor.minThreshold ?? 'N/A'}</span>
                    <span>Max: {sensor.maxThreshold ?? 'N/A'}</span>
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
