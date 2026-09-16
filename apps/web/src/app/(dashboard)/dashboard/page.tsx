import React from "react";
import type { Metadata } from "next";
import { CommandCentrePage } from "@/components/dashboard";

export const metadata: Metadata = {
  title: "Command Centre — NCPOR Antarctic Digital Twin",
  description: "Remote Operations and Station Telemetry Command Centre for Maitri and Bharati stations",
};

export default function DashboardPage() {
  return <CommandCentrePage />;
}