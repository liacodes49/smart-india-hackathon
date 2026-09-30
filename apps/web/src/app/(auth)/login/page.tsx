"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthStore, PRESET_ACCOUNTS, TerminalRole } from "@/stores/useAuthStore";
import { useStationStore } from "@/stores/useStationStore";
import { StationId } from "@repo/shared/enums";
import {
  ShieldCheck,
  Radio,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  Compass,
  Zap,
  Globe2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const loginAs = useAuthStore((s) => s.loginAs);
  const setUserSession = useAuthStore((s) => s.setUserSession);
  const setActiveStation = useStationStore((s) => s.setActiveStation);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLaunchTerminal = (terminal: TerminalRole) => {
    loginAs(terminal);
    if (terminal === "MAITRI") {
      setActiveStation(StationId.MAITRI);
      router.push("/station/maitri");
    } else if (terminal === "BHARATI") {
      setActiveStation(StationId.BHARATI);
      router.push("/station/bharati");
    } else {
      router.push("/dashboard");
    }
  };

  const handleSupabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setErrorMsg(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Fallback for demo if offline or simulated account
        if (email.includes("maitri")) {
          handleLaunchTerminal("MAITRI");
          return;
        } else if (email.includes("bharati")) {
          handleLaunchTerminal("BHARATI");
          return;
        } else if (email.includes("admin")) {
          handleLaunchTerminal("HQ");
          return;
        }
        throw error;
      }

      if (data?.user) {
        const uEmail = data.user.email || "";
        let terminal: TerminalRole = "HQ";
        if (uEmail.includes("maitri")) terminal = "MAITRI";
        else if (uEmail.includes("bharati")) terminal = "BHARATI";

        setUserSession({
          id: data.user.id,
          email: uEmail,
          name: data.user.user_metadata?.full_name || uEmail.split("@")[0],
          role: data.user.user_metadata?.role || "OPERATOR",
          terminal,
          stationId: terminal !== "HQ" ? terminal : null,
        }, data.session?.access_token);

        if (terminal === "MAITRI") {
          setActiveStation(StationId.MAITRI);
          router.push("/station/maitri");
        } else if (terminal === "BHARATI") {
          setActiveStation(StationId.BHARATI);
          router.push("/station/bharati");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#03060c] text-slate-100 flex flex-col justify-between font-mono relative overflow-hidden select-none">
      {/* Background Polar Atmosphere Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(6,182,212,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Banner */}
      <header className="p-6 border-b border-white/[0.06] backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold tracking-wider text-slate-100 uppercase">
              National Centre for Polar and Ocean Research (NCPOR)
            </h1>
            <p className="text-[11px] text-cyan-400/90 font-semibold tracking-wide">
              Ministry of Earth Sciences, Govt. of India • Antarctic Digital Twin
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/[0.08] text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>SUPABASE ENCRYPTED ACCESS</span>
        </div>
      </header>

      {/* Main Content: 3-Terminal Selector + Supabase Credentials */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 z-10 max-w-6xl mx-auto w-full my-6">
        <div className="text-center mb-8 max-w-2xl">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40 uppercase tracking-widest inline-block mb-3">
            Multi-Terminal Deployment Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Select Station Console or Command HQ
          </h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            For multi-laptop operations: Assign Laptop 1 to Maitri, Laptop 2 to Bharati, and Laptop 3 to India Headquarters.
          </p>
        </div>

        {/* 3 Workstation Launchers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full mb-10">
          {/* Card 1: Maitri Station */}
          <div className="p-6 rounded-2xl bg-[#080d16]/90 border border-cyan-500/30 hover:border-cyan-400/80 transition-all backdrop-blur-md shadow-xl flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-cyan-950 text-cyan-300 border border-cyan-500/40 uppercase">
                  Laptop 1 • Antarctica
                </span>
                <Compass className="w-5 h-5 text-cyan-400 group-hover:rotate-45 transition-transform" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Maitri Station Console</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Schirmacher Oasis (70°46′S, 11°44′E)
              </p>
              <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>3D Maitri Living Complex & Gensets</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Edge SCADA Sensor Injection Deck</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Telemetry Satellite Uplink to HQ</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleLaunchTerminal("MAITRI")}
              className="mt-6 w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer transition-all active:scale-[0.98]"
            >
              <span>Launch Maitri Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Bharati Station */}
          <div className="p-6 rounded-2xl bg-[#080d16]/90 border border-blue-500/30 hover:border-blue-400/80 transition-all backdrop-blur-md shadow-xl flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-blue-950 text-blue-300 border border-blue-500/40 uppercase">
                  Laptop 2 • Antarctica
                </span>
                <Building2 className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Bharati Station Console</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Larsemann Hills (69°24′S, 76°11′E)
              </p>
              <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>3D Aerodynamic Habitat & CHP Microgrid</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Interactive Edge Telemetry Ingestion</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Direct Satellite Feed to HQ Command</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleLaunchTerminal("BHARATI")}
              className="mt-6 w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.4)] cursor-pointer transition-all active:scale-[0.98]"
            >
              <span>Launch Bharati Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 3: India HQ Command */}
          <div className="p-6 rounded-2xl bg-[#080d16]/90 border border-emerald-500/30 hover:border-emerald-400/80 transition-all backdrop-blur-md shadow-xl flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-500/40 uppercase">
                  Laptop 3 • Goa, India
                </span>
                <Globe2 className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">NCPOR India HQ Command</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Headquarters Mission Operations (Goa)
              </p>
              <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Dual-Station 3D Globe & Twin Models</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>AI Failure Forecasting & Prognostics (RUL)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Disaster Simulation & Remote Dispatch</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleLaunchTerminal("HQ")}
              className="mt-6 w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer transition-all active:scale-[0.98]"
            >
              <span>Launch HQ Digital Twin</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Supabase Authentication Accordion / Form */}
        <div className="w-full max-w-md p-6 rounded-2xl bg-[#080d16]/95 border border-white/[0.08] backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
            <Lock className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Supabase Mission Authentication
            </h4>
          </div>

          {errorMsg && (
            <div className="p-3 mb-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSupabaseSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] text-slate-400 uppercase font-bold mb-1.5">
                Official Government Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="e.g. commander.maitri@antarctic.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#040810] border border-white/[0.1] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 uppercase font-bold mb-1.5">
                Passcode / Access Token
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#040810] border border-white/[0.1] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-200 font-bold uppercase tracking-wider text-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? "Authenticating via Supabase..." : "Sign In & Authorize"}</span>
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-white/[0.06] text-center text-[10px] text-slate-500 z-10">
        NCPOR Polar Telematics Network • Supabase Auth & Session Pooler Active • UTC {new Date().toISOString().slice(11, 16)}
      </footer>
    </div>
  );
}
