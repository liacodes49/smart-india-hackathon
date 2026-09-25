"use client";

import React, { useState, useId } from "react";

export interface ChartDataPoint {
  timestamp: string;
  primaryValue: number; // e.g. Demand
  secondaryValue?: number; // e.g. Generation
  extraValue?: number;
}

interface SvgAreaChartProps {
  data: ChartDataPoint[];
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  unit?: string;
  height?: number;
  peakThreshold?: number;
  peakLabel?: string;
}

export function SvgAreaChart({
  data,
  primaryLabel = "Demand",
  secondaryLabel = "Generation",
  primaryColor = "#06b6d4", // cyan-500
  secondaryColor = "#10b981", // emerald-500
  unit = "kW",
  height = 240,
  peakThreshold,
  peakLabel = "Peak Threshold",
}: SvgAreaChartProps) {
  const gradientIdPrimary = useId();
  const gradientIdSecondary = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 font-mono text-xs">
        No timeseries data available
      </div>
    );
  }

  // Calculate min & max
  const allValues = data.flatMap((d) => [
    d.primaryValue,
    d.secondaryValue ?? d.primaryValue,
    peakThreshold ?? d.primaryValue,
  ]);
  const minValue = Math.max(0, Math.floor(Math.min(...allValues) * 0.85));
  const maxValue = Math.ceil(Math.max(...allValues) * 1.15);
  const valueRange = maxValue - minValue || 1;

  // Chart coordinate space
  const chartWidth = 700;
  const chartHeight = height;
  const paddingLeft = 46;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 32;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(minValue, Math.min(maxValue, val));
    const ratio = (clamped - minValue) / valueRange;
    return paddingTop + innerHeight - ratio * innerHeight;
  };

  // Build SVG Path for secondary line/area (Generation)
  let secondaryAreaPath = "";
  let secondaryLinePath = "";
  if (data[0].secondaryValue !== undefined) {
    const points = data.map((d, i) => `${getX(i)},${getY(d.secondaryValue!)}`);
    secondaryLinePath = `M ${points.join(" L ")}`;
    secondaryAreaPath = `${secondaryLinePath} L ${getX(data.length - 1)},${
      paddingTop + innerHeight
    } L ${getX(0)},${paddingTop + innerHeight} Z`;
  }

  // Build SVG Path for primary line/area (Demand)
  const primaryPoints = data.map((d, i) => `${getX(i)},${getY(d.primaryValue)}`);
  const primaryLinePath = `M ${primaryPoints.join(" L ")}`;
  const primaryAreaPath = `${primaryLinePath} L ${getX(data.length - 1)},${
    paddingTop + innerHeight
  } L ${getX(0)},${paddingTop + innerHeight} Z`;

  // Grid tick values (4 steps)
  const gridTicks = [
    minValue,
    Math.round(minValue + valueRange * 0.33),
    Math.round(minValue + valueRange * 0.66),
    maxValue,
  ];

  const hoveredItem = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className="relative w-full select-none font-mono">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-auto overflow-visible"
        preserveAspectRatio="none"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={gradientIdPrimary} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.0" />
          </linearGradient>

          <linearGradient id={gradientIdSecondary} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines & Y-axis labels */}
        {gridTicks.map((val) => {
          const y = getY(val);
          return (
            <g key={val} className="text-slate-600">
              <line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.25"
              />
              <text
                x={paddingLeft - 8}
                y={y + 3.5}
                textAnchor="end"
                fontSize="9"
                fill="#64748b"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Peak Threshold Dashed Line */}
        {peakThreshold && (
          <g>
            <line
              x1={paddingLeft}
              y1={getY(peakThreshold)}
              x2={chartWidth - paddingRight}
              y2={getY(peakThreshold)}
              stroke="#f43f5e"
              strokeWidth="1.2"
              strokeDasharray="4 4"
              opacity="0.8"
            />
            <text
              x={chartWidth - paddingRight - 6}
              y={getY(peakThreshold) - 4}
              textAnchor="end"
              fontSize="8.5"
              fill="#f43f5e"
              fontWeight="bold"
            >
              {peakLabel} ({peakThreshold} {unit})
            </text>
          </g>
        )}

        {/* Secondary Area & Line (Generation) */}
        {secondaryAreaPath && (
          <>
            <path d={secondaryAreaPath} fill={`url(#${gradientIdSecondary})`} />
            <path
              d={secondaryLinePath}
              fill="none"
              stroke={secondaryColor}
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.85"
            />
          </>
        )}

        {/* Primary Area & Line (Demand) */}
        <path d={primaryAreaPath} fill={`url(#${gradientIdPrimary})`} />
        <path
          d={primaryLinePath}
          fill="none"
          stroke={primaryColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* X-Axis labels */}
        {data.map((d, i) => {
          // Render only a subset of X labels to avoid overcrowding
          const step = Math.ceil(data.length / 7);
          const showLabel = i % step === 0 || i === data.length - 1;
          if (!showLabel) return null;

          return (
            <text
              key={i}
              x={getX(i)}
              y={chartHeight - 8}
              textAnchor="middle"
              fontSize="9"
              fill="#64748b"
            >
              {d.timestamp}
            </text>
          );
        })}

        {/* Invisible hit targets for mouse hover */}
        {data.map((_, i) => {
          const x = getX(i);
          const width = innerWidth / (data.length - 1 || 1);
          return (
            <rect
              key={i}
              x={x - width / 2}
              y={paddingTop}
              width={width}
              height={innerHeight}
              fill="transparent"
              className="cursor-crosshair"
              onMouseEnter={() => setHoverIndex(i)}
            />
          );
        })}

        {/* Hover Crosshair and Markers */}
        {hoverIndex !== null && hoveredItem && (
          <g>
            <line
              x1={getX(hoverIndex)}
              y1={paddingTop}
              x2={getX(hoverIndex)}
              y2={paddingTop + innerHeight}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.6"
            />

            {/* Primary marker dot */}
            <circle
              cx={getX(hoverIndex)}
              cy={getY(hoveredItem.primaryValue)}
              r="4.5"
              fill={primaryColor}
              stroke="#070b13"
              strokeWidth="2"
            />

            {/* Secondary marker dot */}
            {hoveredItem.secondaryValue !== undefined && (
              <circle
                cx={getX(hoverIndex)}
                cy={getY(hoveredItem.secondaryValue)}
                r="4"
                fill={secondaryColor}
                stroke="#070b13"
                strokeWidth="2"
              />
            )}
          </g>
        )}
      </svg>

      {/* Floating Hover Tooltip HUD */}
      {hoverIndex !== null && hoveredItem && (
        <div
          className="absolute z-20 pointer-events-none top-2 transform -translate-x-1/2 rounded-lg bg-[#070b14]/95 border border-white/[0.12] p-2 text-[10px] shadow-xl backdrop-blur-md"
          style={{
            left: `${((getX(hoverIndex) / chartWidth) * 100).toFixed(1)}%`,
          }}
        >
          <div className="font-bold text-slate-300 border-b border-white/[0.08] pb-1 mb-1">
            Time: {hoveredItem.timestamp}
          </div>
          <div className="flex items-center justify-between gap-3 text-cyan-300">
            <span>{primaryLabel}:</span>
            <span className="font-bold">
              {hoveredItem.primaryValue} {unit}
            </span>
          </div>
          {hoveredItem.secondaryValue !== undefined && (
            <div className="flex items-center justify-between gap-3 text-emerald-300 mt-0.5">
              <span>{secondaryLabel}:</span>
              <span className="font-bold">
                {hoveredItem.secondaryValue} {unit}
              </span>
            </div>
          )}
          {hoveredItem.secondaryValue !== undefined && (
            <div className="flex items-center justify-between gap-3 text-slate-400 text-[9px] border-t border-white/[0.06] pt-1 mt-1">
              <span>Reserve Margin:</span>
              <span className="text-emerald-400 font-semibold">
                +{hoveredItem.secondaryValue - hoveredItem.primaryValue} {unit}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
