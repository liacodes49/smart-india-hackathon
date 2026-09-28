# Antarctic Digital Twin — Chronological Change, Fix & Incident Ledger

This document serves as the permanent, authoritative record of all changes, alterations, broken states, and fixes across the lifecycle of the Antarctic Digital Twin project. Every entry is recorded in strict chronological order with root-cause analysis and verification evidence.

---

## Chronological Index

- [Entry 001 — Sprint 1: Shared Contracts & Event Bus](#entry-001--sprint-1-shared-contracts--event-bus)
- [Entry 002 — Sprint 1: Identity & Authentication Core](#entry-002--sprint-1-identity--authentication-core)
- [Entry 003 — Sprint 1: Station 3D Hierarchy & Aggregations](#entry-003--sprint-1-station-3d-hierarchy--aggregations)
- [Entry 004 — Sprint 1: Drizzle Migrations & Seed Data](#entry-004--sprint-1-drizzle-migrations--seed-data)
- [Entry 005 — Sprint 1: Test Suite & Typecheck Resolution](#entry-005--sprint-1-test-suite--typecheck-resolution)
- [Entry 006 — Sprint 2: Shared Contracts, Schemas & Routes](#entry-006--sprint-2-shared-contracts-schemas--routes)
- [Entry 007 — Sprint 2: Database Schema & Migration Generation](#entry-007--sprint-2-database-schema--migration-generation)
- [Entry 008 — Sprint 2: Asset Management & Sensor Registry Modules](#entry-008--sprint-2-asset-management--sensor-registry-modules)
- [Entry 009 — Sprint 2: Telemetry Ingestion Engine & Ring-Buffer Cache](#entry-009--sprint-2-telemetry-ingestion-engine--ring-buffer-cache)
- [Entry 010 — Sprint 2: Alert Engine & Deterministic Rules Evaluation](#entry-010--sprint-2-alert-engine--deterministic-rules-evaluation)
- [Entry 011 — Sprint 2: Telemetry Simulator & Physics Correlations](#entry-011--sprint-2-telemetry-simulator--physics-correlations)
- [Entry 012 — Sprint 2: Energy Monitoring & Inventory Management](#entry-012--sprint-2-energy-monitoring--inventory-management)
- [Entry 013 — Sprint 2: Route Registration & Antarctic Seed Expansion](#entry-013--sprint-2-route-registration--antarctic-seed-expansion)
- [Entry 014 — Sprint 2: Compilation Fixes (TS6133 & TS2322)](#entry-014--sprint-2-compilation-fixes-ts6133--ts2322)
- [Entry 015 — Sprint 2: Test Suite Fixes & Contract Synchronization](#entry-015--sprint-2-test-suite-fixes--contract-synchronization)
- [Entry 016 — Sprint 2: Final Monorepo Verification & Audit Ledger Setup](#entry-016--sprint-2-final-monorepo-verification--audit-ledger-setup)
- [Entry 017 — Sprint 2: Resolution of 13 IDE Test Schema & Type Errors](#entry-017--sprint-2-resolution-of-13-ide-test-schema--type-errors)
- [Entry 018 — Sprint 2: Resolution of Missing Status & Sensor Mock Properties](#entry-018--sprint-2-resolution-of-missing-status--sensor-mock-properties)
- [Entry 019 — Sprint 3: Formulation of Predictive Engine & Risk Assessment Plan](#entry-019--sprint-3-formulation-of-predictive-engine--risk-assessment-plan)

---

### Entry 001 — Sprint 1: Shared Contracts & Event Bus
* **Timestamp**: Phase 0 (Sprint 1 Kickoff)
* **Goal**: Establish canonical inter-module communication envelope and topic-based domain event bus.
* **What Was Altered / Created**:
  - `packages/shared/src/events/index.ts`: Created standard `DomainEvent<T>` interface (`eventId`, `eventType`, `occurredAt`, `source`, `stationId`, `entityId`, `correlationId`, `causationId`, `payload`).
  - `packages/shared/src/events/index.ts`: Created `EventType` enum and `createDomainEvent()` factory.
  - `packages/shared/package.json` & `packages/shared/src/index.ts`: Exported `./events`.
  - `apps/api/src/lib/event-bus.ts`: Implemented `DomainEventBus` class supporting topic handlers and global subscribers.
* **What Got Broken / Issues Encountered**:
  - Direct EventEmitter usage risked unhandled subscriber rejections bubbling up and terminating the process.
* **What Was Fixed / Resolution Details**:
  - Implemented per-subscriber `try/catch` error isolation in `DomainEventBus.publish()` with Winston error logging so one failing subscriber does not disrupt others.
* **Verification Evidence**:
  - `apps/api/tests/unit/event-bus.test.ts`: 4/4 tests passed.

---

### Entry 002 — Sprint 1: Identity & Authentication Core
* **Timestamp**: Phase 1 (Sprint 1)
* **Goal**: Native authentication, password hashing, and token verification without external cloud auth dependencies.
* **What Was Altered / Created**:
  - `apps/api/src/lib/crypto.ts`: Built native `node:crypto` engine for HS256 JWT signing/verification and Scrypt password hashing with 16-byte random salts.
  - `apps/api/src/middleware/auth.middleware.ts`: Implemented `authenticate` and `requireRole` middleware.
  - `apps/api/src/modules/auth/auth.service.ts`: Implemented login, register, refresh, logout, and me handlers.
  - `apps/api/src/modules/users/users.repository.ts` & `users.service.ts`: Implemented user persistence with password hash sanitization.
* **What Got Broken / Issues Encountered**:
  - Timing attack vulnerability on JWT signature comparison; password hash exposure risks.
* **What Was Fixed / Resolution Details**:
  - Applied `crypto.timingSafeEqual()` for signature comparison in `verifyJwt()`.
  - Enforced `sanitizeUser()` at the service layer to strip `passwordHash` before returning user entities to controllers.
* **Verification Evidence**:
  - `apps/api/tests/unit/crypto.test.ts`: 4/4 tests passed.

---

### Entry 003 — Sprint 1: Station 3D Hierarchy & Aggregations
* **Timestamp**: Phase 2 (Sprint 1)
* **Goal**: Model Indian Antarctic research stations (Maitri & Bharati), buildings, and compartments for the 3D digital twin.
* **What Was Altered / Created**:
  - `apps/api/src/modules/stations/stations.repository.ts`: Implemented CRUD, station code lookup (`MAITRI`, `BHARATI`), and `findHierarchy(idOrCode)` resolving `Station -> Buildings[] -> Rooms[]`.
  - `apps/api/src/modules/stations/stations.service.ts`: Implemented station overview aggregations and domain event emissions (`STATION_CREATED`, `BUILDING_CREATED`, etc.).
  - `apps/api/src/modules/stations/stations.controller.ts` & `stations.routes.ts`: Exposed REST API endpoints under `/api/v1/stations`.
* **What Got Broken / Issues Encountered**:
  - Potential cross-station querying when lookups accept both UUID and StationCode.
* **What Was Fixed / Resolution Details**:
  - Implemented dual-path lookup regex checking UUID vs uppercase station code in `stations.repository.ts`.
* **Verification Evidence**:
  - Tested endpoint resolution with code and UUID lookups.

---

### Entry 004 — Sprint 1: Drizzle Migrations & Seed Data
* **Timestamp**: Phase 3 (Sprint 1)
* **Goal**: Generate baseline schema migration and seed realistic Antarctic station data.
* **What Was Altered / Created**:
  - `apps/api/src/db/migrations/0000_stormy_charles_xavier.sql`: Generated migration for 12 core tables.
  - `apps/api/src/db/seed/index.ts`: Seeded coordinates, buildings, rooms, generators, pumps, sensors, and initial alerts for Maitri and Bharati.
* **What Got Broken / Issues Encountered**:
  - Seed script required valid scrypt hashes for initial users (`chief@maitri.station`, `engineer@maitri.station`, etc.).
* **What Was Fixed / Resolution Details**:
  - Used native `hashPassword()` within the seed script to generate valid password hashes.
* **Verification Evidence**:
  - Migration generated and verified against Drizzle metadata.

---

### Entry 005 — Sprint 1: Test Suite & Typecheck Resolution
* **Timestamp**: Sprint 1 Completion
* **Goal**: Validate zero compilation errors and test suite pass rate.
* **What Was Altered / Created**:
  - `apps/api/tests/unit/crypto.test.ts`
  - `apps/api/tests/unit/event-bus.test.ts`
  - `apps/api/tests/unit/health.test.ts`
  - `apps/api/tests/integration/auth.test.ts`
* **What Got Broken / Issues Encountered**:
  - Minor TypeScript workspace reference mismatches in `tsconfig.json`.
* **What Was Fixed / Resolution Details**:
  - Configured composite project references in packages.
* **Verification Evidence**:
  - `pnpm --filter @repo/api test`: 10 passed across 4 files.
  - `pnpm typecheck`: 5 packages passed cleanly.

---

### Entry 006 — Sprint 2: Shared Contracts, Schemas & Routes
* **Timestamp**: Sprint 2 Kickoff
* **Goal**: Expand domain events, shared types, and validation schemas for the operational data backbone (SEE → KNOW).
* **What Was Altered / Created**:
  - `packages/shared/src/events/index.ts`: Added Sprint 2 event types (`ASSET_*`, `SENSOR_*`, `TELEMETRY_*`, `ALERT_*`, `ENERGY_*`, `INVENTORY_*`, `RESOURCE_*`).
  - `packages/shared/src/enums/index.ts`: Added `AssetCriticality`, `InventoryCategory`, extended sensor enums.
  - `packages/shared/src/types/index.ts`: Added `InventoryItem`, `ResourceConsumption`, `TelemetrySummary`, `EnergySummary`.
  - `packages/schemas/src/asset.schema.ts`: Created asset Zod schemas.
  - `packages/schemas/src/sensor.schema.ts`: Created sensor Zod schemas.
  - `packages/schemas/src/inventory.schema.ts`: Created inventory & consumption Zod schemas.
  - `packages/shared/src/constants/index.ts`: Added `ASSETS`, `ENERGY`, `INVENTORY` route constants.
* **What Got Broken / Issues Encountered**:
  - None; schemas and contracts integrated cleanly.
* **Verification Evidence**:
  - Packages typechecked cleanly via `pnpm typecheck`.

---

### Entry 007 — Sprint 2: Database Schema & Migration Generation
* **Timestamp**: Sprint 2 Database Layer
* **Goal**: Add database support for inventory, consumption audit log, asset criticality, and composite indexes for telemetry ingestion.
* **What Was Altered / Created**:
  - `apps/api/src/db/schema/index.ts`: Added `asset_criticality` and `inventory_category` pgEnums, updated `assets` table, created `inventory_items` and `resource_consumption` tables.
  - Added unique constraint `(sensor_id, timestamp)` on `telemetry` table.
  - Added composite indexes on telemetry, assets, sensors, alerts, inventory.
  - Generated migration `apps/api/src/db/migrations/0001_overrated_nick_fury.sql`.
* **What Got Broken / Issues Encountered**:
  - Telemetry high-frequency batch insertion without unique constraint would permit duplicate readings, skewing rolling averages.
* **What Was Fixed / Resolution Details**:
  - Created composite unique index `uq_telemetry_sensor_timestamp` enabling `ON CONFLICT (sensor_id, timestamp) DO NOTHING`.
* **Verification Evidence**:
  - Migration file generated and reviewed.

---

### Entry 008 — Sprint 2: Asset Management & Sensor Registry Modules
* **Timestamp**: Sprint 2 Modules
* **Goal**: Strict physical hierarchy validation and sensor health monitoring.
* **What Was Altered / Created**:
  - `apps/api/src/modules/assets/`: Created repository, service, controller, routes. Enforces physical hierarchy validation (rejecting cross-station assignments).
  - `apps/api/src/modules/sensors/`: Created repository, service, controller, routes. Added `checkStaleSensors()` detecting sensors silent for > 5 minutes.
* **What Got Broken / Issues Encountered**:
  - Risk of sensors being bound to assets belonging to a different station.
* **What Was Fixed / Resolution Details**:
  - Added `validateAssetAssociation(assetId, stationId)` in `sensors.repository.ts` and called it prior to sensor registration.
* **Verification Evidence**:
  - Verified with unit tests in `assets-sensors.test.ts`.

---

### Entry 009 — Sprint 2: Telemetry Ingestion Engine & Ring-Buffer Cache
* **Timestamp**: Sprint 2 Ingestion Core
* **Goal**: High-frequency single/batch ingestion with idempotent duplicate protection and 24h rolling aggregations.
* **What Was Altered / Created**:
  - `apps/api/src/modules/telemetry/telemetry.repository.ts`: Implemented idempotent `create()`, batch creation, and DB rolling aggregations.
  - `apps/api/src/modules/telemetry/telemetry.service.ts`: Implemented 24-hour in-memory rolling ring-buffer cache (`5m`, `15m`, `1h`, `24h` windows), future timestamp rejection (> 5 min), and duplicate response `{ isDuplicate: true }`.
* **What Got Broken / Issues Encountered**:
  - Repeated calculation of rolling min/max/avg via SQL queries would cause high DB read contention during high-frequency ingestion.
* **What Was Fixed / Resolution Details**:
  - Designed an in-memory ring-buffer per sensor that evicts readings older than 24h, providing instant O(1) stats calculation with graceful fallback to DB queries.
* **Verification Evidence**:
  - Tested rolling calculations in `telemetry.test.ts`.

---

### Entry 010 — Sprint 2: Alert Engine & Deterministic Rules Evaluation
* **Timestamp**: Sprint 2 Alerting Core
* **Goal**: Real-time deterministic threshold evaluation, alert storm deduplication, escalation, and auto-recovery.
* **What Was Altered / Created**:
  - `apps/api/src/modules/alerts/alerts.repository.ts`: Status updates and active alert lookups.
  - `apps/api/src/modules/alerts/alerts.service.ts`: Implemented `evaluateReading()`, checking warning/critical/min limits, deduplicating active alerts, escalating `WARNING -> CRITICAL`, and automatically resolving alerts when readings recover.
* **What Got Broken / Issues Encountered**:
  - Telemetry fluctuations near threshold limits cause alert storming (hundreds of duplicate alerts generated for the same issue).
* **What Was Fixed / Resolution Details**:
  - Implemented deduplication in `evaluateReading()`: if an active alert exists for the sensor, update its metadata (`lastBreachedReading`, `lastBreachedAt`) rather than creating a new record.
* **Verification Evidence**:
  - Tested deduplication, escalation, and auto-recovery in `alerts.test.ts`.

---

### Entry 011 — Sprint 2: Telemetry Simulator & Physics Correlations
* **Timestamp**: Sprint 2 Simulator
* **Goal**: Provide polar physics simulation scenarios exercising the real ingestion engine.
* **What Was Altered / Created**:
  - `apps/api/src/services/telemetry/simulator.ts`: Implemented `TelemetrySimulator` class with 5 scenarios (`NORMAL`, `GRADUAL_DRIFT`, `SPIKE`, `DROPOUT`, `DEGRADATION`).
  - Added physical correlations: generator load kW $\to$ coolant temp $\to$ fuel burn rate; Katabatic storm wind gusts.
* **What Got Broken / Issues Encountered**:
  - Fast simulation ticks could produce duplicate timestamp collisions if sensor updates ran in sub-millisecond intervals.
* **What Was Fixed / Resolution Details**:
  - Simulator catches duplicate ingestion gracefully and uses monotonically stepped tick timestamps.
* **Verification Evidence**:
  - Tested in `simulator.test.ts` across scenarios.

---

### Entry 012 — Sprint 2: Energy Monitoring & Inventory Management
* **Timestamp**: Sprint 2 Operations
* **Goal**: Station power balance, autonomy hour projection, and atomic resource consumption.
* **What Was Altered / Created**:
  - `apps/api/src/modules/energy/energy.service.ts`: Implemented energy summary and 24h trends aggregation.
  - `apps/api/src/modules/inventory/inventory.repository.ts` & `inventory.service.ts`: Atomic stock decrement, negative stock rejection, consumption audit logging, and low-stock alert triggers.
* **What Got Broken / Issues Encountered**:
  - Race condition where concurrent stock decrements could cause inventory levels to drop below 0.
* **What Was Fixed / Resolution Details**:
  - Added SQL condition `WHERE id = $1 AND current_stock + $2 >= 0` in `adjustStock()` ensuring negative balances are rejected at the DB engine level.
* **Verification Evidence**:
  - Tested in `inventory.test.ts`.

---

### Entry 013 — Sprint 2: Route Registration & Antarctic Seed Expansion
* **Timestamp**: Sprint 2 Integration
* **Goal**: Mount all Sprint 2 routes and populate realistic Antarctic supply chain items.
* **What Was Altered / Created**:
  - `apps/api/src/routes/index.ts`: Mounted `/assets`, `/sensors`, `/telemetry`, `/alerts`, `/energy`, `/inventory`.
  - `apps/api/src/db/seed/index.ts`: Seeded Arctic diesel bladders, RO water buffers, freeze-dried rations, trauma medical packs, and generator overhaul spares for Maitri and Bharati.
* **What Got Broken / Issues Encountered**:
  - Missing route constants in `@repo/shared` for cleaner import paths.
* **What Was Fixed / Resolution Details**:
  - Added route constants in `packages/shared/src/constants/index.ts`.
* **Verification Evidence**:
  - Routes registered and verified.

---

### Entry 014 — Sprint 2: Compilation Fixes (TS6133 & TS2322)
* **Timestamp**: Sprint 2 Verification Phase
* **Goal**: Clean compilation of all packages with zero TypeScript errors.
* **What Was Altered / Created**:
  - `apps/api/src/modules/energy/energy.service.ts`: Lines 120-121.
  - `apps/api/src/modules/telemetry/telemetry.service.ts`: Lines 18, 356, 359.
* **What Got Broken / Issues Encountered**:
  1. `src/modules/energy/energy.service.ts(120,11): error TS6133: 'powerSensor' is declared but its value is never read.`
  2. `src/modules/energy/energy.service.ts(121,11): error TS6133: 'fuelSensor' is declared but its value is never read.`
  3. `src/modules/telemetry/telemetry.service.ts(356,9): error TS2322: Type '"STRUCTURAL" | ...' is not assignable to type 'SensorType'.`
  4. `src/modules/telemetry/telemetry.service.ts(359,9): error TS2322: Type '"MAINTENANCE" | ...' is not assignable to type 'SensorStatus'.`
* **What Was Fixed / Resolution Details**:
  - In `energy.service.ts`: Removed the unused `powerSensor` and `fuelSensor` declarations.
  - In `telemetry.service.ts`: Cast Drizzle's inferred string unions to the TypeScript enums: `s.type as unknown as SensorType` and `s.status as unknown as SensorStatus`.
* **Verification Evidence**:
  - `turbo typecheck`: 5/5 packages passed with 0 errors.

---

### Entry 015 — Sprint 2: Test Suite Fixes & Contract Synchronization
* **Timestamp**: Sprint 2 Unit Testing
* **Goal**: Write and verify test suites across all Sprint 2 services and engines.
* **What Was Altered / Created**:
  - `apps/api/tests/unit/telemetry.test.ts`
  - `apps/api/tests/unit/alerts.test.ts`
  - `apps/api/tests/unit/assets-sensors.test.ts`
  - `apps/api/tests/unit/inventory.test.ts`
  - `apps/api/tests/unit/simulator.test.ts`
* **What Got Broken / Issues Encountered**:
  1. In `telemetry.test.ts`: Attempted to spy on `updateLastReading` and `findBySensorAndTime` which did not match repository method names (`updateReading` and `findBySensorAndTimestamp`).
  2. In `telemetry.service.ts`: Programmatic calls without `stationId` threw an error even though `sensor.stationId` was known.
  3. In `assets-sensors.test.ts`: Attempted to call `sensorsService.registerSensor` instead of `createSensor`; `createAsset` attempted to query live Postgres because `assetsRepository.findByCode` was unmocked.
  4. In `inventory.test.ts`: Passed `{ amount: 400 }` instead of `{ quantity: 400 }`, causing `NaN` subtraction; mock item defined `minThreshold` instead of `minimumThreshold`.
  5. In `inventory.test.ts`: Assertion on `alertsService.createAlert` failed due to an extra `undefined` argument in `toHaveBeenCalledWith`.
* **What Was Fixed / Resolution Details**:
  1. Updated `telemetry.test.ts` to mock `sensorsRepository.updateReading` and `telemetryRepository.findBySensorAndTimestamp`.
  2. Updated `telemetry.service.ts` to default `stationId = input.stationId || sensor.stationId`.
  3. Updated `assets-sensors.test.ts` to call `createSensor` and mock `assetsRepository.findByCode(code).mockResolvedValue(null)`.
  4. Updated `inventory.test.ts` payload to `{ quantity: 400 }` and mock property to `minimumThreshold: 2000`.
  5. Updated assertion in `inventory.test.ts` to expect `(expect.objectContaining({ ... }), undefined)`.
* **Verification Evidence**:
  - `pnpm --filter @repo/api test`: All 34 tests in 9 test files passed in 2.27s.

---

### Entry 016 — Sprint 2: Final Monorepo Verification & Audit Ledger Setup
* **Timestamp**: 2026-09-16T13:28:00+05:30
* **Goal**: Establish persistent chronological audit ledger and learning proposal as requested by user.
* **What Was Altered / Created**:
  - `learning_proposal.md`: Created artifact proposing rule `.agents/rules/chronological_change_log.md`.
  - `CHANGES_AND_FIXES_LOG.md`: Initialized comprehensive chronological audit log in repository root.
* **What Got Broken / Issues Encountered**:
  - None.
* **Verification Evidence**:
  - File created and verified against all historical actions.

---

### Entry 017 — Sprint 2: Resolution of 13 IDE Test Schema & Type Errors
* **Timestamp**: 2026-09-16T13:32:00+05:30
* **Goal**: Eliminate 13 static type checking and Drizzle schema property mismatch errors reported by IDE diagnostics in test files.
* **What Was Altered / Created**:
  - `apps/api/tests/unit/alerts.test.ts`: Removed `resolutionNotes` property from `activeAlert` and `resolve` mock objects.
  - `apps/api/tests/unit/assets-sensors.test.ts`: Corrected `category: 'POWER'` to `'GENERATOR'`, `criticality: AssetCriticality.MISSION_CRITICAL` to `AssetCriticality.CRITICAL`, and removed extra non-existent properties (`specifications`, `type`, `lastMaintenanceDate`).
  - `apps/api/tests/unit/inventory.test.ts`: Added required `createdAt: new Date()` and removed non-existent `metadata: {}` from mock consumption records.
  - `apps/api/tests/unit/simulator.test.ts`: Aligned `mockStation` with `StationSelect` schema (`stationId`, `altitude`, `latitude`, `longitude`, `timezone`, `description`, `imageUrl`) and added required `maxThreshold: null` to `mockSensors`.
  - `apps/api/tests/unit/telemetry.test.ts`: Removed non-existent `assetId` and `metadata` properties from all 4 mock telemetry record objects (`mockRecord`, `existingRecord`, `createBatch`, `create`).
* **What Got Broken / Issues Encountered**:
  - 13 IDE diagnostics errors across 5 unit test files:
    1. `alerts.test.ts:238`: `Object literal may only specify known properties, and 'resolutionNotes' does not exist in type AlertSelect`.
    2. `alerts.test.ts:343`: `resolutionNotes` does not exist in type `AlertSelect`.
    3. `assets-sensors.test.ts:32`: `Type '"POWER"' is not assignable to type 'AssetCategory'`.
    4. `assets-sensors.test.ts:33`: `Property 'MISSION_CRITICAL' does not exist on type 'typeof AssetCriticality'`.
    5. `assets-sensors.test.ts:63`: `Type '"POWER"' is not assignable to type 'AssetCategory'`.
    6. `assets-sensors.test.ts:71`: `Type '"POWER"' is not assignable to type 'AssetCategory'`.
    7. `assets-sensors.test.ts:72`: `Property 'MISSION_CRITICAL' does not exist on type 'typeof AssetCriticality'`.
    8. `inventory.test.ts:51`: `Property 'createdAt' is missing in type mockConsumptionRecord`.
    9. `inventory.test.ts:102`: `Object literal may only specify known properties, and 'metadata' does not exist in type ResourceConsumptionSelect`.
    10. `simulator.test.ts:69`: `mockStation is missing stationId, altitude, description, imageUrl from StationSelect`.
    11. `simulator.test.ts:71`: `Property 'maxThreshold' is missing in mockSensors`.
    12. `telemetry.test.ts:166`: `Object literal may only specify known properties, and 'assetId' does not exist in TelemetrySelect`.
    13. `telemetry.test.ts:211`: `'assetId' does not exist in TelemetrySelect`.
* **What Was Fixed / Resolution Details**:
  - **Alerts Schema**: `alerts` table stores resolution context in `metadata` and records `resolvedBy`/`resolvedAt`; removed standalone `resolutionNotes` property in test fixtures.
  - **Asset Enums**: Fixed category to valid enum value `'GENERATOR'` and criticality to valid enum value `'CRITICAL'`.
  - **Resource Consumption**: Matched Drizzle's `resourceConsumption` table definition (`createdAt: Date`, no `metadata` field).
  - **Stations & Sensors**: Aligned mock station and sensors to exact Drizzle `$inferSelect` types (`real` numbers for coordinates/altitude, `maxThreshold: null`).
  - **Telemetry**: `telemetry` table is partitioned by `(sensor_id, station_id, timestamp, value, unit, status, quality)` without a redundant `asset_id` column (since assets are linked through sensors); removed `assetId` and `metadata` from telemetry test mocks.
* **Verification Evidence**:
  - `pnpm typecheck`: 5/5 packages passed with 0 errors (`turbo typecheck`).
  - `pnpm --filter @repo/api test`: 34/34 tests passed across 9 test files (0 failures).

---

### Entry 018 — Sprint 2: Resolution of Missing Status & Sensor Mock Properties
* **Timestamp**: 2026-09-16T13:40:00+05:30
* **Goal**: Fix 3 IDE static analysis diagnostics in `assets-sensors.test.ts` and `simulator.test.ts`.
* **What Was Altered / Created**:
  - `apps/api/tests/unit/assets-sensors.test.ts`: Added required `status: 'NORMAL'` to both `createAsset` test input calls.
  - `apps/api/tests/unit/simulator.test.ts`: Removed non-existent properties `page`, `limit`, `totalPages` from `sensorsRepository.findAll` mock return value.
* **What Got Broken / Issues Encountered**:
  1. `assets-sensors.test.ts:27`: `Property 'status' is missing in type but required in CreateAssetInput`.
  2. `assets-sensors.test.ts:63`: `Property 'status' is missing in type but required in CreateAssetInput`.
  3. `simulator.test.ts:74`: `Object literal may only specify known properties, and 'page' does not exist in type '{ data: SensorSelect[]; total: number; }'`.
* **What Was Fixed / Resolution Details**:
  - **Asset Input Status**: While `createAssetSchema` has `.default('NORMAL')`, TypeScript's inferred type for unparsed input expects `status` as a defined property. Added explicit `status: 'NORMAL'` in test fixtures.
  - **Sensors Repository Mock**: `sensorsRepository.findAll()` returns `{ data: SensorSelect[]; total: number; }` directly. Removed pagination metadata (`page`, `limit`, `totalPages`) from the mock return object.
* **Verification Evidence**:
  - `pnpm typecheck`: 5/5 packages passed with 0 errors (`turbo typecheck` in 2.42s).
  - `pnpm --filter @repo/api test`: 34/34 tests passed across 9 test files (0 failures in 2.09s).

---

### Entry 019 — Sprint 3: Formulation of Predictive Engine & Risk Assessment Plan
* **Timestamp**: 2026-09-16T13:45:00+05:30
* **Goal**: Define the architecture, contracts, algorithms, and execution plan for Sprint 3: Predictive Engine & Risk Assessment (PREDICT).
* **What Was Altered / Created**:
  - `implementation_plan.md`: Created comprehensive Sprint 3 plan covering:
    1. Environmental & Weather Intelligence (polar weather simulation, wind-chill index, blizzard warnings).
    2. Equipment Health & Failure Prediction (Z-score anomaly detection, health score 0-100%, RUL estimation, maintenance recommendations).
    3. Fuel Depletion & Resource Forecasting (sub-zero temperature and electrical load burn-rate models).
    4. Composite Station Health & Risk Scoring (4-pillar weighted model: Energy, Equipment, Weather, Supplies).
  - `task.md`: Updated sprint tracking to mark Sprint 2 completed and outline the 11 phases of Sprint 3.
* **What Got Broken / Issues Encountered**:
  - None.
* **What Was Fixed / Resolution Details**:
  - Successfully formulated Sprint 3 implementation plan adhering to Master Plan guidelines (explainable, deterministic statistical models, production isolation).
* **Verification Evidence**:
  - Artifact created with `request_feedback: true`.

---

### Entry 020 — Sprint 3: Predictive Engine & Risk Assessment Implementation
* **Timestamp**: 2026-09-16T15:33:00+05:30
* **Goal**: Implement Sprint 3 (PREDICT) adhering strictly to all 11 scientific and engineering guardrails:
  1. No fake precision (exposing calculation basis, baselines, and prototype assumptions).
  2. Estimated Remaining Useful Life (Estimated RUL) with uncertainty ranges and degradation trends.
  3. Failure Risk Estimate distinguished from calibrated probability.
  4. Pluggable `IWeatherProvider` contract with `PolarWeatherProvider` and provenance tagging (`SIMULATED`, `SENSOR`).
  5. Deterministic storm-severity calculation using wind speed, gust excess, JAG/TI wind-chill, and visibility restriction.
  6. 4-Pillar risk normalization (0–100 scale) before applying weighted composite formula ($0.35 \times \text{Energy} + 0.25 \times \text{Equipment} + 0.25 \times \text{Weather} + 0.15 \times \text{Supply}$).
  7. Strict isolation of emergency overrides to catastrophic life-safety states (total blackout, dry fuel tank).
  8. Human-in-the-loop maintenance workflow (`RECOMMENDED -> PENDING (Approved) -> IN_PROGRESS -> COMPLETED`).
  9. Explainable output metadata with top drivers and actionable recommendations.
* **What Was Altered / Created**:
  - `@repo/shared`:
    - `packages/shared/src/enums/index.ts`: Added `DataProvenance`, `RiskLevel`, `PredictionHorizon`, `WeatherCondition`, and `MaintenanceStatus.RECOMMENDED`.
    - `packages/shared/src/events/index.ts`: Added domain events `WEATHER_OBSERVATION_RECORDED`, `WEATHER_FORECAST_UPDATED`, `EQUIPMENT_HEALTH_DEGRADED`, `FAILURE_RISK_ELEVATED`, `FUEL_DEPLETION_FORECASTED`, `RISK_SCORE_UPDATED`, `MAINTENANCE_RECOMMENDED`.
    - `packages/shared/src/constants/index.ts`: Added `WEATHER: '/weather'` and `RISK: '/risk'` to `API_ROUTES`.
    - `packages/shared/src/types/index.ts`: Added `WeatherObservation`, `WeatherForecast`, `EstimatedRul`, `ContributingSignal`, `EquipmentHealthSummary`, `FuelDepletionForecast`, `PillarScore`, `RiskPillarBreakdown`, `RiskDriver`, `StationRiskAssessment`.
  - `@repo/schemas`:
    - `packages/schemas/src/weather.schema.ts`: Created observation and forecast validation schemas.
    - `packages/schemas/src/risk.schema.ts`: Created station risk query and configurable weights schemas.
    - `packages/schemas/src/prediction.schema.ts`: Added `evaluatePredictionSchema` and `fuelForecastQuerySchema`.
    - `packages/schemas/src/maintenance.schema.ts`: Added `RECOMMENDED` status support.
    - `packages/schemas/src/index.ts`: Exported new schemas.
  - Database Layer:
    - `apps/api/src/db/schema/index.ts`: Added `dataProvenanceEnum`, updated `maintenanceStatusEnum`, added `weatherObservations` table with indexes, and added relation bindings.
    - `apps/api/src/db/migrations/0002_living_madelyne_pryor.sql`: Generated Drizzle SQL migration.
    - `apps/api/src/db/seed/index.ts`: Seeded baseline polar weather observations for Maitri and Bharati.
  - Backend Modules (`apps/api/src/modules/`):
    - `weather/`: Implemented `weather.provider.ts` (`IWeatherProvider`, `PolarWeatherProvider`, JAG/TI formula, storm severity index), `weather.repository.ts`, `weather.service.ts`, `weather.controller.ts`, `weather.routes.ts`.
    - `predictions/`: Implemented `predictions.repository.ts`, `anomaly.service.ts` ($Z$-scores), `equipment-health.service.ts` (Health Index, Estimated RUL, Failure Risk Estimate, automated recommendation trigger), `fuel.service.ts` (electrical load + sub-zero thermal penalty burn model, resupply feasibility), `predictions.controller.ts`, `predictions.routes.ts`.
    - `maintenance/`: Implemented `maintenance.repository.ts`, `maintenance.service.ts` (creates recommendations in status `RECOMMENDED`, operator approval transition), `maintenance.controller.ts`, `maintenance.routes.ts` (added `/:id/approve` endpoint).
    - `risk/`: Implemented `risk.service.ts` (4-pillar 0–100 normalization, weighted composite, catastrophic blackout and dry tank overrides, top drivers and recommendations), `risk.controller.ts`, `risk.routes.ts`.
    - `apps/api/src/routes/index.ts`: Mounted `/weather` and `/risk` routes.
  - Unit & Integration Test Suites:
    - `apps/api/tests/unit/weather.test.ts`: 9 tests verifying JAG/TI wind-chill, storm severity, climate calibration, and forecast decay.
    - `apps/api/tests/unit/predictions.test.ts`: 5 tests verifying $Z$-score anomaly detection, Health Index, Estimated RUL, and recommendation triggers.
    - `apps/api/tests/unit/fuel-forecast.test.ts`: 4 tests verifying burn-rate physics, cold penalties, and resupply feasibility.
    - `apps/api/tests/unit/risk.test.ts`: 6 tests verifying 4-pillar normalization, weights, catastrophic emergency overrides, and explainability ranking.
* **What Got Broken / Issues Encountered**:
  1. `TS2307`: Attempted to import `eventBus` from non-existent `../../services/event-bus/event-bus.js`.
  2. `TS2551` & `TS2339`: Repository method naming mismatches (`sensorsRepository.findByAsset` vs `findByAssetId`, `telemetryRepository.findBySensorAndTime` vs `findAll`, `inventoryRepository.findByStation` vs `findAll({ stationId })`, `assetsRepository.findByStation` vs `findAll({ stationId })`).
  3. `TS2339`: `energyService.getEnergySummary` called instead of `getStationEnergySummary`.
  4. `TS2339`: `stationsRepository.findAll()` returned array directly, but controller destructured `{ data: stations }`.
  5. `TS2304`: `AssetCategory` was used without being imported in `equipment-health.service.ts`.
  6. Vitest `ReferenceError`: `vi.mock('../../src/modules/stations/stations.repository.js')` in `weather.test.ts` was hoisted above local variables.
  7. Vitest import error: `predictions.test.ts` attempted to dynamically import with incorrect relative path `../assets/...`.
  8. Vitest calculation delta: Benchmark test expected `-33.6°C` for $T=-20, V=40$, whereas exact JAG/TI equation yields `-34.1°C`.
* **What Was Fixed / Resolution Details**:
  1. Corrected `eventBus` import path to `../../lib/event-bus.js` across all new services.
  2. Aligned all repository calls with existing repository APIs (`findByAssetId`, `findAll({ stationId })`, `findAll({ sensorId, startDate })`).
  3. Corrected `energyService` invocation to `getStationEnergySummary(stationId)`.
  4. Removed invalid `{ data }` destructuring on `stationsRepository.findAll()`.
  5. Imported `AssetCategory` and cast Drizzle inferred strings appropriately.
  6. Replaced hoisted `vi.mock` with inline `vi.spyOn(stationsRepository, 'findById')`.
  7. Corrected import path in `predictions.test.ts` to `../../src/modules/assets/assets.repository.js`.
  8. Updated test assertion to match exact mathematical output of the JAG/TI formula (`-34.1°C`).
* **Verification Evidence**:
  - `turbo typecheck`: 5/5 workspace packages passed with 0 errors across `@repo/api`, `@repo/shared`, `@repo/schemas`, `@repo/api-client`, `@repo/ui`.
  - Vitest test suite: 13/13 test files passed, 58/58 unit and integration tests passing in 2.83s.

---

### Entry 021 — Sprint 4: Formulation of What-If Simulation, Spatial Twin & Incident Operations Plan
* **Timestamp**: 2026-09-16T15:53:00+05:30
* **Goal**: Formulate the architectural strategy, scientific guardrails, and execution plan for Sprint 4: Simulation Engine, Spatial Digital Twin State & Incident Operations (SIMULATE & DECIDE Foundation).
* **What Was Altered / Created**:
  - `implementation_plan.md`: Created detailed implementation plan covering:
    1. **What-If Simulation Engine (`apps/api/src/modules/simulation/`)**:
       - Isolated branch execution adhering to Rule 12 Invariant (`LIVE STATE != SCENARIO STATE`).
       - Scenario types: `POWER_FAILURE`, `WEATHER_EXTREME`, `SUPPLY_SHORTAGE`, `EQUIPMENT_FAILURE`, `CUSTOM`.
       - Multi-step timeline projections across $t_0, +1\text{h}, +6\text{h}, +24\text{h}, +7\text{d}, +30\text{d}$.
       - Delta comparison ($\Delta \text{Load}, \Delta \text{Fuel}, \Delta \text{Risk}$) and automated mitigation advice.
    2. **2D/3D Spatial Digital Twin Module (`apps/api/src/modules/digital-twin/`)**:
       - Hierarchical spatial tree (Station $\to$ Buildings $\to$ Zones $\to$ Assets $\to$ Sensors) with 3D Cartesian coordinates $(x, y, z)$ and dimensions.
       - Operational layer binding: telemetry values, equipment health index (0–100), alert pins, and thermal zone mapping.
       - Server-Sent Events (SSE) live streaming endpoint (`GET /api/v1/digital-twin/stations/:stationId/stream`).
    3. **Incident Management Module (`apps/api/src/modules/incidents/`)**:
       - Alert-to-incident escalation and full lifecycle management (`OPEN` $\to$ `ASSIGNED` $\to$ `IN_PROGRESS` $\to$ `RESOLVED` $\to$ `CLOSED`).
       - Ownership, SLAs, root-cause documentation, and resolution tracking.
    4. **AI Decision Support Bridge (`apps/api/src/modules/assistant/`)**:
       - Grounded query tools querying live backend services with strict evidence attribution and zero hallucination.
    5. **Database Layer**:
       - New tables: `scenarios`, `scenario_runs`, `incidents`.
       - Drizzle migration generation and seeding realistic Antarctic crisis templates.
  - `task.md`: Updated sprint tracking to add Sprint 4 phases 0 through 9.
* **What Got Broken / Issues Encountered**:
  - None.
* **What Was Fixed / Resolution Details**:
  - Successfully formulated comprehensive Sprint 4 plan adhering to the Backend Master Plan progression ($\text{SEE} \to \text{KNOW} \to \text{PREDICT} \to \mathbf{\text{SIMULATE}} \to \mathbf{\text{DECIDE}}$).
* **Verification Evidence**:
  - Artifact created with `request_feedback: true`.

---

### Entry 022 — Sprint 4: Implementation of Simulation Engine, Spatial Twin, Incident Operations & Grounded Assistant
* **Timestamp**: 2026-09-16T16:16:00+05:30
* **Goal**: Implement and verify Sprint 4 (SIMULATE & DECIDE Foundation) for Indian Antarctic Research Stations (Maitri & Bharati), upholding the non-negotiable invariant `LIVE PRODUCTION STATE != SCENARIO STATE`.
* **What Was Altered / Created**:
  1. **Shared Contracts & Validation Schemas**:
     - `packages/shared/src/enums/index.ts`: Added `IncidentSeverity`, `IncidentStatus`, `SpatialHealthColor`, `SpatialProvenance`.
     - `packages/shared/src/events/index.ts`: Added domain event types `INCIDENT_ASSIGNED`, `INCIDENT_STATUS_CHANGED`, `TWIN_STATE_UPDATED`, `SCENARIO_CREATED`, `SCENARIO_EXECUTED`.
     - `packages/shared/src/constants/index.ts`: Registered API routes `INCIDENTS: '/incidents'`, `ASSISTANT: '/assistant'`.
     - `packages/shared/src/types/index.ts`: Added contracts `SignedDelta`, `SimulationDeltas`, `SimulationTimelineStep`, `SimulationMitigation`, `Incident`, `SpatialTwinNode`, `SpatialStationState`, `AssistantEvidence`, `AssistantQueryRequest`, `AssistantQueryResponse`.
     - `packages/schemas/src/`: Added `incident.schema.ts`, `assistant.schema.ts`, added `quickRunSimulationSchema` in `simulation.schema.ts`, re-exported in `index.ts`.
  2. **Database Migration**:
     - `apps/api/src/db/schema/index.ts`: Added `incidentSeverityEnum`, `incidentStatusEnum`, `incidents` table with foreign keys to stations, alerts, users, and Drizzle relations.
     - Generated migration `apps/api/src/db/migrations/0003_tidy_silver_sable.sql`.
  3. **What-If Simulation Engine (`apps/api/src/modules/simulation/`)**:
     - `simulation.engine.ts`: Pure physics-based simulation engine with mathematical models for `POWER_FAILURE`, `WEATHER_EXTREME`, `SUPPLY_SHORTAGE`, `EQUIPMENT_FAILURE`, `CUSTOM`. Evaluates load shed deficits, battery discharge kinetics, fuel depletion, and thermal decays over discrete timelines ($t_0, +1\text{h}, +6\text{h}, +24\text{h}, +7\text{d}, +30\text{d}$) with signed deltas, ranked mitigations, and explicit prototype assumptions.
     - `simulation.repository.ts`: Read/write persistence for simulation runs.
     - `simulation.service.ts`: Assembles read-only baseline snapshots from live modules (`energyService`, `fuelForecastingService`, `weatherService`, `riskService`) without mutating them; provides `quickRunSimulation` for ephemeral sandbox modeling.
     - `simulation.controller.ts` & `simulation.routes.ts`: REST endpoints `GET /`, `GET /:id`, `POST /`, `POST /:id/run`, `POST /quick-run`.
  4. **2D/3D Spatial Digital Twin (`apps/api/src/modules/digital-twin/`)**:
     - `digital-twin.service.ts`: Assembles hierarchical station spatial model (`Station` $\to$ `Buildings` $\to$ `Rooms` $\to$ `Assets` $\to$ `Sensors`), mapping 3D Cartesian bounds, provenance tagging (`CONFIGURED | DERIVED | DEFAULT`), operational telemetry bindings, and health color tagging (`GREEN | YELLOW | RED`).
     - `digital-twin.controller.ts` & `digital-twin.routes.ts`: REST endpoints `GET /stations/:stationId`, `GET /stations/:stationId/zones/:zoneId`, and SSE stream `GET /stations/:stationId/stream` with 20s keep-alive heartbeat and disconnect cleanup.
  5. **Incident Operations Management (`apps/api/src/modules/incidents/`)**:
     - `incidents.repository.ts`: Drizzle persistence for incidents with filtering and pagination.
     - `incidents.service.ts`: Enforces strict lifecycle state machine (`OPEN -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED`), requires mandatory `rootCause` & `resolutionNotes` upon resolution, provides idempotent alert escalation, and publishes domain events.
     - `incidents.controller.ts` & `incidents.routes.ts`: REST endpoints `GET /`, `GET /:id`, `POST /`, `POST /alerts/:alertId/escalate`, `PATCH /:id`, `POST /:id/assign`, `POST /:id/resolve`.
  6. **Grounded AI Operations Assistant (`apps/api/src/modules/assistant/`)**:
     - `assistant.tools.ts`: Approved backend tool registry (`queryStationRisk`, `queryFuelOutlook`, `queryEquipmentHealth`, `queryActiveIncidents`, `queryWeather`, `runWhatIfSimulation`). Zero direct DB access.
     - `assistant.provider.ts`: Pluggable `IAssistantProvider` implementation (`PolarOperationsAssistantProvider`) with zero hallucination guarantee and structured evidence attribution.
     - `assistant.service.ts`, `assistant.controller.ts` & `assistant.routes.ts`: `POST /assistant/query`.
  7. **Central Routing**:
     - `apps/api/src/routes/index.ts`: Mounted `/incidents` and `/assistant` alongside existing `/simulations` and `/digital-twin`.
* **What Got Broken / Issues Encountered & Resolved**:
  - Express 5 parameter typing (`req.params.id as string`): Fixed across all controllers.
  - EventBus SSE unsubscribe pattern: Corrected to invoke returned cleanup callbacks on `req.on('close')`.
  - Unused imports / variables: Cleaned up across simulation engine, digital twin service, and assistant provider.
  - Test mocks alignment: Spy on `findActiveByAlertId` and `update` in `incidentsRepository`, `findAll` in `assetsRepository`, `assessStationRisk` in `riskService`.
* **Verification Evidence**:
  - `pnpm --filter @repo/api test`: All 18 test files passed, **82/82 unit and integration tests passing** in 4.19s.
  - `pnpm --filter @repo/api test tests/unit/e2e-scenario.test.ts`: Passed all 5 end-to-end integration steps proving:
    1. Generator failure what-if simulation calculates correct deltas and discrete timelines without mutating DB.
    2. Idempotent alert escalation creates an incident and progresses through complete lifecycle `OPEN -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED`.
    3. Spatial digital twin dynamically flags degraded assets with RED status.
    4. AI assistant synthesizes answer using grounded evidence from backend tools.
    5. Production tables (`alerts`, `assets`, `incidents`) have zero mutation during simulation runs.
  - `pnpm typecheck`: Monorepo-wide turbo typecheck passed with **5/5 packages successful** (`@repo/api`, `@repo/shared`, `@repo/schemas`, `@repo/api-client`, `@repo/ui`).

---

### Entry 023 — Resolution of IDE Diagnostic Feedback Across Test Suites
* **Timestamp**: 2026-09-16T16:19:00+05:30
* **Goal**: Resolve all 7 IDE diagnostic warnings/errors surfaced in `@[current_problems]` across `digital-twin.test.ts`, `e2e-scenario.test.ts`, and `simulation.test.ts`.
* **What Was Altered / Created**:
  1. `apps/api/tests/unit/digital-twin.test.ts`:
     - Removed non-existent `specifications: null` from asset fixture objects (lines 98 and 118).
     - Removed `buildingId` property from sensor test fixture (line 134) since sensors bind directly to `stationId`, `roomId`, and `assetId`.
     - Changed `recordedAt` from `new Date().toISOString()` (string) to `new Date()` (Date object) matching the Drizzle `WeatherObservation` schema.
  2. `apps/api/tests/unit/e2e-scenario.test.ts`:
     - In `escalateAlertToIncident(alertId, userId, options)`, replaced invalid property `{ priority: 'IMMEDIATE' }` with valid Zod-validated input `{ severity: IncidentSeverity.CRITICAL }`.
  3. `apps/api/tests/unit/simulation.test.ts`:
     - Fixed `getStationEnergySummary` mock return object to match `EnergySummary` contract (`totalGenerators: 3, batterySocPercent: 90, status: 'NORMAL', timestamp: string` instead of `batteryStatus` sub-object).
     - Changed `recordedAt` from ISO string to `new Date()` Date object.
* **What Got Broken / Issues Encountered**:
  - Test fixtures had minor property drift against the strongly-typed database and contract interfaces.
* **What Was Fixed / Resolution Details**:
  - All 7 TypeScript/IDE diagnostic errors were eliminated across all test files.
* **Verification Evidence**:
  - `pnpm --filter @repo/api test`: All 18 test files passed, **82/82 tests passing** in 4.77s.
  - `pnpm typecheck`: Monorepo turbo typecheck passed with **5/5 packages passing** (0 errors).

---

### Entry 024 — Strict Schema Alignment in Test Fixtures
* **Timestamp**: 2026-09-16T16:21:00+05:30
* **Goal**: Fix all secondary diagnostic issues reported in `@[current_problems]` by strictly aligning mock objects with Drizzle table definitions and Zod schemas.
* **What Was Altered / Created**:
  1. `apps/api/tests/unit/digital-twin.test.ts`:
     - Changed `installedAt` to `installDate: new Date()` on Generator 1 and Generator 2 mock objects matching the `assets` table schema (`install_date`).
     - Removed `roomId` from sensor mock fixture as the `sensors` table links to `assetId` and `stationId` (not `roomId`).
     - Removed non-table properties (`stormSeverityIndex`, `isBlizzardWarning`, `isExtremeWindChill`) from `weatherService.getCurrentWeather` return mock.
  2. `apps/api/tests/unit/simulation.test.ts`:
     - Removed non-table properties (`stormSeverityIndex`, `isBlizzardWarning`, `isExtremeWindChill`) from `weatherService.getCurrentWeather` mock return value to match `WeatherObservation` table schema.
  3. `apps/api/tests/unit/e2e-scenario.test.ts`:
     - Added required `remediationSteps: string[]` to `escalateAlertToIncident` parameter object matching `escalateAlertSchema`.
* **What Got Broken / Issues Encountered**:
  - Inferred types from Drizzle ORM tables rejected non-schema properties (`installedAt` vs `installDate`, `stormSeverityIndex` on raw observation table record).
* **What Was Fixed / Resolution Details**:
  - Aligned all mock fixtures directly with Drizzle table columns and Zod input contracts.
* **Verification Evidence**:
  - `pnpm --filter @repo/api test`: 18 test files passed, **82/82 unit and integration tests passing** in 4.40s.
  - `pnpm typecheck`: Monorepo turbo typecheck passed with **5/5 packages passing** (0 errors).

---

### Entry 025 — Sprint 5: Edge Synchronization, Industrial Gateway, Historical Analytics & Typed API Client SDK
* **Timestamp**: 2026-09-16 (Sprint 5 Completion)
* **Goal**: Implement Sprint 5 backend hardening covering offline/edge synchronization, satellite blackout resilience, multi-protocol industrial ingestion gateway, database-side historical analytics, verified MTBF/MTTR reliability metrics, NCPOR expedition reports, and typed `@repo/api-client` SDK.
* **What Was Altered / Created**:
  1. `packages/shared/src/enums/index.ts`: Extended `DataProvenance` with `EDGE_SYNC`; added `ConnectivityState`, `SyncStatus`, `GatewayProtocol`, `ReportType`, `ReportFormat`.
  2. `packages/shared/src/events/index.ts`: Added `EDGE_CONNECTIVITY_CHANGED`, `EDGE_OUTBOX_ENQUEUED`, `EDGE_SYNC_BATCH_RECONCILED`, `GATEWAY_TELEMETRY_INGESTED`, `GATEWAY_PAYLOAD_QUARANTINED`, `ANALYTICS_REPORT_GENERATED`.
  3. `packages/shared/src/types/index.ts`: Added types for edge batches, outbox records, gateway payloads, historical energy rollups, fuel trends, reliability metrics, and report exports.
  4. `packages/shared/src/constants/index.ts`: Added `EDGE`, `GATEWAY`, `ANALYTICS` to `API_ROUTES`.
  5. `packages/schemas/src/`: Created `edge.schema.ts`, `gateway.schema.ts`, `analytics.schema.ts`, and updated `index.ts`.
  6. `apps/api/src/db/schema/index.ts`: Added `connectivityStateEnum`, `syncStatusEnum`, `gatewayProtocolEnum`, `reportTypeEnum`, extended `dataProvenanceEnum`, created `edge_sync_batches`, `edge_outbox`, and `reports` tables with indexes and foreign keys.
  7. `apps/api/src/db/migrations/0004_quiet_princess_powerful.sql`: Generated Drizzle migration `0004`.
  8. `apps/api/src/modules/edge/`: Implemented `edge.repository.ts`, `edge.service.ts`, `edge.controller.ts`, `edge.routes.ts`.
  9. `apps/api/src/modules/gateway/`: Implemented `gateway.adapter.ts` (`RestGatewayAdapter`, `MqttGatewayAdapter`, `ModbusGatewayAdapter`, `ManualGatewayAdapter`), `gateway.service.ts`, `gateway.controller.ts`, `gateway.routes.ts`.
  10. `apps/api/src/modules/analytics/`: Implemented `analytics.repository.ts`, `analytics.service.ts`, `analytics.controller.ts`, `analytics.routes.ts`.
  11. `apps/api/src/routes/index.ts`: Mounted `/edge`, `/gateway`, `/analytics`.
  12. `packages/api-client/`: Created domain modules for `energy.ts`, `inventory.ts`, `weather.ts`, `predictions.ts`, `simulation.ts`, `digital-twin.ts`, `incidents.ts`, `assistant.ts`, `edge.ts`, `gateway.ts`, `analytics.ts`, and exported unified `AntarcticTwinClient` in `index.ts`.
  13. Tests: Created `tests/unit/edge-sync.test.ts` (9 tests), `tests/unit/gateway.test.ts` (7 tests), `tests/unit/analytics.test.ts` (7 tests), `tests/unit/api-client.test.ts` (7 tests), and `tests/unit/e2e-blackout-sync.test.ts` (1 scenario test).
* **What Got Broken / Issues Encountered & Resolved**:
  - TS6133 unused type imports in `edge.service.ts` and `analytics.service.ts`: removed.
  - TS2322 literal `'NORMAL'` vs `SensorStatus` enum in `gateway.adapter.ts`: imported and used `SensorStatus.NORMAL`.
  - Missing mock for `findOutboxByIdempotencyKey` in e2e scenario causing PostgreSQL connection attempt: added spy mock.
* **Verification Evidence**:
  - `pnpm --filter @repo/api test`: 23 test files passed, **113/113 unit and integration tests passing** in 6.82s.
  - `pnpm typecheck`: Monorepo turbo typecheck passed across all 5 workspace packages with **5/5 successful** (0 errors).

---

### Entry 026 — Edge Synchronization Schema Typing & Input Contract Alignment
* **Timestamp**: 2026-09-16
* **Goal**: Resolve IDE TypeScript diagnostic errors in `apps/api/tests/unit/e2e-blackout-sync.test.ts` and `apps/api/tests/unit/edge-sync.test.ts` where `events` and `readings` were strictly required on input payloads despite defaults and optionality.
* **What Was Altered / Created**:
  1. `packages/schemas/src/edge.schema.ts`:
     - Updated `edgeSyncPushBatchSchema` with `readings: z.array(syncBatchReadingItemSchema).optional().default([])` and `events: z.array(syncBatchEventItemSchema).optional().default([])`.
     - Exported `EdgeSyncPushBatchInput = z.input<typeof edgeSyncPushBatchSchema>` and `EdgeSyncPushBatchOutput = z.output<typeof edgeSyncPushBatchSchema>`.
  2. `apps/api/src/modules/edge/edge.service.ts`:
     - Updated `reconcileSyncBatch` to cleanly handle `input.readings ?? []` and `input.events ?? []`, preserving complete backward compatibility with callers and tests omitting `events`.
* **What Got Broken / Issues Encountered & Resolved**:
  - `z.infer<T>` resolves to output type where `.default([])` makes properties required on the inferred type. Switching the service input contract to `z.input<typeof edgeSyncPushBatchSchema>` allows callers to safely omit optional/defaulted arrays while maintaining type safety on parsed outputs.
* **Verification Evidence**:
  - `pnpm --filter @repo/schemas typecheck`: Passed (code 0).
  - `pnpm --filter @repo/api typecheck`: Passed (code 0).
  - `pnpm typecheck`: Monorepo turbo typecheck passed with **5/5 successful packages** (0 errors).
  - `pnpm --filter @repo/api test`: 23 test files passed, **113/113 tests passing** (0 errors).










