import { Suspense } from "react";
import { AlertsManager } from "@/components/alerts";

export default function AlertsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-slate-400">Loading alerts engine...</div>}>
      <AlertsManager />
    </Suspense>
  );
}
