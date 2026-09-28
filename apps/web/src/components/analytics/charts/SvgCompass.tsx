"use client";

import React from "react";

interface SvgCompassProps {
  degree: number; // 0 to 360
  cardinal: string; // e.g. "SSW"
  speedKmh: number;
  size?: number;
}

export function SvgCompass({
  degree,
  cardinal,
  speedKmh,
  size = 140,
}: SvgCompassProps) {
  const center = size / 2;
  const radius = (size - 16) / 2;

  const points = [
    { label: "N", angle: 0, x: center, y: center - radius + 10 },
    { label: "E", angle: 90, x: center + radius - 10, y: center + 3.5 },
    { label: "S", angle: 180, x: center, y: center + radius - 3 },
    { label: "W", angle: 270, x: center - radius + 10, y: center + 3.5 },
  ];

  return (
    <div className="flex flex-col items-center justify-center font-mono select-none">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Outer ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="#080e1a"
            stroke="#1e293b"
            strokeWidth="2"
          />

          {/* Inner ring */}
          <circle
            cx={center}
            cy={center}
            r={radius - 12}
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="2 4"
          />

          {/* Cardinal Directions */}
          {points.map((p) => (
            <text
              key={p.label}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              fontSize="9"
              fontWeight="bold"
              fill={p.label === "N" ? "#f43f5e" : "#94a3b8"}
            >
              {p.label}
            </text>
          ))}

          {/* Rotating Compass Needle */}
          <g
            transform={`rotate(${degree} ${center} ${center})`}
            className="transition-transform duration-700 ease-out"
          >
            {/* North pointer (Cyan / Red tip) */}
            <polygon
              points={`${center},${center - radius + 16} ${center - 4},${center} ${center + 4},${center}`}
              fill="#06b6d4"
            />
            {/* South pointer (Slate) */}
            <polygon
              points={`${center},${center + radius - 16} ${center - 4},${center} ${center + 4},${center}`}
              fill="#475569"
            />
            {/* Center Pivot Pin */}
            <circle
              cx={center}
              cy={center}
              r="4"
              fill="#0ea5e9"
              stroke="#070b13"
              strokeWidth="1.5"
            />
          </g>
        </svg>

        {/* Floating summary badge inside */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] font-bold text-cyan-200 mt-6">
            {degree}° {cardinal}
          </span>
          <span className="text-[9px] text-slate-400 font-semibold">
            {speedKmh} km/h
          </span>
        </div>
      </div>
    </div>
  );
}
