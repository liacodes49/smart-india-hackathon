import { useState, useEffect } from "react";
import { type TelemetryAsset, INITIAL_TELEMETRY } from "@/features/digital-twin/utils/StationTelemetry";
import { apiClient } from "@/lib/api";
import { useStationStore } from "@/stores/useStationStore";

export function useLiveTelemetry(stationId: string) {
  const [telemetry, setTelemetry] = useState<TelemetryAsset[]>(INITIAL_TELEMETRY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [environment, setEnvironment] = useState<any>(null);
  const [edgeStatus, setEdgeStatus] = useState<string>("ONLINE");
  const [stationHealthScore, setStationHealthScore] = useState<number>(85);
  const [riskLevel, setRiskLevel] = useState<string>("LOW");
  const [riskAssessment, setRiskAssessment] = useState<any>(null);
  const [rawAssets, setRawAssets] = useState<any[]>([]);
  const [stationStatus, setStationStatus] = useState<string>("OPERATIONAL");

  useEffect(() => {
    let mounted = true;
    let isFetching = false;
    
    async function fetchTelemetry() {
      if (isFetching) return;
      isFetching = true;
      try {
        // Fetch twin state and active alerts concurrently for cross-system sync
        const [response, alertsRes] = await Promise.all([
          apiClient.digitalTwin.getStationTwin(stationId),
          apiClient.alerts.list({ stationId, status: 'ACTIVE' as any, limit: 100 }).catch(() => null),
        ]);
        
        if (!response.success || !response.data) {
          throw new Error(response.message || "Failed to fetch station twin state");
        }
        
        const state = response.data;

        // Synchronize active and critical alert counts in global store
        if (alertsRes && (alertsRes as any).data) {
          const activeList: any[] = (alertsRes as any).data || [];
          const criticalCount = activeList.filter((a) => a.severity === 'CRITICAL').length;
          useStationStore.getState().setAlertCounts(activeList.length, criticalCount);
        }
        
        // Recursive extraction to collect all real assets regardless of hierarchy depth
        const allAssets: any[] = [];
        const extractAssets = (nodes: any[]) => {
          for (const node of nodes) {
            if (node.type === 'ASSET') {
              allAssets.push(node);
            }
            if (node.children && Array.isArray(node.children)) {
              extractAssets(node.children);
            }
          }
        };
        if (state.rootNodes && Array.isArray(state.rootNodes)) {
          extractAssets(state.rootNodes);
        }
        
        // Map backend assets to the frontend TelemetryAsset model for 3D marker coloring
        const updatedTelemetry = INITIAL_TELEMETRY.map(mockAsset => {
          let backendCategory = "";
          switch (mockAsset.type) {
            case "GENERATOR": backendCategory = "GENERATOR"; break;
            case "PUMP_HOUSE": backendCategory = "WATER_TREATMENT"; break;
            case "ANTENNA": backendCategory = "COMMUNICATION"; break;
            case "MAIN_BUILDING": backendCategory = "STRUCTURAL"; break;
            case "FUEL_FARM": backendCategory = "STORAGE"; break;
            case "CONTAINER": backendCategory = "STORAGE"; break;
          }
          
          const backendAsset = allAssets.find(a => 
            a.id === mockAsset.id ||
            a.name.toUpperCase().includes(mockAsset.type) || 
            (backendCategory && a.name.toUpperCase().includes(backendCategory)) ||
            (backendCategory === 'GENERATOR' && a.name.includes("Generator")) ||
            (backendCategory === 'WATER_TREATMENT' && a.name.includes("Pump")) ||
            (backendCategory === 'COMMUNICATION' && (a.name.includes("Antenna") || a.name.includes("Radome")))
          );

          if (!backendAsset) {
            return {
              ...mockAsset,
              lastUpdated: Date.now(),
            };
          }
          
          let temperature = mockAsset.temperature;
          let power = mockAsset.power;
          let fuel = mockAsset.fuel;
          let water = mockAsset.water;
          
          if (backendAsset.children) {
            backendAsset.children.forEach((sensor: any) => {
              const summary = sensor.telemetrySummary;
              if (summary) {
                if (summary.TEMPERATURE) temperature = summary.TEMPERATURE.value;
                if (summary.POWER) power = summary.POWER.value;
                if (summary.FUEL) fuel = summary.FUEL.value;
                if (summary.WATER) water = summary.WATER.value;
              }
            });
          }

          let health = mockAsset.health;
          if (backendAsset.healthColor === "RED") health = "CRITICAL";
          else if (backendAsset.healthColor === "YELLOW") health = "WARNING";
          else if (backendAsset.healthColor === "GREEN") health = "NORMAL";
          
          return {
            ...mockAsset,
            id: backendAsset.id, // Align real asset ID for target lock
            temperature,
            power,
            fuel,
            water,
            health,
            lastUpdated: Date.now(),
          };
        });
        
        if (mounted) {
          setTelemetry(updatedTelemetry);
          setEnvironment(state.environmentalSkybox || null);
          setEdgeStatus(state.edgeStatus || "ONLINE");
          setStationHealthScore(state.stationHealthScore ?? 85);
          setRiskLevel(state.riskLevel || "LOW");
          setRiskAssessment((state as any).riskAssessment || null);
          setRawAssets(allAssets);
          setStationStatus(state.status || "OPERATIONAL");
          setError(null);
        }
      } catch (err: any) {
        console.warn("LiveTelemetry Hook warning:", err?.message || err?.code || String(err));
        if (mounted) setError(err instanceof Error ? err : new Error(err?.message || 'Failed to fetch telemetry'));
      } finally {
        isFetching = false;
        if (mounted) setLoading(false);
      }
    }
    
    // Clear data to prevent state bleed when switching stations
    setTelemetry(INITIAL_TELEMETRY);
    setEnvironment(null);
    setEdgeStatus("ONLINE");
    
    // Initial fetch
    fetchTelemetry();
    
    // Setup SSE for real-time updates instead of polling
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    let eventSource: EventSource | null = null;
    
    try {
      // Create EventSource.
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      const sseUrl = `${baseUrl}/telemetry/stream${token ? `?token=${token}` : ''}`;
      eventSource = new EventSource(sseUrl);
      
      eventSource.onopen = () => {
        useStationStore.getState().setLiveConnected(true);
      };

      const handleStreamEvent = () => {
        useStationStore.getState().recordTelemetryTick();
        if (!isFetching && mounted) {
          fetchTelemetry();
        }
      };

      eventSource.addEventListener('ping', () => {
        useStationStore.getState().recordTelemetryTick();
      });

      // Telemetry events
      eventSource.addEventListener('TELEMETRY_BATCH_RECORDED', handleStreamEvent);
      eventSource.addEventListener('TELEMETRY_READING_RECORDED', handleStreamEvent);

      // Alert lifecycle events
      eventSource.addEventListener('ALERT_TRIGGERED', handleStreamEvent);
      eventSource.addEventListener('ALERT_ACKNOWLEDGED', handleStreamEvent);
      eventSource.addEventListener('ALERT_RESOLVED', handleStreamEvent);
      eventSource.addEventListener('ALERT_ESCALATED', handleStreamEvent);

      // Maintenance & Asset Health events
      eventSource.addEventListener('MAINTENANCE_RECOMMENDED', handleStreamEvent);
      eventSource.addEventListener('MAINTENANCE_SCHEDULED', handleStreamEvent);
      eventSource.addEventListener('MAINTENANCE_COMPLETED', handleStreamEvent);
      eventSource.addEventListener('EQUIPMENT_HEALTH_DEGRADED', handleStreamEvent);
      eventSource.addEventListener('RISK_SCORE_UPDATED', handleStreamEvent);

      eventSource.onerror = () => {
        useStationStore.getState().setLiveConnected(false);
        console.warn('SSE connection error, falling back to polling');
        eventSource?.close();
        // Fallback to polling if SSE fails
        setInterval(fetchTelemetry, 6000);
      };
    } catch (err) {
      useStationStore.getState().setLiveConnected(false);
      console.warn('Failed to setup SSE, falling back to polling', err);
      setInterval(fetchTelemetry, 6000);
    }
    
    return () => {
      mounted = false;
      useStationStore.getState().setLiveConnected(false);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [stationId]);

  return {
    telemetry,
    environment,
    edgeStatus,
    stationHealthScore,
    riskLevel,
    riskAssessment,
    rawAssets,
    stationStatus,
    loading,
    error,
  };
}
