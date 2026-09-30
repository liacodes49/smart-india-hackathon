import React from "react";
import type { Metadata } from "next";
import AntarcticaOverview from "@/components/digital-twin/AntarcticaOverview";

export const metadata: Metadata = {
  title: "3D Digital Twin - NCPOR Antarctic Digital Twin",
  description: "3D interactive spatial digital twin of Antarctic research stations Maitri & Bharati",
};

export default function DigitalTwinPage() {
  return (
    <div className="flex-1 -m-4 sm:-m-6 h-[calc(100vh-96px)] relative overflow-hidden bg-black">
      <AntarcticaOverview />
    </div>
  );
}
