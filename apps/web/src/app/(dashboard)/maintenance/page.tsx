import React from "react";
import type { Metadata } from "next";
import { MaintenanceManagement } from "@/components/maintenance";

export const metadata: Metadata = {
  title: "Predictive Maintenance — NCPOR Antarctic Command Centre",
  description: "Antarctic station equipment health, failure probability predictions, and maintenance tasks",
};

export default function MaintenancePage() {
  return <MaintenanceManagement />;
}
