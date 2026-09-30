import { Suspense } from "react";
import { MaintenanceManager } from "@/components/maintenance";

export default function MaintenancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-slate-400">Loading maintenance subsystem...</div>}>
      <MaintenanceManager />
    </Suspense>
  );
}
