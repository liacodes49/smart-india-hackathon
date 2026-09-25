"use client";

import React, { useState } from "react";
import {
  EnvironmentalAnalyticsData,
  EnvironmentalMetricKey,
} from "@/features/analytics/types";
import { SvgAreaChart } from "./charts/SvgAreaChart";
import { SvgCompass } from "./charts/SvgCompass";
import {
  CloudSnow,
  Thermometer,
  Wind,
  Compass,
  Gauge,
  Droplets,
  Eye,
} from "lucide-react";

interface EnvironmentalAnalyticsPanelProps {
  environmental: EnvironmentalAnalyticsData;
  stationName: string;
}

export function EnvironmentalAnalyticsPanel({
  environmental,
  stationName,
}: EnvironmentalAnalyticsPanelProps) {
  const [activeMetric, setActiveMetric] = useState<EnvironmentalMetricKey>("temperature");

  const cur = environmental.current;

  // Metric definitions
  const METRIC_CONFIGS: Record<
    EnvironmentalMetricKey,
    {
      label: string;
      unit: string;
      value: number;
      displayValue: string;
      subtext: string;
      icon: React.ComponentType<{ className?: string }>;
      color: string;
      getValue: (pt: (typeof environmental.trendPoints)[0]) => number;
    }
  > = {
    temperature: {
      label: "Temperature",
      unit: "°C",
      value: cur.temperatureC,
      displayValue: `${cur.temperatureC}°C`,
      subtext: `Wind Chill: ${cur.windChillC}°C`,
      icon: Thermometer,
      color: "#38bdf8",
      getValue: (pt) => pt.temperatureC,
    },
    windSpeed: {
      label: "Wind Speed",
      unit: "km/h",
      value: cur.windSpeedKmh,
      displayValue: `${cur.windSpeedKmh} km/h`,
      subtext: "Gale Category: Moderate",
      icon: Wind,
      color: "#06b6d4",
      getValue: (pt) => pt.windSpeedKmh,
    },
    windDirection: {
      label: "Wind Direction",
      unit: "°",
      value: cur.windDirectionDeg,
      displayValue: `${cur.windDirectionDeg}° ${cur.windDirectionCardinal}`,
      subtext: "Katabatic Bearing",
      icon: Compass,
      color: "#10b981",
      getValue: (pt) => pt.windDirectionDeg,
    },
    pressure: {
      label: "Barometric Pressure",
      unit: "hPa",
      value: cur.pressureHpa,
      displayValue: `${cur.pressureHpa} hPa`,
      subtext: "Antarctic Low System",
      icon: Gauge,
      color: "#a855f7",
      getValue: (pt) => pt.pressureHpa,
    },
    humidity: {
      label: "Relative Humidity",
      unit: "%",
      value: cur.humidityPercent,
      displayValue: `${cur.humidityPercent}%`,
      subtext: "Dry Continental Cold",
      icon: Droplets,
      color: "#3b82f6",
      getValue: (pt) => pt.humidityPercent,
    },
    visibility: {
      label: "Visibility",
      unit: "km",
      value: cur.visibilityKm,
      displayValue: `${cur.visibilityKm} km`,
      subtext: cur.visibilityKm < 5 ? "Blizzard Reduced" : "Clear Polar Sky",
      icon: Eye,
      color: "#f59e0b",
      getValue: (pt) => pt.visibilityKm,
    },
  };

  const currentConfig = METRIC_CONFIGS[activeMetric];

  const chartData = environmental.trendPoints.map((pt) => ({
    timestamp: pt.timestamp,
    primaryValue: currentConfig.getValue(pt),
  }));

  return (
    <section
      aria-label="Environmental Analytics"
      className="p-4 rounded-2xl border border-white/[0.08] bg-[#080d16]/90 backdrop-blur-md font-mono select-none flex flex-col gap-3.5"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <CloudSnow className="w-4 h-4 text-cyan-400" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              5. ENVIRONMENTAL & METEOROLOGICAL ANALYTICS — [{stationName}]
            </h3>
            <p className="text-[10px] text-slate-400">
              Automatic Weather Station (AWS) Telemetry Stream & Atmospheric Sensors
            </p>
          </div>
        </div>

        <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
          Mast Elevation: 10m AGL
        </span>
      </div>

      {/* 6 Metric Selector Buttons / Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {(Object.keys(METRIC_CONFIGS) as EnvironmentalMetricKey[]).map((key) => {
          const cfg = METRIC_CONFIGS[key];
          const Icon = cfg.icon;
          const isSelected = activeMetric === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveMetric(key)}
              className={`p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-1.5 ${
                isSelected
                  ? "bg-cyan-950/70 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                  : "bg-slate-950/60 border-white/[0.06] hover:bg-slate-900 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[9.5px] uppercase font-bold tracking-wider truncate ${
                    isSelected ? "text-cyan-300" : "text-slate-400"
                  }`}
                >
                  {cfg.label}
                </span>
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isSelected ? "text-cyan-400" : "text-slate-400"
                  }`}
                />
              </div>

              <div className="my-0.5">
                <span
                  className={`text-sm font-bold block ${
                    isSelected ? "text-white" : "text-slate-200"
                  }`}
                >
                  {cfg.displayValue}
                </span>
                <span className="text-[9px] text-slate-400 block truncate">
                  {cfg.subtext}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Split View: Timeseries Chart for Selected Metric + Antarctic Wind Compass */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* Left 8 cols: Selected Metric History Chart */}
        <div className="lg:col-span-8 p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.05] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-xs font-bold text-slate-200">
                {currentConfig.label} ({currentConfig.unit}) — 24H Profile
              </h4>
              <span className="text-[9.5px] text-slate-400">
                Hourly AWS telemetry updates
              </span>
            </div>
            <span className="text-[10px] text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
              Active: {currentConfig.displayValue}
            </span>
          </div>

          <SvgAreaChart
            data={chartData}
            primaryLabel={currentConfig.label}
            primaryColor={currentConfig.color}
            unit={currentConfig.unit}
            height={190}
          />
        </div>

        {/* Right 4 cols: Antarctic Wind Compass Rose & Wind Shear */}
        <div className="lg:col-span-4 p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.05] flex flex-col items-center justify-between text-center">
          <div className="w-full text-left pb-1 border-b border-white/[0.06]">
            <h4 className="text-xs font-bold text-slate-200">
              Antarctic Wind Compass Rose
            </h4>
            <span className="text-[9.5px] text-slate-400">
              Vector bearing & surface gust speed
            </span>
          </div>

          <div className="py-2">
            <SvgCompass
              degree={cur.windDirectionDeg}
              cardinal={cur.windDirectionCardinal}
              speedKmh={cur.windSpeedKmh}
              size={135}
            />
          </div>

          <div className="w-full pt-2 border-t border-white/[0.04] grid grid-cols-2 gap-2 text-[9.5px] text-slate-400 text-left">
            <div>
              Wind Chill:{" "}
              <span className="text-cyan-300 font-bold">{cur.windChillC}°C</span>
            </div>
            <div>
              Gust Max:{" "}
              <span className="text-slate-200 font-bold">
                {Math.round(cur.windSpeedKmh * 1.35)} km/h
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
