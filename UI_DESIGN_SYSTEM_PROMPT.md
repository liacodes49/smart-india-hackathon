# 🧊 NCPOR Antarctic Digital Twin — AI Agent Design System & UI Styling Directives

> **MANDATORY SYSTEM DIRECTIVE FOR ALL ASSISTANT AI AGENTS AND DEVELOPERS**  
> **READ AND ENFORCE THIS ENTIRE DOCUMENT BEFORE MAKING ANY CODE OR UI CHANGES.**  
> 
> **PRIMARY GOAL:** Your sole objective is to elevate the **visual aesthetics, cosmetic polish, glassmorphism, visual hierarchy, micro-animations, and visual wow-factor** of the web interface. You must **NEVER** alter, break, mock, strip out, or disrupt the underlying business logic, API integration, 3D WebGL scenes, SSE event streams, Zustand state stores, or Supabase authentication gateway.

---

## 📜 Table of Contents

1. [Core Principles & System Mandates](#1-core-principles--system-mandates)
2. [The Strict "DOs and DON'Ts" Ruleset](#2-the-strict-dos-and-donts-ruleset)
3. [Design System Tokens & Visual Language](#3-design-system-tokens--visual-language)
4. [3D Digital Twin Preservation Directives](#4-3d-digital-twin-preservation-directives)
5. [3-Workstation Terminal Architecture Overview](#5-3-workstation-terminal-architecture-overview)
6. [Component-by-Component Cosmetic Styling Specifications](#6-component-by-component-cosmetic-styling-specifications)
   - 6.1 [Supabase Login Gateway (`/login`)](#61-supabase-login-gateway-login)
   - 6.2 [Station Edge Consoles (`/station/maitri` & `/station/bharati`)](#62-station-edge-consoles-stationmaitri--stationbharati)
   - 6.3 [India HQ Command Twin (`/dashboard` & `/digital-twin`)](#63-india-hq-command-twin-dashboard--digital-twin)
   - 6.4 [Telemetry Control Center (`/telemetry`)](#64-telemetry-control-center-telemetry)
   - 6.5 [Alerts & Mission Directives Manager (`/alerts`)](#65-alerts--mission-directives-manager-alerts)
   - 6.6 [Predictive AI & Health Prognosis (`/predictions`)](#66-predictive-ai--health-prognosis-predictions)
   - 6.7 [Blizzard & Crisis Simulation Engine (`/simulation`)](#67-blizzard--crisis-simulation-engine-simulation)
   - 6.8 [POL Fuel & Microgrid Energy Analytics (`/analytics`)](#68-pol-fuel--microgrid-energy-analytics-analytics)
   - 6.9 [Top Navigation Bar & Mission Sidebar](#69-top-navigation-bar--mission-sidebar)
7. [Verification & Pre-Commit Protocol](#7-verification--pre-commit-protocol)

---

## 1. Core Principles & System Mandates

1. **COSMETIC ELEVATION ONLY:** Focus exclusively on Tailwind CSS styling, color palettes, glowing borders, font typography, layout alignment, gradients, glassmorphism (`backdrop-blur`), subtle hover scale effects, status badges, and visual feedback.
2. **ZERO LOGIC DESTRUCTION:** Do **NOT** remove, rewrite, swallow, or comment out:
   - `apiClient.*` calls to Express API endpoints.
   - `fetchAlerts()`, `handleTransmitReading()`, `handleTriggerAnomaly()`, `handleAcknowledge()`, or `handleResolve()` handlers.
   - EventSource / Server-Sent Events (SSE) subscriptions listening on `/api/v1/telemetry/stream`.
   - Zustand state store bindings (`useStationStore`, `useAuthStore`).
   - Supabase auth functions (`supabase.auth.signInWithPassword`, `useAuthStore.getState().signInWithPreset`).
3. **PRESERVE THE 3D DIGITAL TWIN:** The 3D Three.js canvas in `AntarcticaOverview.tsx`, `StationEnvironment.tsx`, `StationMarker.tsx`, and `StationLabel.tsx` is one of the **core showcase features** of this application. It MUST remain fully interactive, embedded, and operational.
4. **DARK POLAR MISSION CONTROL AESTHETIC:** Maintain the high-tech, ultra-sleek Antarctic mission-control look (`#03060c` ultra-dark background, deep cyan/teal ambient accents, glowing status indicators in amber, emerald, rose, and cyan).

---

## 2. The Strict "DOs and DON'Ts" Ruleset

### ✅ DOs (What You SHOULD Do)
- **Enhance Visual Polish:** Add rich subtle borders (`border border-white/[0.08]`), glassmorphic panels (`bg-[#070d18]/80 backdrop-blur-md`), and cyan/emerald glowing shadows (`shadow-[0_0_15px_rgba(6,182,212,0.15)]`).
- **Improve Layout & Alignment:** Ensure crisp spacing, flexbox/grid harmony, responsive padding (`p-4 sm:p-6`), and zero horizontal overflow.
- **Add Micro-Animations:** Use subtle CSS transitions (`transition-all duration-300 hover:scale-[1.01] hover:border-cyan-500/40`).
- **Refine Typography:** Use monospace fonts for sensor codes, timestamps, and coordinates (`font-mono text-cyan-400`), with clean sans-serif headers.
- **Elevate Badges & Buttons:** Make active buttons pop with glowing gradients, polished icon alignments, and interactive loading spin indicators.
- **Maintain Dark Mode Contrast:** Ensure high readability for data numbers, charts, table rows, and alert severity badges.

### 🚫 DON'Ts (What You MUST NEVER Do)
- ❌ **DO NOT** change input parameter names or remove state bindings in event handlers (`onClick`, `onChange`, `onSubmit`).
- ❌ **DO NOT** replace live API calls (`apiClient.sensors.list`, `apiClient.telemetry.ingest`) with static hardcoded dummy data arrays inside functional components.
- ❌ **DO NOT** delete HTML DOM containers or remove dynamic conditional renders that control data tables, charts, or modal dialogs.
- ❌ **DO NOT** replace `@react-three/drei` `<Billboard>` and `<Text>` components inside R3F 3D Canvas scenes with DOM `<Html>` elements that break React 18/19 rendering cycles.
- ❌ **DO NOT** modify backend route paths, API payload schemas in `@repo/schemas`, or TypeScript interfaces in `@repo/shared`.
- ❌ **DO NOT** remove `suppressHydrationWarning` flags placed on mission clocks or locale-formatted numbers (`toLocaleString("en-US")`).
- ❌ **DO NOT** simplify or strip out the 3-workstation architecture (Maitri Console, Bharati Console, Goa HQ Twin).

---

## 3. Design System Tokens & Visual Language

When styling any component, strictly adhere to these color codes and styling classes:

| Role / Element | Tailwind CSS Class / Color Token | Visual Purpose |
| :--- | :--- | :--- |
| **App Background** | `bg-[#03060c]` or `bg-[#050913]` | Ultra-deep polar space dark background |
| **Panel Surface** | `bg-[#070d19]/80 backdrop-blur-xl border border-white/[0.08]` | Glassmorphic card container |
| **Primary Accent** | `text-cyan-400`, `bg-cyan-500`, `border-cyan-500/40` | Telemetry, active status, SatCom uplink |
| **Normal / Safe** | `text-emerald-400`, `bg-emerald-500/20`, `border-emerald-500/40` | Equipment operating in nominal parameters |
| **Warning / Advisory**| `text-amber-400`, `bg-amber-500/20`, `border-amber-500/40` | Thermal drift, fuel reserve threshold warnings |
| **Critical / Emergency**| `text-rose-400`, `bg-rose-500/20`, `border-rose-500/40` | Coolant overheat, generator trip, blizzard |
| **Station maitri** | `cyan-400` theme (`#06b6d4`) | Maitri Antarctic Research Station |
| **Station bharati** | `blue-400` theme (`#60a5fa`) | Bharati Antarctic Research Station |
| **Monospace Data** | `font-mono text-xs tracking-wide` | Sensor codes, timestamps, coordinates, metrics |

---

## 4. 3D Digital Twin Preservation Directives

The 3D Digital Twin engine resides in `apps/web/src/components/digital-twin/`.

### ⚠️ Critical 3D Rendering Rules:
1. **Keep WebGL Labels Native:** Use `<Billboard>` and `<Text>` from `@react-three/drei` inside 3D canvas components (`StationMarker.tsx`, `StationLabel.tsx`). Do **NOT** introduce `<Html>` components inside canvas loops as they create separate React roots that cause `removeChild` and unmount race conditions during scene transitions.
2. **Preserve Canvas Props:**
   ```tsx
   <Canvas
     camera={{ position: [0, 45, 65], fov: 45 }}
     gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
   >
   ```
3. **Preserve Embedded Mode:** `AntarcticaOverview` supports `embedded={true}` and `initialStationId="MAITRI" | "BHARATI"`. This allows embedding the exact 3D station twin model inside station edge consoles (`/station/maitri`) while preserving full orbit controls.

---

## 5. 3-Workstation Terminal Architecture Overview

The system is configured for a 3-Laptop Live Demonstration:

```
                  ┌──────────────────────────────────────────────┐
                  │           SUPABASE LOGIN GATEWAY             │
                  │              (/login)                        │
                  └──────────────────────┬───────────────────────┘
                                         │
       ┌─────────────────────────────────┼─────────────────────────────────┐
       ▼                                 ▼                                 ▼
┌──────────────┐                  ┌──────────────┐                  ┌──────────────┐
│   LAPTOP 1   │                  │   LAPTOP 2   │                  │   LAPTOP 3   │
│ MAITRI EDGE  │                  │ BHARATI EDGE │                  │ INDIA HQ TWIN│
│ (/station/   │                  │ (/station/   │                  │ (/dashboard) │
│   maitri)    │                  │   bharati)   │                  │              │
└──────┬───────┘                  └──────┬───────┘                  └──────┬───────┘
       │                                 │                                 │
       └────────────────►  GOA HQ REALTIME SSE SERVER  ◄───────────────────┘
                            (http://localhost:4000)
```

1. **Laptop 1 (Maitri Station Console):** Dedicated 3D twin of Maitri, interactive edge telemetry sliders, one-touch anomaly injection, GSAT-7A satellite uplink logs, and HQ work order execution dock.
2. **Laptop 2 (Bharati Station Console):** Dedicated 3D twin of Bharati at Larsemann Hills, real-time sensor transmission controls, crisis triggers, and incoming HQ directives.
3. **Laptop 3 (India HQ Command Centre):** Dual-station 3D twin overview in Goa, multi-station telemetry aggregation, automated alert escalation, ML prognosis, and dispatch controls.

---

## 6. Component-by-Component Cosmetic Styling Specifications

### 6.1 Supabase Login Gateway (`/login`)
* **File:** `apps/web/src/app/(auth)/login/page.tsx`
* **Cosmetic Goals:** Make it look like an ultra-exclusive military/scientific satellite gateway terminal.
* **Requirements:**
  - Enhance the 3 Terminal Launch Cards (*Laptop 1: Maitri*, *Laptop 2: Bharati*, *Laptop 3: HQ Twin*) with vibrant gradient borders and subtle hover scale animations (`hover:border-cyan-400/60 transition-all duration-300`).
  - Preserve Supabase authentication inputs and `useAuthStore` preset click handlers.

### 6.2 Station Edge Consoles (`/station/maitri` & `/station/bharati`)
* **Files:** 
  - `apps/web/src/app/(dashboard)/station/maitri/page.tsx`
  - `apps/web/src/app/(dashboard)/station/bharati/page.tsx`
  - `apps/web/src/components/station/StationEdgeConsole.tsx`
* **Cosmetic Goals:** Create an authentic on-site SCADA console used by polar expedition commanders.
* **Requirements:**
  - Embed the full 3D station model with sleek overlay controls for Camera Presets (*Iso, Top, Habitat, Power, Fuel*).
  - Style the **TRANSMIT TO HQ** tab with glowing telemetry sliders, live metric indicators, and glowing crisis trigger buttons (*"Trip Genset 01 Overheat"*, *"Freeze Water Line"*).
  - Style the **RECEIVED FROM HQ** tab with directive cards, urgency badges, and an interactive **"Mark Completed"** button.
  - Do **NOT** modify `apiClient.telemetry.ingest` or `fetchHQDirectives` logic.

### 6.3 India HQ Command Twin (`/dashboard` & `/digital-twin`)
* **Files:**
  - `apps/web/src/components/dashboard/CommandCentrePage.tsx`
  - `apps/web/src/components/dashboard/DigitalTwinPanel.tsx`
  - `apps/web/src/components/digital-twin/AntarcticaOverview.tsx`
* **Cosmetic Goals:** Futuristic mission control HUD with real-time station metrics.
* **Requirements:**
  - Style KPI cards with glowing borders, trend arrows, and metric counts.
  - Keep 3D Orbit Controls smooth and ensure station beacon markers remain crisp and readable.

### 6.4 Telemetry Control Center (`/telemetry`)
* **File:** `apps/web/src/components/telemetry/TelemetryControlCenter.tsx`
* **Cosmetic Goals:** High-frequency live data stream wall.
* **Requirements:**
  - Enhance table rows with subtle hover background highlights (`hover:bg-cyan-950/20`).
  - Use `font-mono` for all numeric sensor values, timestamps, and quality percentages.

### 6.5 Alerts & Mission Directives Manager (`/alerts`)
* **File:** `apps/web/src/components/alerts/AlertsManager.tsx`
* **Cosmetic Goals:** Tactical crisis command interface.
* **Requirements:**
  - Style Alert Severity Badges (`CRITICAL`, `WARNING`, `INFO`, `RESOLVED`) with glowing pill styles.
  - Ensure the **Acknowledge Alert** and **Resolve Alert** buttons display loading spinners during API execution.

### 6.6 Predictive AI & Health Prognosis (`/predictions`)
* **File:** `apps/web/src/components/predictions/PredictionsDashboard.tsx`
* **Cosmetic Goals:** AI diagnostic intelligence dashboard.
* **Requirements:**
  - Add gradient progress bars for RUL (Remaining Useful Life) estimates and risk probability scores.

### 6.7 Blizzard & Crisis Simulation Engine (`/simulation`)
* **File:** `apps/web/src/components/simulation/SimulationDashboard.tsx`
* **Cosmetic Goals:** Polar storm simulation laboratory.
* **Requirements:**
  - Style scenario selection cards (*Normal, Gradual Drift, Spike Overheat, Sensor Dropout*) with high-tech glowing outlines.

### 6.8 POL Fuel & Microgrid Energy Analytics (`/analytics`)
* **Files:**
  - `apps/web/src/components/analytics/AnalyticsPage.tsx`
  - `apps/web/src/components/analytics/FuelAnalyticsPanel.tsx`
  - `apps/web/src/components/analytics/EnergyAnalyticsPanel.tsx`
* **Cosmetic Goals:** POL fuel reserve and microgrid energy intelligence dashboard.
* **Requirements:**
  - Style tank farm fuel meters with glowing fill bars (`bg-cyan-500`, `bg-amber-500`, `bg-rose-500`).
  - Retain `suppressHydrationWarning` and `toLocaleString("en-US")` on numeric indicators.

### 6.9 Top Navigation Bar & Mission Sidebar
* **Files:**
  - `apps/web/src/components/layout/TopNavBar.tsx`
  - `apps/web/src/components/layout/Sidebar.tsx`
* **Cosmetic Goals:** Sleek navigation frame.
* **Requirements:**
  - Maintain the **WORKSTATION TERMINALS** navigation section with direct links to Laptop 1 (Maitri), Laptop 2 (Bharati), and Laptop 3 (HQ Command).
  - Ensure live UTC mission clock remains visible and update-resilient.

---

## 7. Verification & Pre-Commit Protocol

Before submitting any code edits, every AI agent or developer MUST run and verify the following commands:

```bash
# 1. Monorepo TypeScript Typecheck (Must pass with 0 errors)
pnpm typecheck

# 2. Web Application Typecheck
pnpm --filter web typecheck

# 3. Unit Test Suite Execution
pnpm test
```

### 📋 Checklist Before Committing:
- [ ] No API endpoint paths or schema types were altered.
- [ ] No Three.js WebGL canvas labels were broken or replaced with crashing `<Html>` components.
- [ ] All 3 Workstation Consoles (`/station/maitri`, `/station/bharati`, `/dashboard`) load smoothly.
- [ ] Supabase login gateway (`/login`) functions properly with 1-click terminal launchers.
- [ ] `pnpm typecheck` returns 0 errors across all 6 packages.

---
*Created for the NCPOR Antarctic Digital Twin Engineering Team.*
