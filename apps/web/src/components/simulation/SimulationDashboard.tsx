"use client";

import React, { useState } from "react";
import { useStationStore } from "@/stores/useStationStore";
import { StationId, SimulationType, SimulationStatus } from "@repo/shared/enums";
import { SCENARIO_PRESETS } from "@/features/simulation/simulationEngine";
import { Simulation } from "@repo/shared/types";
import {
  ScenarioPreset,
  SimulationParametersConfig,
} from "@/features/simulation/types";
import { apiClient } from "@/lib/api";
import { ScenarioPresetSelector } from "./ScenarioPresetSelector";
import { SimulationParameterForm } from "./SimulationParameterForm";
import { SimulationResultsView } from "./SimulationResultsView";
import {
  Sliders,
  History,
} from "lucide-react";

export function SimulationDashboard() {
  const activeStation = useStationStore((s) => s.activeStation);
  const setActiveStation = useStationStore((s) => s.setActiveStation);

  // Selected preset
  const [selectedPreset, setSelectedPreset] = useState<ScenarioPreset>(
    SCENARIO_PRESETS[0]
  );

  // Form input state
  const [scenarioName, setScenarioName] = useState<string>(
    SCENARIO_PRESETS[0].title
  );
  const [scenarioDesc, setScenarioDesc] = useState<string>(
    SCENARIO_PRESETS[0].description
  );
  const [parameters, setParameters] = useState<SimulationParametersConfig>(
    SCENARIO_PRESETS[0].defaultParams
  );

  // Run status
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Active & historical simulation runs
  const [latestSimulation, setLatestSimulation] = useState<Simulation | null>(null);
  const [historyRuns, setHistoryRuns] = useState<Simulation[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Fetch history when station changes
  React.useEffect(() => {
    let mounted = true;
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const res = await apiClient.simulation.list({ stationId: activeStation, limit: 10 });
        if (mounted && res.success && res.data) {
          // Type assertion since res.data is generic unknown in the client type
          const runs = res.data as Simulation[];
          setHistoryRuns(runs);
          if (runs.length > 0) {
            setLatestSimulation(runs[0]);
          } else {
            setLatestSimulation(null);
          }
        }
      } catch (err) {
        console.error("Failed to load simulation history:", err);
      } finally {
        if (mounted) setIsLoadingHistory(false);
      }
    };
    fetchHistory();
    return () => { mounted = false; };
  }, [activeStation]);

  // Handle station selection with immediate recalculation
  const handleStationChange = (station: StationId) => {
    setActiveStation(station);
    // History is refetched automatically via useEffect
  };

  // Handle preset selection
  const handleSelectPreset = (preset: ScenarioPreset) => {
    setSelectedPreset(preset);
    setScenarioName(preset.title);
    setScenarioDesc(preset.description);
    setParameters(preset.defaultParams);
  };

  // Reset to current preset defaults
  const handleReset = () => {
    setParameters(selectedPreset.defaultParams);
  };

  // Run Simulation handler
  const handleRunSimulation = async () => {
    setIsRunning(true);
    try {
      // 1. Create Simulation
      const createRes = await apiClient.simulation.create({
        stationId: activeStation,
        name: scenarioName,
        type: selectedPreset.type,
        description: scenarioDesc,
        parameters,
      });

      if (!createRes.success || !createRes.data) {
        throw new Error("Failed to create simulation");
      }

      const simId = (createRes.data as Simulation).id;

      // 2. Run Simulation
      const runRes = await apiClient.simulation.run(simId);
      
      if (runRes.success && runRes.data) {
        const completedSim = runRes.data as Simulation;
        setLatestSimulation(completedSim);
        setHistoryRuns((prev) => [completedSim, ...prev].slice(0, 10));
      }
    } catch (err) {
      console.error("Simulation run failed:", err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-5 h-full min-h-0 select-none font-mono pb-12">
      {/* ── Page Top Header Bar ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-[#080d16]/95 border border-white/[0.08] backdrop-blur-md shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-wider text-slate-100 uppercase">
                What-If Scenario Builder & Physical Stress Simulator
              </h1>
              <p className="text-[10.5px] text-slate-400">
                Antarctic Station Contingency Modeling & Failure Cascades
              </p>
            </div>
          </div>
        </div>

        {/* Station Switcher: MAITRI / BHARATI */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase hidden sm:inline">
            Active Station:
          </span>
          <div
            className="flex items-center p-1 rounded-xl bg-[#040810] border border-white/[0.08]"
            role="tablist"
            aria-label="Simulation Station Selector"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeStation === StationId.MAITRI}
              onClick={() => handleStationChange(StationId.MAITRI)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeStation === StationId.MAITRI
                  ? "bg-cyan-950 text-cyan-200 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  activeStation === StationId.MAITRI
                    ? "bg-cyan-400"
                    : "bg-slate-600"
                }`}
              />
              <span>MAITRI (70°S)</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeStation === StationId.BHARATI}
              onClick={() => handleStationChange(StationId.BHARATI)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeStation === StationId.BHARATI
                  ? "bg-cyan-950 text-cyan-200 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  activeStation === StationId.BHARATI
                    ? "bg-cyan-400"
                    : "bg-slate-600"
                }`}
              />
              <span>BHARATI (69°S)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 1. Scenario Preset Selector (6 Types) ──────────────────── */}
      <ScenarioPresetSelector
        presets={SCENARIO_PRESETS}
        selectedType={selectedPreset.type}
        onSelectPreset={handleSelectPreset}
      />

      {/* ── 2. Parameter Tuning Form ───────────────────────────────── */}
      <SimulationParameterForm
        scenarioName={scenarioName}
        setScenarioName={setScenarioName}
        scenarioDesc={scenarioDesc}
        setScenarioDesc={setScenarioDesc}
        parameters={parameters}
        onChangeParams={setParameters}
        onResetParams={handleReset}
        onRunSimulation={handleRunSimulation}
        isRunning={isRunning}
      />

      {/* ── 3. Simulation Results & Cascades ───────────────────────── */}
      {latestSimulation && (
        <SimulationResultsView simulation={latestSimulation} />
      )}

      {/* ── 4. Previous Simulation History Runs ─────────────────────── */}
      {isLoadingHistory ? (
        <div className="p-4 text-center text-slate-500 text-xs font-mono animate-pulse border border-white/[0.05] rounded-2xl">
          Loading simulation history from database...
        </div>
      ) : historyRuns.length === 0 && !isRunning ? (
        <div className="p-5 text-center border border-dashed border-white/[0.08] rounded-2xl">
          <p className="text-slate-500 text-xs font-mono">No simulations run yet for this station.</p>
          <p className="text-slate-600 text-[10px] mt-1">Configure parameters above and click RUN.</p>
        </div>
      ) : historyRuns.length > 0 && (
        <section
          aria-label="Simulation Run History"
          className="p-4 rounded-2xl border border-white/[0.08] bg-[#080d16]/90 backdrop-blur-md flex flex-col gap-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Recent What-If Simulation Runs
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">
              {historyRuns.length} Scenarios Logged
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {historyRuns.map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-white/[0.04] hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-cyan-400 font-bold">[{run.type}]</span>
                    <span className="text-slate-200 font-bold">{run.name}</span>
                  </div>
                  <span className={`text-[9.5px] px-2 py-0.5 rounded border font-bold ${
                    run.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40' :
                    run.status === 'FAILED' ? 'bg-rose-950 text-rose-400 border-rose-500/40' :
                    'bg-slate-900 text-slate-400 border-slate-800'
                  }`}>
                    {run.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[10.5px]">
                  <div>
                    <span className="text-slate-400 text-[9.5px]">Impact: </span>
                    <span
                      className={`font-bold ${
                        (run.results?.impactScore ?? 0) > 70
                          ? "text-rose-400"
                          : (run.results?.impactScore ?? 0) > 40
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {run.results?.impactScore ?? '—'}/100
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[9.5px]">Demand: </span>
                    <span className="font-bold text-amber-300">
                      {run.results?.deltas?.powerDemandKw?.projected ?? '—'} kW
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[9.5px]">Endurance: </span>
                    <span className="font-bold text-blue-300">
                      {run.results?.deltas?.daysToDepletion?.projected ?? '—'}d
                    </span>
                  </div>

                  {run.status === 'COMPLETED' && (
                    <button
                      type="button"
                      onClick={() => setLatestSimulation(run)}
                      className="px-2 py-1 rounded text-[9.5px] font-bold bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 transition-colors cursor-pointer"
                    >
                      INSPECT
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
