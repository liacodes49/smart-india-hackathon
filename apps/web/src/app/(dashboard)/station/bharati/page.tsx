import { Suspense } from "react";
import { StationEdgeConsole } from "@/components/station/StationEdgeConsole";

export const metadata = {
  title: "Bharati Station Console — NCPOR Antarctic Digital Twin",
  description: "Dedicated on-site SCADA console and satellite telemetry uplink for Bharati Station, Antarctica.",
};

export default function BharatiStationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-slate-400">Connecting to Bharati Station Terminal...</div>}>
      <StationEdgeConsole stationId="BHARATI" />
    </Suspense>
  );
}
