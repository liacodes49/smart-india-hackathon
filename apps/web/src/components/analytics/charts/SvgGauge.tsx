"use client";

import React from "react";

interface SvgGaugeProps {
  value: number; // 0 to 100 or specific range
  maxValue?: number;
  label?: string;
  sublabel?: string;
  unit?: string;
  size?: number; // width/height in px
  strokeWidth?: number;
  colorType?: "load" | "health" | "risk" | "custom";
  customColor?: string;
}

export function SvgGauge({
  value,
  maxValue = 100,
  label,
  sublabel,
  unit = "%",
  size = 130,
  strokeWidth = 10,
  colorType = "health",
  customColor,
}: SvgGaugeProps) {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));

  // Gauge arc parameters (240 degree arc)
  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;
  const arcDegree = 240;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (arcDegree / 360) * circumference;
  const progressOffset = arcLength - (percentage / 100) * arcLength;

  // Determine color based on threshold logic
  let activeColor = customColor || "#06b6d4"; // default cyan
  if (colorType === "health") {
    if (percentage >= 85) activeColor = "#10b981"; // emerald-500
    else if (percentage >= 70) activeColor = "#f59e0b"; // amber-500
    else activeColor = "#f43f5e"; // rose-500
  } else if (colorType === "load") {
    if (percentage > 85) activeColor = "#f43f5e"; // rose - overloaded
    else if (percentage > 75) activeColor = "#f59e0b"; // amber - high load
    else activeColor = "#06b6d4"; // cyan - optimal
  } else if (colorType === "risk") {
    if (percentage > 70) activeColor = "#f43f5e"; // high risk
    else if (percentage > 35) activeColor = "#f59e0b"; // moderate risk
    else activeColor = "#10b981"; // low risk
  }

  // Rotation to center the 240-deg arc with opening at bottom
  // Arc starts at 150 deg (or 90 + (360-240)/2 = 150)
  const rotationAngle = 150;

  return (
    <div className="flex flex-col items-center justify-center font-mono select-none">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Track Arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            transform={`rotate(${rotationAngle} ${center} ${center})`}
            opacity="0.6"
          />

          {/* Active Progress Arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={activeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            transform={`rotate(${rotationAngle} ${center} ${center})`}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Readout Value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="flex items-baseline justify-center">
            <span
              className="text-lg sm:text-xl font-bold tracking-tight"
              style={{ color: activeColor }}
            >
              {typeof value === "number" ? Math.round(value * 10) / 10 : value}
            </span>
            {unit && <span className="text-[10px] text-slate-400 ml-0.5">{unit}</span>}
          </div>
          {label && (
            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold max-w-[80px] truncate">
              {label}
            </span>
          )}
        </div>
      </div>

      {sublabel && (
        <span className="text-[10px] text-slate-400 mt-0.5 text-center">
          {sublabel}
        </span>
      )}
    </div>
  );
}
