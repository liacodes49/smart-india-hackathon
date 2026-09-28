import React from "react";
import type { Metadata } from "next";
import { AnalyticsPage } from "@/components/analytics";

export const metadata: Metadata = {
  title: "Analytics Dashboard — NCPOR Antarctic Digital Twin",
  description: "Engineering telemetry analytics, microgrid performance, POL reserves, forecasts and cross-domain impact for Maitri and Bharati stations",
};

export default function Page() {
  return <AnalyticsPage />;
}
