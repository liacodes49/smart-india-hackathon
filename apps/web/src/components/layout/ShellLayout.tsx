"use client";

import React from "react";
import { TopNavBar } from "./TopNavBar";
import { StationStatusHeader } from "./StationStatusHeader";
import { Sidebar } from "./Sidebar";
import { useStationStore } from "@/stores/useStationStore";

interface ShellLayoutProps {
  children: React.ReactNode;
}

export function ShellLayout({ children }: ShellLayoutProps) {
  const isSidebarCollapsed = useStationStore((s) => s.isSidebarCollapsed);

  return (
    <div className="min-h-screen bg-[#05080d] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Fixed Top Nav (h-14, 56px) */}
      <TopNavBar />

      {/* 2. Persistent Station Status Header (h-10, 40px, fixed at top-14) */}
      <StationStatusHeader />

      {/* 3. Collapsible Sidebar (fixed at top-24, 96px) */}
      <Sidebar />

      {/* 4. Main Content Area */}
      <main
        className={`flex-1 pt-24 transition-all duration-200 ${
          isSidebarCollapsed ? "pl-16" : "pl-16 md:pl-56"
        }`}
      >
        <div className="p-4 sm:p-6 max-w-[1920px] mx-auto w-full min-h-[calc(100vh-96px)] flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
