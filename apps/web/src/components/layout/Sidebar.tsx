"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStationStore } from "@/stores/useStationStore";
import {
  LayoutDashboard,
  Box,
  AlertTriangle,
  Activity,
  TrendingUp,
  Sliders,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Radio,
  BarChart3,
  Globe2,
  Compass,
  Building2,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TERMINAL_ITEMS: NavItem[] = [
  {
    label: "HQ Command (Laptop 3)",
    href: "/dashboard",
    icon: Globe2,
  },
  {
    label: "Maitri Station (Laptop 1)",
    href: "/station/maitri",
    icon: Compass,
  },
  {
    label: "Bharati Station (Laptop 2)",
    href: "/station/bharati",
    icon: Building2,
  },
];

const MODULE_ITEMS: NavItem[] = [
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    label: "3D Digital Twin",
    href: "/digital-twin",
    icon: Box,
  },
  {
    label: "Alerts",
    href: "/alerts",
    icon: AlertTriangle,
  },
  {
    label: "Telemetry",
    href: "/telemetry",
    icon: Activity,
  },
  {
    label: "Predictions",
    href: "/predictions",
    icon: TrendingUp,
  },
  {
    label: "Simulation",
    href: "/simulation",
    icon: Sliders,
  },
  {
    label: "Maintenance",
    href: "/maintenance",
    icon: Wrench,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const isSidebarCollapsed = useStationStore((s) => s.isSidebarCollapsed);
  const toggleSidebar = useStationStore((s) => s.toggleSidebar);
  const activeStation = useStationStore((s) => s.activeStation);
  const activeAlertCount = useStationStore((s) => s.activeAlertCount);
  const criticalAlertCount = useStationStore((s) => s.criticalAlertCount);
  const isLiveConnected = useStationStore((s) => s.isLiveConnected);
  const lastTelemetryTimestamp = useStationStore((s) => s.lastTelemetryTimestamp);

  return (
    <aside
      className={`fixed top-24 bottom-0 left-0 z-30 bg-[#070b13]/95 backdrop-blur-md border-r border-white/[0.08] transition-all duration-200 flex flex-col justify-between select-none font-mono ${
        isSidebarCollapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Navigation List */}
      <div className="p-2 flex flex-col gap-1 overflow-y-auto">
        <div className="flex items-center justify-between px-2 py-1 mb-1">
          {!isSidebarCollapsed && (
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
              WORKSTATION CONSOLES
            </span>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors ml-auto cursor-pointer"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* 3 Workstation Consoles */}
        {TERMINAL_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all cursor-pointer group relative ${
                isActive
                  ? "bg-cyan-950/80 text-cyan-200 border border-cyan-500/50 font-bold shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                  : "text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent"
              }`}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <div className="relative">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-cyan-300"
                  }`}
                />
              </div>
              {!isSidebarCollapsed && (
                <span className="truncate flex-1 font-bold text-[11px]">{item.label}</span>
              )}
            </Link>
          );
        })}

        {/* Mission Modules Divider */}
        {!isSidebarCollapsed && (
          <div className="pt-3 pb-1 px-2 border-t border-white/[0.06] mt-2">
            <span className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider">
              MISSION MODULES
            </span>
          </div>
        )}

        {MODULE_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const isAlertsItem = item.href === "/alerts";
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-1.5 rounded text-xs transition-colors cursor-pointer group relative ${
                isActive
                  ? "bg-cyan-950/70 text-cyan-200 border border-cyan-500/40 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
              }`}
              title={isSidebarCollapsed ? `${item.label}${isAlertsItem && activeAlertCount > 0 ? ` (${activeAlertCount} active)` : ''}` : undefined}
            >
              <div className="relative">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-cyan-300"
                  }`}
                />
                {isAlertsItem && activeAlertCount > 0 && isSidebarCollapsed && (
                  <span
                    className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                      criticalAlertCount > 0
                        ? "bg-rose-500 animate-ping"
                        : "bg-amber-400"
                    }`}
                  />
                )}
              </div>
              {!isSidebarCollapsed && (
                <>
                  <span className="truncate flex-1">{item.label}</span>
                  {isAlertsItem && activeAlertCount > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold border ${
                        criticalAlertCount > 0
                          ? "bg-rose-950 text-rose-300 border-rose-500/60 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                          : "bg-amber-950 text-amber-300 border-amber-500/60"
                      }`}
                    >
                      {activeAlertCount}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Subsystem Status */}
      <div className="p-3 border-t border-white/[0.06] text-[11px] text-slate-400">
        {!isSidebarCollapsed ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="tracking-wider">LINK STATUS</span>
              <span className={`font-semibold flex items-center gap-1 ${isLiveConnected ? "text-emerald-400" : "text-amber-400"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLiveConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                {isLiveConnected ? "LIVE SSE" : "POLLING"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Radio className={`w-3.5 h-3.5 ${isLiveConnected ? "text-cyan-400" : "text-slate-500"}`} />
              <span className="text-[10px] font-semibold text-slate-200">
                {activeStation} BUS
              </span>
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5 truncate">
              {isLiveConnected
                ? "Telemetry stream connected"
                : "Awaiting telemetry stream"}
            </div>
          </div>
        ) : (
          <div
            className="flex justify-center"
            title={`${activeStation} Data Bus (${isLiveConnected ? "LIVE SSE" : "POLLING"})`}
          >
            <Radio className={`w-4 h-4 ${isLiveConnected ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
          </div>
        )}
      </div>
    </aside>
  );
}
