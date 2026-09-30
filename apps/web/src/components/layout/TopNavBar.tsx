"use client";

import React, { useSyncExternalStore } from "react";
import Link from "next/link";
import { useStationStore } from "@/stores/useStationStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { StationId } from "@repo/shared/enums";
import { Globe2, Clock, Radio, Compass } from "lucide-react";

function subscribeClock(callback: () => void) {
  const interval = setInterval(callback, 1000);
  return () => clearInterval(interval);
}

function getUtcTimeSnapshot() {
  return new Date().toUTCString().slice(17, 25) + " UTC";
}

function getServerSnapshot() {
  return "--:--:-- UTC";
}

export function TopNavBar() {
  const activeStation = useStationStore((s) => s.activeStation);
  const setActiveStation = useStationStore((s) => s.setActiveStation);
  const { activeTerminal, user } = useAuthStore();
  const utcTime = useSyncExternalStore(subscribeClock, getUtcTimeSnapshot, getServerSnapshot);

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-[#060a12]/95 backdrop-blur-md border-b border-white/[0.08] z-40 flex items-center justify-between px-3 sm:px-5 select-none font-mono text-xs">
      {/* Brand: NCPOR Antarctic Mission */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
          <Globe2 className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold tracking-wider text-slate-100 uppercase">
              NCPOR DIGITAL TWIN
            </span>
            <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded border border-slate-700 bg-slate-900 text-cyan-300">
              MoES / NCAOR
            </span>
          </div>
          <p className="text-[9.5px] text-slate-400 leading-none hidden sm:block">
            Antarctic Research Stations Remote Command Centre
          </p>
        </div>
      </div>

      {/* Station Switcher: Segmented Toggle (MAITRI / BHARATI) */}
      <div
        className="flex items-center p-0.5 rounded-lg bg-[#040810] border border-white/[0.08]"
        role="tablist"
        aria-label="Antarctic Station Selector"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeStation === StationId.MAITRI}
          onClick={() => setActiveStation(StationId.MAITRI)}
          className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
            activeStation === StationId.MAITRI
              ? "bg-cyan-950 text-cyan-200 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              activeStation === StationId.MAITRI ? "bg-cyan-400" : "bg-slate-600"
            }`}
          />
          <span className="tracking-wider">MAITRI</span>
          <span className="text-[9px] text-cyan-300/70 font-normal hidden md:inline">
            70°S
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeStation === StationId.BHARATI}
          onClick={() => setActiveStation(StationId.BHARATI)}
          className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
            activeStation === StationId.BHARATI
              ? "bg-cyan-950 text-cyan-200 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              activeStation === StationId.BHARATI ? "bg-cyan-400" : "bg-slate-600"
            }`}
          />
          <span className="tracking-wider">BHARATI</span>
          <span className="text-[9px] text-cyan-300/70 font-normal hidden md:inline">
            69°S
          </span>
        </button>
      </div>

      {/* Right Controls: Telemetry Link & Mission Time */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Live Link Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/80 border border-white/[0.06] text-[10.5px]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="font-semibold text-emerald-400 tracking-wider">LIVE</span>
          <Radio className="w-3 h-3 text-slate-500 hidden md:inline" />
        </div>

        {/* UTC Mission Clock */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/80 border border-white/[0.06] text-[11px] text-slate-300">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>{utcTime}</span>
        </div>

        {/* Workstation Terminal Badge / Switcher */}
        <Link
          href="/login"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-[10.5px] font-bold text-cyan-200 transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)]"
          title="Switch Workstation Terminal or Log In via Supabase"
        >
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">
            {activeTerminal === "MAITRI"
              ? "LAPTOP 1: MAITRI"
              : activeTerminal === "BHARATI"
              ? "LAPTOP 2: BHARATI"
              : "LAPTOP 3: HQ TWIN"}
          </span>
          <span className="text-[9px] text-cyan-400/80 font-normal hidden lg:inline">
            ({user?.name?.split(" ")[0] || "Auth"})
          </span>
        </Link>
      </div>
    </header>
  );
}
