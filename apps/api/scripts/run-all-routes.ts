// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Comprehensive API & What-If Route Runner
// ═══════════════════════════════════════════════════════════════

import { signJwt } from '../src/lib/crypto.js';

const BASE_URL = 'http://localhost:4000/api/v1';

// Generate an authentic administrative JWT token
const adminToken = signJwt({
  id: '00000000-0000-0000-0000-000000000001',
  email: 'director@ncpor.res.in',
  name: 'NCPOR Operations Command',
  role: 'SUPER_ADMIN',
  stationId: '5e7754bd-7a08-4556-8f6d-6ab275ae475b',
});

const MAITRI_ID = '5e7754bd-7a08-4556-8f6d-6ab275ae475b';
const BHARATI_ID = '46d87ff0-d9c1-4674-8d4e-89e77f745bba';

interface TestRoute {
  category: string;
  name: string;
  method: 'GET' | 'POST';
  path: string;
  body?: any;
}

const routesToTest: TestRoute[] = [
  // ── 1. Core Health & Surface ─────────────────────────────
  { category: 'Health & System', name: 'API Health Check', method: 'GET', path: '/health' },
  { category: 'Health & System', name: 'API Surface Index', method: 'GET', path: '/' },

  // ── 2. Station Hierarchies ────────────────────────────────
  { category: 'Stations', name: 'List All Stations', method: 'GET', path: '/stations' },
  { category: 'Stations', name: 'Maitri Details', method: 'GET', path: `/stations/${MAITRI_ID}` },
  { category: 'Stations', name: 'Maitri Physical Hierarchy', method: 'GET', path: `/stations/${MAITRI_ID}/hierarchy` },
  { category: 'Stations', name: 'Maitri Overview HUD', method: 'GET', path: `/stations/${MAITRI_ID}/overview` },

  // ── 3. 3D Spatial Digital Twin ───────────────────────────
  { category: '3D Digital Twin', name: 'Maitri 3D Spatial Tree', method: 'GET', path: '/digital-twin/stations/MAITRI' },
  { category: '3D Digital Twin', name: 'Bharati 3D Spatial Tree', method: 'GET', path: '/digital-twin/stations/BHARATI' },

  // ── 4. Weather Intelligence ──────────────────────────────
  { category: 'Weather', name: 'Current Polar Weather', method: 'GET', path: `/weather/stations/${MAITRI_ID}/current` },
  { category: 'Weather', name: 'Blizzard Forecast', method: 'GET', path: `/weather/stations/${MAITRI_ID}/forecast` },

  // ── 5. Microgrid Energy Monitoring ───────────────────────
  { category: 'Energy', name: 'Station Energy Summary', method: 'GET', path: `/energy/stations/${MAITRI_ID}/summary` },
  { category: 'Energy', name: 'Energy Trends & Burn Rate', method: 'GET', path: `/energy/stations/${MAITRI_ID}/trends` },

  // ── 6. Inventory & Supplies ───────────────────────────────
  { category: 'Logistics', name: 'Consumables & POL Inventory', method: 'GET', path: '/inventory' },

  // ── 7. Predictive Health & Autonomy ───────────────────────
  { category: 'Predictive', name: 'Fuel Depletion Horizon Forecast', method: 'GET', path: `/predictions/stations/${MAITRI_ID}/fuel` },

  // ── 8. 4-Pillar Composite Risk ───────────────────────────
  { category: 'Risk Assessment', name: 'Fleet Risk Overview', method: 'GET', path: '/risk/overview' },
  { category: 'Risk Assessment', name: 'Maitri 4-Pillar Normalized Risk', method: 'GET', path: `/risk/stations/${MAITRI_ID}` },

  // ── 9. Operational Incidents & Alerts ─────────────────────
  { category: 'Incidents & Alerts', name: 'Active Alert Stream', method: 'GET', path: '/alerts' },
  { category: 'Incidents & Alerts', name: 'Escalated Operational Incidents', method: 'GET', path: '/incidents' },

  // ── 10. Historical Analytics & Reliability ────────────────
  { category: 'Analytics', name: 'NCPOR Station Reliability (MTBF/MTTR)', method: 'GET', path: `/analytics/reliability/${MAITRI_ID}` },
  { category: 'Analytics', name: 'Station Energy Trend Analytics', method: 'GET', path: `/analytics/energy/${MAITRI_ID}?startTime=2026-09-01T00:00:00.000Z&endTime=2026-09-29T23:59:59.999Z` },
  { category: 'Analytics', name: 'Station Fuel Burn Trend Analytics', method: 'GET', path: `/analytics/fuel/${MAITRI_ID}?startTime=2026-09-01T00:00:00.000Z&endTime=2026-09-29T23:59:59.999Z` },

  // ── 11. Edge Synchronization ──────────────────────────────
  { category: 'Edge Sync', name: 'Edge Satcom Status', method: 'GET', path: `/edge/connectivity/${MAITRI_ID}` },
  {
    category: 'Edge Sync',
    name: 'Toggle Edge Satcom to DEGRADED',
    method: 'POST',
    path: `/edge/connectivity/${MAITRI_ID}`,
    body: { state: 'DEGRADED', reason: 'Antarctic polar solar storm attenuation' },
  },
  {
    category: 'Edge Sync',
    name: 'Restore Edge Satcom to ONLINE',
    method: 'POST',
    path: `/edge/connectivity/${MAITRI_ID}`,
    body: { state: 'ONLINE', reason: 'High-bandwidth Inmarsat link restored' },
  },

  // ── 12. What-If Simulation Engine (ALL 6 Scenarios!) ──────
  { category: 'What-If Simulation', name: 'List Historical Simulation Runs', method: 'GET', path: '/simulations' },
  {
    category: 'What-If Simulation',
    name: 'Scenario 1: EQUIPMENT_FAILURE (Generator 2 Overheating)',
    method: 'POST',
    path: '/simulations/quick-run',
    body: {
      stationId: MAITRI_ID,
      type: 'EQUIPMENT_FAILURE',
      parameters: {
        failedAssetId: 'gen-02',
        failureHorizonHours: 3.5,
        loadShiftToBackupKw: 45,
      },
    },
  },
  {
    category: 'What-If Simulation',
    name: 'Scenario 2: WEATHER_EXTREME (Severe Katabatic -50°C Gale)',
    method: 'POST',
    path: '/simulations/quick-run',
    body: {
      stationId: MAITRI_ID,
      type: 'WEATHER_EXTREME',
      parameters: {
        ambientTempC: -52,
        windSpeedKmh: 135,
        traceHeatingSurgeKw: 65,
      },
    },
  },
  {
    category: 'What-If Simulation',
    name: 'Scenario 3: POWER_FAILURE (Busbar Trip & Blackout Risk)',
    method: 'POST',
    path: '/simulations/quick-run',
    body: {
      stationId: MAITRI_ID,
      type: 'POWER_FAILURE',
      parameters: {
        trippedBus: 'BUS-415V-SEC',
        loadSheddingStage: 1,
        lifeSupportProtected: true,
      },
    },
  },
  {
    category: 'What-If Simulation',
    name: 'Scenario 4: SUPPLY_SHORTAGE (POL Tanker Delayed by Ice)',
    method: 'POST',
    path: '/simulations/quick-run',
    body: {
      stationId: MAITRI_ID,
      type: 'SUPPLY_SHORTAGE',
      parameters: {
        resupplyDelayDays: 45,
        dailyRationingPercent: 20,
      },
    },
  },
  {
    category: 'What-If Simulation',
    name: 'Scenario 5: EVACUATION (Pre-Winter Evacuation Contingency)',
    method: 'POST',
    path: '/simulations/quick-run',
    body: {
      stationId: MAITRI_ID,
      type: 'EVACUATION',
      parameters: {
        crewRemaining: 8,
        mothballWingB: true,
      },
    },
  },
  {
    category: 'What-If Simulation',
    name: 'Scenario 6: CUSTOM (Compound Multi-Stress Failure Chain)',
    method: 'POST',
    path: '/simulations/quick-run',
    body: {
      stationId: MAITRI_ID,
      type: 'CUSTOM',
      parameters: {
        temperatureDeltaC: -20,
        fuelConsumptionMultiplier: 1.35,
        generatorFailure: 'gen-02',
      },
    },
  },

  // ── 13. AI Decision Support Assistant ─────────────────────
  {
    category: 'AI Assistant',
    name: 'Ask Decision Support Query',
    method: 'POST',
    path: '/assistant/query',
    body: {
      message: 'What is the highest risk factor at Maitri station, and what immediate actions should we take?',
      stationId: MAITRI_ID,
    },
  },
];

async function runAll() {
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('🧊 ANTARCTIC DIGITAL TWIN — FULL SYSTEM ROUTE & WHAT-IF VERIFICATION RUNNER');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  for (const [idx, route] of routesToTest.entries()) {
    const url = `${BASE_URL}${route.path}`;
    const start = performance.now();

    const headers: Record<string, string> = {
      Authorization: `Bearer ${adminToken}`,
    };
    if (route.body) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const res = await fetch(url, {
        method: route.method,
        headers,
        body: route.body ? JSON.stringify(route.body) : undefined,
      });

      const elapsed = Math.round(performance.now() - start);
      const json = await res.json().catch(() => null);

      if (res.ok && json?.success !== false) {
        passed++;
        console.log(
          `✅ [${String(idx + 1).padStart(2, '0')}/${routesToTest.length}] ${route.category.padEnd(18)} | ${route.method.padEnd(4)} ${route.name.padEnd(45)} | HTTP ${res.status} | ${elapsed}ms`
        );

        // Highlight snippet for simulations and AI assistant
        if (route.category === 'What-If Simulation' && json?.data?.impactScore !== undefined) {
          const r = json.data;
          console.log(`   ├─ Impact Score: ${r.impactScore}/100 | Affected: ${r.affectedSystems?.join(', ')}`);
          console.log(`   ├─ Operational Deltas: Power=${r.deltas?.powerDemandKw?.formattedDelta ?? r.deltas?.powerDemandKw?.delta} | Fuel Burn=${r.deltas?.fuelBurnRateLph?.formattedDelta ?? r.deltas?.fuelBurnRateLph?.delta} | Risk Score=${r.deltas?.compositeRiskScore?.formattedDelta ?? r.deltas?.compositeRiskScore?.delta}`);
          if (r.mitigations && r.mitigations.length > 0) {
            console.log(`   └─ Primary Mitigation [${r.mitigations[0].priority}]: ${r.mitigations[0].action} (${r.mitigations[0].expectedBenefit})`);
          }
        } else if (route.category === 'AI Assistant' && json?.data?.answer) {
          console.log(`   └─ AI Operational Advice: "${json.data.answer.substring(0, 110)}..."`);
        }
      } else {
        failed++;
        console.log(
          `❌ [${String(idx + 1).padStart(2, '0')}/${routesToTest.length}] ${route.category.padEnd(18)} | ${route.method.padEnd(4)} ${route.name.padEnd(45)} | HTTP ${res.status} | ${elapsed}ms`
        );
        if (json?.error) {
          console.log(`   └─ Error: ${json.error.message || json.error.code}`);
        }
      }
    } catch (err: any) {
      failed++;
      const elapsed = Math.round(performance.now() - start);
      console.log(
        `💥 [${String(idx + 1).padStart(2, '0')}/${routesToTest.length}] ${route.category.padEnd(18)} | ${route.method.padEnd(4)} ${route.name.padEnd(45)} | FAILED (${err.message}) | ${elapsed}ms`
      );
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  console.log(`🏁 EXECUTION SUMMARY: ${passed} PASSED | ${failed} FAILED | ${routesToTest.length} TOTAL ROUTES`);
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');
}

runAll().catch(console.error);
