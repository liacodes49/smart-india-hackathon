import React from "react";
import type { Metadata } from "next";
import { SimulationDashboard } from "@/components/simulation";

export const metadata: Metadata = {
  title: "What-If Simulation — NCPOR Antarctic Digital Twin",
  description:
    "Scenario builder and contingency physical stress simulator for Maitri & Bharati research stations",
};

export default function SimulationPage() {
  return <SimulationDashboard />;
}
