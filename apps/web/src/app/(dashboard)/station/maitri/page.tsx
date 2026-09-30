import { Suspense } from "react";
import { StationEdgeConsole } from "@/components/station/StationEdgeConsole";

export const metadata = {
  title: "Maitri Station Console — NCPOR Antarctic Digital Twin",
  description: "Dedicated on-site SCADA console and satellite telemetry uplink for Maitri Station, Antarctica.",
};

export default function MaitriStationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-slate-400">Connecting to Maitri Station Terminal...</div>}>
      <StationEdgeConsole stationId="MAITRI" />
    </Suspense>
  );
}
