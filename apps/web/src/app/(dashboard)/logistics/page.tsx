import React from "react";
import type { Metadata } from "next";
import { LogisticsView } from "@/components/logistics";

export const metadata: Metadata = {
  title: "Logistics & Fleet — NCPOR Antarctic Command Centre",
  description: "Antarctic station logistics, overland vehicle fleet telemetry, and polar supply tracking",
};

export default function LogisticsPage() {
  return <LogisticsView />;
}
