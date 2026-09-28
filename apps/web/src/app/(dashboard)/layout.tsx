import React from "react";
import type { Metadata } from "next";
import { ShellLayout } from "@/components/layout";

export const metadata: Metadata = {
  title: "NCPOR Antarctic Digital Twin — Command Centre",
  description: "Mission-control digital twin for Indian Antarctic research stations Maitri & Bharati",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ShellLayout>{children}</ShellLayout>;
}
