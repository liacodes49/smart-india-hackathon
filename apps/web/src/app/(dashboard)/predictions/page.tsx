import React from "react";
import type { Metadata } from "next";
import { PredictionsDashboard } from "@/components/predictions";

export const metadata: Metadata = {
  title: "AI Predictions & Prognostics — NCPOR Antarctic Digital Twin",
  description: "AI-driven Remaining Useful Life (RUL) estimation, degradation forecasting, and fuel autonomy projection",
};

export default function PredictionsPage() {
  return <PredictionsDashboard />;
}
