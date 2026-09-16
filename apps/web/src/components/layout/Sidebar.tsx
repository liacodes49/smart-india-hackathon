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
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Command Centre",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Digital Twin",
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

  return (
    <aside
      className={`fixed top-24 bottom-0 left-0 z-30 bg-[#070b13]/95 backdrop-blur-md border-r border-white/[0.08] transition-all duration-200 flex flex-col justify-between select-none font-mono ${
        isSidebarCollapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Navigation List */}
      <div className="p-2 flex flex-col gap-1">
        <div className="flex items-center justify-between px-2 py-1 mb-1">
          {!isSidebarCollapsed && (
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              MISSION MODULES
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

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded text-xs transition-colors cursor-pointer group ${
                isActive
                  ? "bg-cyan-950/70 text-cyan-200 border border-cyan-500/40 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
              }`}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-cyan-300"
                }`}
              />
              {!isSidebarCollapsed && (
                <span className="truncate">{item.label}</span>
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
              <span className="text-emerald-400 font-semibold">ACTIVE</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-semibold text-slate-200">
                {activeStation} BUS
              </span>
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">
              Awaiting telemetry stream
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title={`${activeStation} Data Bus Active`}>
            <Radio className="w-4 h-4 text-emerald-400" />
          </div>
        )}
      </div>
    </aside>
  );
}
