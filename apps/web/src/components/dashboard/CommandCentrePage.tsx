"use client";

import React from "react";
import { KpiCardGrid } from "./KpiCardGrid";
import { DigitalTwinPanel } from "./DigitalTwinPanel";
import { StationHealthPanel } from "./StationHealthPanel";
import { AssetTelemetryPanel } from "./AssetTelemetryPanel";

export function CommandCentrePage() {
  return (
    <div className="flex-1 flex flex-col gap-3.5 h-full min-h-0 select-none">
      {/* 1. Top KPI Telemetry Strip */}
      <KpiCardGrid />

      {/* 2. Main Dashboard Split: Dominant 3D Viewport + Secondary Diagnostics Dock */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3.5 min-h-0">
        {/* Dominant Digital Twin Container */}
        <div className="flex-1 min-w-0 flex flex-col">
          <DigitalTwinPanel />
        </div>

        {/* Secondary Information Dock: Station Health & Asset Telemetry */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col gap-3.5">
          <StationHealthPanel />
          <AssetTelemetryPanel />
        </div>
      </div>
    </div>
  );
}