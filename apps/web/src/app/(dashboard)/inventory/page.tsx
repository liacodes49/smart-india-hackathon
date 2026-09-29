import React from "react";
import type { Metadata } from "next";
import { InventoryManagement } from "@/components/inventory";

export const metadata: Metadata = {
  title: "Logistics & Inventory — NCPOR Antarctic Command Centre",
  description: "Antarctic station logistics, polar POL reserve telemetry, and inventory readiness",
};

export default function InventoryPage() {
  return <InventoryManagement />;
}
