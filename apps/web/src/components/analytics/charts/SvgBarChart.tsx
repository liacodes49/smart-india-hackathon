"use client";

import React, { useState } from "react";

export interface BarDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  highlight?: boolean;
}

interface SvgBarChartProps {
  data: BarDataPoint[];
  unit?: string;
  height?: number;
  baseline?: number;
  baselineLabel?: string;
}

export function SvgBarChart({
  data,
  unit = "L",
  height = 180,
  baseline,
  baselineLabel = "Baseline",
}: SvgBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-slate-500 font-mono text-xs">
        No bar chart data
      </div>
    );
  }

  const values = data.map((d) => d.value);
  if (baseline) values.push(baseline);
  const maxValue = Math.ceil(Math.max(...values) * 1.15);
  const minValue = 0;
  const valueRange = maxValue - minValue || 1;

  const chartWidth = 500;
  const chartHeight = height;
  const padLeft = 45;
  const padRight = 15;
  const padTop = 15;
  const padBottom = 28;

  const innerW = chartWidth - padLeft - padRight;
  const innerH = chartHeight - padTop - padBottom;

  const barWidth = Math.min(32, (innerW / data.length) * 0.6);
  const getX = (idx: number) => {
    return padLeft + (idx + 0.5) * (innerW / data.length);
  };

  const getY = (val: number) => {
    const ratio = (val - minValue) / valueRange;
    return padTop + innerH - ratio * innerH;
  };

  const hoveredItem = hoveredIdx !== null ? data[hoveredIdx] : null;

  return (
    <div className="relative w-full select-none font-mono">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-auto overflow-visible"
        preserveAspectRatio="none"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {/* Baseline Dashed Line */}
        {baseline && (
          <g>
            <line
              x1={padLeft}
              y1={getY(baseline)}
              x2={chartWidth - padRight}
              y2={getY(baseline)}
              stroke="#f59e0b"
              strokeWidth="1.2"
              strokeDasharray="4 4"
              opacity="0.75"
            />
            <text
              x={chartWidth - padRight - 4}
              y={getY(baseline) - 4}
              textAnchor="end"
              fontSize="8.5"
              fill="#f59e0b"
            >
              {baselineLabel} ({baseline} {unit})
            </text>
          </g>
        )}

        {/* Bars */}
        {data.map((d, i) => {
          const x = getX(i) - barWidth / 2;
          const y = getY(d.value);
          const barH = padTop + innerH - y;
          const isHovered = hoveredIdx === i;

          return (
            <g
              key={i}
              className="cursor-pointer transition-opacity"
              onMouseEnter={() => setHoveredIdx(i)}
            >
              {/* Background slot hit-area */}
              <rect
                x={getX(i) - innerW / data.length / 2}
                y={padTop}
                width={innerW / data.length}
                height={innerH}
                fill="transparent"
              />

              {/* Foreground Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(2, barH)}
                rx="3"
                fill={
                  isHovered
                    ? "#38bdf8"
                    : d.highlight
                    ? "#06b6d4"
                    : "#0284c7"
                }
                opacity={isHovered ? "1" : "0.85"}
                className="transition-colors duration-200"
              />

              {/* X-axis Label */}
              <text
                x={getX(i)}
                y={chartHeight - 8}
                textAnchor="middle"
                fontSize="9"
                fill={isHovered ? "#38bdf8" : "#94a3b8"}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredIdx !== null && hoveredItem && (
        <div
          className="absolute z-20 pointer-events-none top-0 transform -translate-x-1/2 rounded-md bg-[#070b14]/95 border border-cyan-500/30 px-2 py-1 text-[10px] shadow-lg backdrop-blur-md"
          style={{
            left: `${((getX(hoveredIdx) / chartWidth) * 100).toFixed(1)}%`,
          }}
        >
          <span className="text-slate-400">{hoveredItem.label}: </span>
          <span className="font-bold text-cyan-300">
            {hoveredItem.value.toLocaleString()} {unit}
          </span>
        </div>
      )}
    </div>
  );
}
