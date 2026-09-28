a# Antarctic Digital Twin — Backend Product & Engineering Execution Plan

**Document ID:** SIH-ANTARCTIC-BE-PLAN-001  
**Status:** Draft / Team Working Baseline  
**Version:** 1.0  
**Project:** Digital Platform for Efficient Remote Management of Indian Antarctic Research Stations  
**Primary stations:** Maitri and Bharati  
**Audience:** Backend engineers, frontend engineers, AI/ML engineers, DevOps engineers, code agents, technical leads, reviewers

---

## 1. Purpose

This document is the shared product and engineering execution plan for the backend of the Antarctic Digital Twin platform.

It defines:

- what capabilities the backend will provide;
- the chronological order in which capabilities will be developed;
- why each phase exists and what must be completed before moving forward;
- the modules/domains that make up the system;
- how each module should be implemented;
- the event-driven flows connecting modules;
- the canonical event vocabulary;
- the boundaries that code agents must respect;
- testing, validation, observability, and release expectations;
- the definition of done for each development phase.

This document is intended to function as a **shared context contract** for both human developers and autonomous/semi-autonomous code agents.

> **Core principle:** Build a reliable operational system first, then intelligence, simulation, and AI on top of trustworthy operational data.

---

# 2. Product North Star

The platform is a continuously updated digital representation of Antarctic research-station operations.

It should allow authorized operators to:

1. understand the current condition of a station;
2. monitor infrastructure, resources, environment, and equipment;
3. detect abnormal conditions and operational risks;
4. manage alerts and incidents;
5. predict resource depletion and equipment problems;
6. simulate operational scenarios;
7. visualize the station spatially;
8. operate during unreliable connectivity;
9. receive decision support and recommendations.

### Product evolution

The system should evolve through:

**SEE → KNOW → PREDICT → SIMULATE → DECIDE**

| Level | Product question | Main capabilities |
|---|---|---|
| SEE | What is happening? | Station model, telemetry, energy, inventory, environment |
| KNOW | Is something wrong? | Alerts, risks, station health |
| PREDICT | What is likely to happen? | Fuel prediction, equipment prediction |
| SIMULATE | What happens if we change something? | What-if simulation |
| DECIDE | What should the operator do? | Recommendations, AI operations assistant |

---

# 3. Scope and Priority

## P0 — Must Have

- Maitri/Bharati station model
- Telemetry simulator
- Energy monitoring
- Logistics/resource inventory
- Environmental monitoring
- Alert/risk engine
- Fuel prediction
- What-if simulation
- Offline/edge-compatible architecture and eventual edge mode

## P1 — High Priority

- 2D/3D spatial digital twin
- Equipment predictive maintenance

## P2 — Nice to Have

- AI operations assistant

## P3 — Optional

- Real hardware sensor integration

## Explicitly Deprioritized

- Full-blown ML platform
- Photorealistic 3D
- Unnecessary microservices
- Premature distributed infrastructure
- Hardware-first development

---

# 4. Architectural Strategy

## 4.1 Recommended initial architecture

Use a **modular monolith with event-driven internal boundaries**.

```text
                    ┌──────────────────────┐
                    │      Next.js UI      │
                    └──────────┬───────────┘
                               │
                         REST / SSE / WS
                               │
                    ┌──────────▼───────────┐
                    │    Express API       │
                    │   Modular Monolith    │
                    └──────────┬───────────┘
                               │
       ┌───────────────────────┼────────────────────────┐
       │                       │                        │
       ▼                       ▼                        ▼
  Station Domain          Telemetry Domain        Operations
       │                       │                        │
       ▼                       ▼                        ▼
  Assets / Zones          Sensors / Readings     Alerts / Incidents
       │                       │                        │
       └───────────────────────┼────────────────────────┘
                               │
                        Domain Events
                               │
                 ┌─────────────┼─────────────┐
                 ▼             ▼             ▼
              Health         Risk        Analytics
                 │             │             │
                 └─────────────┼─────────────┘
                               ▼
                     Simulation / Prediction
                               │
                               ▼
                         Digital Twin / AI

               ┌─────────────────────────────┐
               │ PostgreSQL (+ PostGIS)      │
               └─────────────────────────────┘

               ┌─────────────────────────────┐
               │ Redis / Job & Cache Layer   │
               └─────────────────────────────┘
```

The initial system should remain deployable as a small number of services. A domain must not be extracted into a microservice merely because it has its own folder.

## 4.2 Architectural rules

1. Domain logic must not live inside HTTP route handlers.
2. Controllers translate HTTP requests into application/service calls.
3. Services contain use-case and business logic.
4. Repositories own persistence access.
5. External providers are accessed through adapters/interfaces.
6. Domain modules communicate through explicit contracts.
7. Events describe facts that have happened; commands request actions.
8. No module should directly manipulate another module's database tables.
9. Validation happens at system boundaries.
10. Every significant operational transition should be observable.
11. AI must consume trusted system data through explicit interfaces.
12. Simulation must not mutate production state unless an explicit scenario is committed.
13. Offline synchronization must be designed as a first-class concern, even if full edge deployment comes later.

---

# 5. Chronological Development Plan

## Phase 0 — Product and Contract Baseline

### Goal

Freeze the shared understanding of the system before implementation diverges across agents.

### Deliverables

- feature scope;
- module list;
- domain terminology;
- API conventions;
- event naming conventions;
- data ownership rules;
- error model;
- authorization model;
- environment configuration contract;
- testing strategy.

### Focus

**Shared vocabulary and boundaries.**

### Exit gate

All agents can answer:

- What is a station?
- What is an asset?
- What is a sensor?
- What is telemetry?
- What is an alert?
- What is an incident?
- What is a scenario?
- What belongs to the digital twin?
- Which module owns each concept?

---

# Phase 1 — Foundation and Identity

### Goal

Create the secure technical foundation.

### Capabilities

- application bootstrap;
- configuration;
- database connection;
- health checks;
- structured logging;
- authentication;
- authorization;
- user and role management;
- API versioning;
- common error handling;
- request validation.

### Initial endpoints

```text
GET  /health
GET  /health/live
GET  /health/ready

POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

### Focus

Keep the foundation boring, predictable, and reusable.

### Do not build

- advanced IAM;
- distributed auth services;
- complex permission DSL;
- custom identity provider infrastructure.

### Exit gate

A user can authenticate, receive an authorized session/token, call a protected endpoint, and receive a consistent error when unauthorized.

---

# Phase 2 — Station Model

### Goal

Represent the physical Antarctic operational environment.

### Core hierarchy

```text
Station
 ├── Building
 │    └── Zone
 │         └── Equipment / Sensors
 └── Location
```

### Capabilities

- Maitri;
- Bharati;
- station metadata;
- coordinates;
- operational status;
- buildings;
- zones;
- spatial metadata;
- station configuration.

### Example operations

```text
Create station
List stations
Get station
Update station
Create building
Create zone
Get station hierarchy
```

### Focus

Correct relationships and stable identifiers.

### Exit gate

The system can return a complete station hierarchy suitable for both the operations UI and future digital-twin visualization.

---

# Phase 3 — Assets and Infrastructure

### Goal

Represent the physical systems that keep the station operational.

### Asset categories

- power generation;
- electrical distribution;
- HVAC/heating;
- water;
- fuel;
- communications;
- vehicles;
- laboratory equipment;
- safety systems;
- other critical infrastructure.

### Asset properties

- identity;
- station;
- zone;
- type;
- manufacturer/model;
- operational status;
- criticality;
- installation information;
- maintenance state;
- metadata.

### Criticality

```text
CRITICAL
HIGH
MEDIUM
LOW
```

### Focus

Model dependencies and operational importance.

### Exit gate

An operator can navigate:

```text
Station → Building → Zone → Asset
```

and determine which assets are critical to station operation.

---

# Phase 4 — Sensors and Telemetry

### Goal

Create the operational data backbone.

### Sensor capabilities

- sensor registry;
- sensor types;
- units;
- location;
- asset association;
- zone association;
- online/offline state;
- last-seen timestamp;
- health metadata.

### Telemetry capabilities

- ingestion;
- validation;
- normalization;
- timestamps;
- units;
- quality metadata;
- persistence;
- historical querying.

### Initial measurement classes

- temperature;
- humidity;
- pressure;
- wind;
- power;
- voltage;
- current;
- fuel level;
- water level;
- equipment temperature;
- vibration;
- battery state.

### Telemetry simulator

The simulator must generate realistic streams rather than random noise.

It should support:

- normal operation;
- gradual changes;
- spikes;
- sensor dropout;
- equipment degradation;
- correlated measurements;
- configurable station scenarios.

### Focus

**Trustworthy data.**

Every reading must be traceable to:

```text
Station → Zone/Asset → Sensor → Timestamp → Value → Unit → Quality
```

### Exit gate

A simulated sensor can continuously produce telemetry, the backend stores it, and an API can retrieve current and historical readings.

---

# Phase 5 — Energy Monitoring

### Goal

Turn power telemetry into operational information.

### Capabilities

- generation;
- consumption;
- generator load;
- voltage/current;
- battery status;
- energy trends;
- equipment-level consumption where available;
- basic efficiency metrics.

### Focus

Create reusable energy metrics that can later feed:

- fuel prediction;
- station health;
- risk;
- simulation;
- analytics.

### Exit gate

The system can answer:

> How much power is the station producing, consuming, and how has that changed over time?

---

# Phase 6 — Logistics and Resource Management

### Goal

Represent consumable resources required to keep the station operational.

### Resource categories

```text
Fuel
Food
Water
Medical supplies
Spare parts
Scientific supplies
Consumables
```

### Capabilities

- inventory;
- stock levels;
- units;
- consumption;
- minimum threshold;
- replenishment;
- storage location;
- expiration where applicable;
- resource status;
- resupply information.

### Focus

Treat resources as operational state, not merely CRUD records.

### Exit gate

The backend can answer:

- How much resource remains?
- What is being consumed?
- Which resource is below threshold?
- Which resource is likely to run out first?

---

# Phase 7 — Environmental Monitoring

### Goal

Add external environmental context.

### Capabilities

- environmental observations;
- weather ingestion;
- forecasts;
- wind;
- temperature;
- pressure;
- visibility;
- snow/ice conditions;
- severe weather conditions.

### Provider architecture

Use an internal provider interface:

```text
WeatherService
      │
      └── WeatherProvider
             ├── Provider A
             └── Provider B
```

Business logic must not depend directly on an external vendor API.

### Focus

Normalize external data into internal models.

### Exit gate

The station can display and query current/historical environmental conditions and forecasts.

---

# Phase 8 — Alert and Risk Engine

### Goal

Convert raw conditions into operationally meaningful signals.

### Inputs

```text
Telemetry
Energy
Inventory
Environment
Asset state
Maintenance state
Historical context
```

### Outputs

- alerts;
- severity;
- risk signals;
- explanations;
- affected resources;
- affected assets;
- recommended next checks.

### Initial severity

```text
INFO
WARNING
CRITICAL
```

### Alert lifecycle

```text
TRIGGERED
   ↓
ACKNOWLEDGED
   ↓
RESOLVED
```

### Risk lifecycle

Risk is a computed state and may change over time.

### Focus

**Low-noise, explainable alerts.**

Do not create an alert simply because a number crossed a threshold if the condition is transient, invalid, or already covered by an active alert.

### Exit gate

A telemetry/environment condition can trigger a deterministic, traceable alert and risk signal.

---

# Phase 9 — Fuel Prediction

### Goal

Predict resource depletion from operational demand.

### Inputs

- current fuel inventory;
- historical fuel consumption;
- generator load;
- energy demand;
- environmental conditions;
- operational schedules where available;
- scenario assumptions.

### Outputs

```text
Current quantity
Estimated consumption rate
Estimated days remaining
Estimated depletion date
Confidence/quality indicator
Major influencing factors
```

### Focus

Start with explainable forecasting.

Example:

```text
Fuel remaining: 8,400 L
Estimated daily consumption: 310 L/day
Estimated remaining duration: ~27 days
```

The exact algorithm may evolve; the API contract should remain stable.

### Exit gate

A forecast can be generated reproducibly from stored data and its major inputs can be explained.

---

# Phase 10 — What-If Simulation

### Goal

Allow operators to explore hypothetical operational decisions without changing live station state.

### Example scenarios

- generator failure;
- generator unavailable for maintenance;
- severe storm;
- increased HVAC load;
- fuel delivery delay;
- abnormal consumption;
- reduced power generation;
- resource shortage.

### Simulation architecture

```text
Current State
      │
      ▼
Scenario Inputs
      │
      ▼
Simulation Engine
      │
      ▼
Projected State
      │
      ├── Energy
      ├── Fuel
      ├── Inventory
      ├── Risk
      └── Station Health
```

### Critical rule

Simulation is isolated from production state.

```text
LIVE STATE ≠ SCENARIO STATE
```

### Focus

Deterministic, reproducible, explainable outcomes.

### Exit gate

An operator can create a scenario, run it, inspect projected effects, compare it to baseline, and discard it without mutating live operations.

---

# Phase 11 — 2D/3D Spatial Digital Twin

### Goal

Provide a spatial representation of the operational model.

### Backend responsibilities

The backend provides:

- station hierarchy;
- spatial metadata;
- object identity;
- relationships;
- current state;
- health;
- telemetry summaries;
- alerts;
- asset state.

### Frontend responsibilities

The frontend owns:

- rendering;
- camera/navigation;
- visual effects;
- interaction;
- visual styling.

### Focus

**Operational usefulness over visual realism.**

A useful 2D operational map is more important than photorealistic 3D.

### Exit gate

A station can be visualized spatially and selecting an object can resolve it to backend state.

---

# Phase 12 — Equipment Predictive Maintenance

### Goal

Identify equipment degradation and recommend maintenance.

### Inputs

- asset metadata;
- telemetry history;
- usage;
- maintenance history;
- incidents;
- failures;
- environmental exposure.

### Outputs

- equipment health;
- anomaly score;
- failure-risk estimate;
- maintenance recommendation;
- supporting evidence.

### Focus

Explainability.

Preferred progression:

```text
Rules
  ↓
Statistical indicators
  ↓
Time-series/anomaly models
  ↓
ML where justified
```

Do not build a large ML platform prematurely.

### Exit gate

The system can identify at least one meaningful degradation pattern and explain why maintenance is recommended.

---

# Phase 13 — Offline / Edge Mode

### Goal

Keep station operations functional when connectivity is intermittent or unavailable.

### Principle

The station must not become operationally blind because the external connection disappears.

### Architecture

```text
                 CENTRAL
                    │
             Synchronization
                    │
                    ▼
                STATION EDGE
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
      Telemetry   Alerts   Local State
```

### Capabilities

- local telemetry buffering;
- local state;
- local alert evaluation where required;
- queued commands/actions;
- synchronization;
- retry;
- conflict resolution;
- timestamps;
- idempotency;
- connection status.

### Focus

**Local-first continuity.**

### Important design rule

Edge compatibility begins in Phase 1 even if the full edge runtime is implemented later.

Every event and write operation should be designed with:

- unique IDs;
- timestamps;
- source identity;
- idempotency;
- synchronization semantics.

### Exit gate

A simulated network outage does not lose operational data and the system can reconcile buffered data after reconnection.

---

# Phase 14 — AI Operations Assistant

### Goal

Provide a natural-language operational interface over trusted platform data.

### Example questions

- Why is Maitri at high risk?
- What equipment needs attention?
- How long will current fuel last?
- What changed in the last six hours?
- What happens if Generator 2 fails?
- Which incidents are unresolved?
- Why did station health decrease?

### AI architecture

```text
User Question
     ↓
Intent / Query Planning
     ↓
Approved Backend Tools
     ├── Station State
     ├── Telemetry
     ├── Inventory
     ├── Alerts
     ├── Incidents
     ├── Predictions
     └── Simulation
     ↓
Evidence
     ↓
LLM Explanation
```

### Focus

The assistant must **retrieve evidence from the platform** rather than invent operational facts.

### Exit gate

The assistant can answer a defined set of operational questions using current backend data and identify the evidence behind its response.

---

# Phase 15 — Real Hardware Integration

### Goal

Optionally connect physical sensors/devices.

### Architecture

```text
Hardware
   ↓
Firmware
   ↓
Gateway / Protocol
   ↓
Edge Runtime
   ↓
Sync / API
   ↓
Core Backend
```

### Focus

Hardware is an integration source, not the core platform.

The telemetry contract should already work with the simulator.

### Exit gate

At least one real sensor can produce valid telemetry through the same internal telemetry contract used by the simulator.

---

# Phase 16 — Production Hardening

This phase is continuous, but a dedicated hardening cycle occurs before final deployment.

### Security

- authentication;
- authorization;
- validation;
- rate limiting;
- secret management;
- secure headers;
- audit logging;
- least privilege.

### Reliability

- retries;
- timeouts;
- idempotency;
- graceful degradation;
- health checks;
- backups;
- recovery procedures.

### Observability

- structured logs;
- metrics;
- error tracking;
- request correlation;
- event tracing;
- job monitoring.

### Testing

- unit;
- integration;
- API;
- event;
- simulation;
- synchronization;
- end-to-end;
- load.

---

# 6. Domain Module Map

The backend should eventually contain these logical domains.

| Module | Owns | Depends on |
|---|---|---|
| Auth | users, roles, sessions | foundation |
| Stations | station hierarchy | foundation |
| Buildings/Zones | spatial hierarchy | stations |
| Assets | physical equipment | stations/zones |
| Sensors | sensor registry | stations/assets/zones |
| Telemetry | readings and ingestion | sensors |
| Energy | power metrics | telemetry/assets |
| Inventory | resources and stock | stations |
| Environment | weather/environment | stations/external providers |
| Alerts | operational alerts | telemetry/environment/assets |
| Risk | risk computation | alerts/energy/environment/inventory |
| Incidents | operational response | alerts/stations/assets |
| Maintenance | maintenance lifecycle | assets/incidents |
| Prediction | forecasts | telemetry/assets/inventory |
| Simulation | scenarios/projected state | station/energy/inventory/risk |
| Digital Twin | unified operational state | most core domains |
| Realtime | event delivery | domain events |
| Analytics | historical aggregation | telemetry/operations |
| AI Assistant | natural-language operations | approved backend tools |
| Edge/Sync | offline state and reconciliation | telemetry/events/core state |

---

# 7. Module Implementation Pattern

Every major domain should follow a consistent internal structure.

```text
module/
├── routes
├── controller
├── service
├── repository
├── schema/validation
├── types
├── events
├── policies
├── tests
└── index
```

Not every module needs every file on day one.

## Responsibilities

### Routes

HTTP mapping only.

### Controllers

Translate transport input/output.

### Services

Business rules and use cases.

### Repositories

Persistence operations.

### Validation

Input and domain validation.

### Events

Facts emitted by the module.

### Policies

Authorization or domain-specific permission decisions.

### Tests

Module-level behavior and contract tests.

---

# 8. Core Domain Relationships

```text
Station
 ├── Buildings
 │    └── Zones
 │         ├── Assets
 │         │    └── Sensors
 │         └── Sensors
 │
 ├── Inventory
 ├── Environment
 ├── Incidents
 └── Operational State

Sensor
 └── Telemetry

Telemetry
 ├── Alert
 ├── Health
 ├── Risk
 ├── Prediction
 └── Analytics

Asset
 ├── Maintenance
 ├── Health
 ├── Risk
 └── Prediction

Scenario
 └── Projected State
```

---

# 9. Canonical Event Model

## 9.1 Why events exist

Events allow modules to react to operational facts without tightly coupling their implementation.

Example:

```text
TelemetryReadingRecorded
        ↓
Alert Engine
        ↓
AlertTriggered
        ↓
Incident / Notification / Realtime
```

The telemetry module should not directly call every consumer.

## 9.2 Event naming

Use past-tense, fact-oriented names.

Good:

```text
StationCreated
SensorRegistered
TelemetryReadingRecorded
AlertTriggered
IncidentCreated
MaintenanceCompleted
```

Avoid:

```text
CreateStationEvent
DoAlert
UpdateThing
RunStuff
```

## 9.3 Canonical event envelope

Every event should conceptually contain:

```json
{
  "eventId": "uuid",
  "eventType": "TelemetryReadingRecorded",
  "version": 1,
  "occurredAt": "ISO-8601",
  "source": "telemetry",
  "stationId": "station-id",
  "entityId": "entity-id",
  "correlationId": "request-or-workflow-id",
  "causationId": "previous-event-id-or-null",
  "payload": {}
}
```

### Required properties

- globally unique event ID;
- event type;
- schema version;
- occurrence time;
- source;
- entity/station context;
- correlation ID;
- payload.

---

# 10. Event Catalog

## Station Events

### `StationCreated`

Emitted when a station is registered.

Consumers:

- digital twin;
- analytics;
- audit.

### `StationUpdated`

Emitted when station metadata changes.

Consumers:

- digital twin;
- cache/realtime;
- audit.

### `StationStatusChanged`

Emitted when operational status changes.

Consumers:

- health;
- risk;
- realtime;
- analytics.

---

## Asset Events

### `AssetCreated`

A new physical asset is registered.

### `AssetUpdated`

Asset metadata changes.

### `AssetStatusChanged`

Asset operational state changes.

Consumers:

- station health;
- risk;
- digital twin;
- realtime.

### `AssetHealthChanged`

Computed equipment health changes materially.

Consumers:

- risk;
- maintenance;
- digital twin;
- analytics.

---

## Sensor Events

### `SensorRegistered`

A sensor becomes known to the platform.

### `SensorStatusChanged`

Sensor transitions between states such as:

```text
ONLINE
OFFLINE
DEGRADED
UNKNOWN
```

### `SensorCalibrationUpdated`

Calibration metadata changes.

---

## Telemetry Events

### `TelemetryReadingRecorded`

A valid telemetry reading has been accepted.

Consumers:

- alert engine;
- energy;
- health;
- analytics;
- prediction.

### `TelemetryBatchRecorded`

A batch of readings has been accepted.

Useful for edge synchronization.

### `TelemetryAnomalyDetected`

A reading or sequence appears anomalous.

Consumers:

- alert/risk;
- predictive maintenance;
- analytics.

---

## Energy Events

### `EnergyStateUpdated`

Aggregated energy state changed.

### `EnergyThresholdExceeded`

Energy consumption/generation crossed a configured operational threshold.

Consumers:

- alerts;
- risk;
- fuel prediction.

---

## Inventory Events

### `InventoryItemCreated`

A resource is registered.

### `InventoryLevelChanged`

Quantity changed.

Consumers:

- risk;
- prediction;
- analytics.

### `InventoryThresholdCrossed`

Resource crossed a configured minimum/safety threshold.

Consumers:

- alerts;
- risk;
- logistics.

### `ResourceConsumptionRecorded`

Consumption has been recorded.

Consumers:

- prediction;
- analytics.

### `ResupplyRecorded`

New stock was received.

---

## Environmental Events

### `EnvironmentalObservationRecorded`

An observation has been accepted.

### `WeatherUpdated`

Current/forecast weather data changed.

### `SevereWeatherDetected`

A severe environmental condition has been detected.

Consumers:

- risk;
- alerts;
- simulation;
- realtime.

---

## Alert Events

### `AlertTriggered`

A new alert became active.

Consumers:

- incidents;
- notifications;
- realtime;
- audit.

### `AlertAcknowledged`

An operator acknowledged an alert.

### `AlertResolved`

An alert was resolved.

---

## Risk Events

### `RiskScoreChanged`

A material risk score changed.

### `RiskLevelChanged`

Risk transitioned between categories.

Example:

```text
LOW → MEDIUM
MEDIUM → HIGH
HIGH → CRITICAL
```

Consumers:

- realtime;
- digital twin;
- notifications;
- analytics.

---

## Incident Events

### `IncidentCreated`

An operational incident was created.

### `IncidentAssigned`

Ownership changed.

### `IncidentStatusChanged`

Incident moved through its lifecycle.

```text
OPEN
ASSIGNED
IN_PROGRESS
RESOLVED
CLOSED
```

### `IncidentResolved`

Incident resolution completed.

---

## Maintenance Events

### `MaintenanceScheduled`

Maintenance was scheduled.

### `MaintenanceStarted`

Maintenance began.

### `MaintenanceCompleted`

Maintenance was completed.

### `MaintenanceOverdue`

Scheduled maintenance passed its due date.

Consumers:

- risk;
- asset health;
- alerts;
- analytics.

---

## Prediction Events

### `FuelForecastUpdated`

Fuel depletion forecast changed materially.

### `EquipmentFailureRiskUpdated`

Equipment failure-risk estimate changed.

### `MaintenanceRecommendationGenerated`

A predictive maintenance recommendation was produced.

---

## Simulation Events

### `ScenarioCreated`

A what-if scenario was created.

### `ScenarioExecuted`

A scenario completed.

### `ScenarioCompared`

Scenario results were compared with baseline.

---

## Digital Twin Events

### `TwinStateUpdated`

The unified digital representation changed.

### `TwinObjectStateChanged`

A particular twin object changed.

Consumers:

- realtime;
- frontend synchronization;
- analytics.

---

## Edge Events

### `EdgeConnectionLost`

A station/edge node lost central connectivity.

### `EdgeConnectionRestored`

Connectivity returned.

### `EdgeDataBuffered`

Data was stored locally while disconnected.

### `EdgeDataSynchronized`

Buffered data was accepted by central infrastructure.

### `SyncConflictDetected`

A reconciliation conflict occurred.

---

# 11. Major End-to-End Event Flows

## Flow A — Telemetry to Alert

```text
Sensor
  ↓
Telemetry ingestion
  ↓
Validation
  ↓
TelemetryReadingRecorded
  ↓
Alert/Risk evaluation
  ↓
AlertTriggered
  ↓
Realtime notification
  ↓
Operator
```

---

## Flow B — Alert to Incident

```text
AlertTriggered
       ↓
Operator review
       ↓
IncidentCreated
       ↓
IncidentAssigned
       ↓
IncidentStatusChanged
       ↓
Resolution
       ↓
IncidentResolved
```

---

## Flow C — Equipment Degradation

```text
TelemetryReadingRecorded
       ↓
Historical aggregation
       ↓
Anomaly/degradation detection
       ↓
AssetHealthChanged
       ↓
EquipmentFailureRiskUpdated
       ↓
MaintenanceRecommendationGenerated
       ↓
MaintenanceScheduled
```

---

## Flow D — Fuel Prediction

```text
InventoryLevelChanged
        +
ResourceConsumptionRecorded
        +
EnergyStateUpdated
        +
WeatherUpdated
        ↓
Forecast engine
        ↓
FuelForecastUpdated
        ↓
Risk evaluation
        ↓
Potential alert
```

---

## Flow E — Severe Weather

```text
WeatherUpdated
       ↓
SevereWeatherDetected
       ↓
Risk recalculation
       ↓
RiskLevelChanged
       ↓
StationHealth recalculation
       ↓
Realtime update
       ↓
Operator
```

---

## Flow F — What-If Simulation

```text
Current Station State
        ↓
Create Scenario
        ↓
Apply hypothetical changes
        ↓
Simulation Engine
        ↓
Projected Energy
Projected Fuel
Projected Inventory
Projected Risk
Projected Health
        ↓
ScenarioExecuted
        ↓
Operator compares results
```

---

## Flow G — Offline Edge

```text
Central Connection
       ↓
     LOST
       ↓
Local buffering
       ↓
Local telemetry / alert operation
       ↓
Connection restored
       ↓
Sync queue
       ↓
Idempotent ingestion
       ↓
Conflict detection
       ↓
Central state reconciled
```

---

# 12. Station Health Model

Station health is a derived operational view, not a raw database field.

Conceptually:

```text
Station Health
├── Power Health
├── HVAC Health
├── Water Health
├── Communication Health
├── Environmental Health
├── Infrastructure Health
├── Resource Health
└── Safety/Incident Health
```

Each component should have:

- score;
- status;
- confidence/quality;
- contributing signals;
- timestamp.

Example:

```text
Overall: 86

Power:         92
HVAC:          78
Water:         95
Communications:87
Environment:   91
Resources:     82
Safety:        83
```

### Important

The exact scoring formula is an implementation detail and may evolve.

The stable product contract is:

> The system provides a transparent station-level health assessment backed by contributing operational signals.

---

# 13. Risk Engine Model

Risk should combine multiple signals rather than depend only on thresholds.

Conceptually:

```text
Risk =
    Asset criticality
  + Current abnormality
  + Environmental stress
  + Resource availability
  + Historical context
  + Dependency impact
```

A risk result should include:

```text
risk score
risk level
affected entity
contributing factors
timestamp
confidence/quality
```

Example:

```text
Risk: HIGH

Factors:
- Generator load above normal
- Fuel consumption increasing
- Severe weather forecast
- Backup capacity limited
```

The explanation is as important as the score.

---

# 14. What-If Simulation Contract

A scenario should contain:

```text
scenarioId
stationId
name
description
baselineTimestamp
assumptions
changes
createdBy
createdAt
```

Examples of changes:

```text
generator.status = OFF
fuel_delivery.delay_days = 10
hvac.load_multiplier = 1.20
storm.duration_hours = 96
```

The engine produces:

```text
projected state
delta from baseline
risk changes
resource changes
energy changes
health changes
warnings
```

Never silently modify live state.

---

# 15. Offline/Edge Contract

Every synchronizable record/event should have enough metadata to support reconciliation.

Minimum concepts:

```text
eventId
entityId
sourceId
occurredAt
receivedAt
sequence/version where applicable
```

The sync system must support:

### Idempotency

Receiving the same event twice must not duplicate the logical operation.

### Ordering

Where ordering matters, preserve or explicitly reconcile sequence.

### Conflict handling

Do not silently overwrite conflicting state.

### Auditability

A synchronization decision must be explainable.

---

# 16. API Strategy

Use versioned APIs.

```text
/api/v1/...
```

Use resource-oriented endpoints.

Examples:

```text
GET    /stations
POST   /stations
GET    /stations/:stationId

GET    /stations/:stationId/assets
POST   /stations/:stationId/assets

GET    /stations/:stationId/sensors
GET    /sensors/:sensorId

POST   /telemetry/readings
GET    /sensors/:sensorId/telemetry

GET    /stations/:stationId/alerts
POST   /alerts/:alertId/acknowledge

GET    /stations/:stationId/incidents
POST   /incidents
PATCH  /incidents/:incidentId
```

Do not create endpoints only because a database table exists.

Every endpoint should support an actual product workflow.

---

# 17. Data Strategy

## Primary operational database

PostgreSQL is the initial source of truth.

PostGIS may be used for spatial station/location data.

## Time-series data

Start with PostgreSQL-compatible telemetry storage.

Optimize to a dedicated time-series strategy only when actual volume/performance requires it.

## Cache / jobs

Redis may support:

- caching;
- job queues;
- short-lived state;
- rate limiting;
- realtime support.

Do not introduce Redis simply because it is available.

## Object storage

Use object storage for:

- documents;
- evidence;
- images;
- reports;
- optional 3D assets.

---

# 18. External Integration Strategy

Every external system should be isolated behind an adapter.

Bad:

```text
RiskService → vendor API
```

Good:

```text
RiskService
    ↓
Internal Environment Service
    ↓
Provider Interface
    ↓
External Provider Adapter
```

This applies to:

- weather;
- maps;
- notifications;
- AI providers;
- hardware gateways.

External failure must not crash unrelated core operations.

---

# 19. Notifications

Notifications should be treated as consumers of operational events.

Possible channels:

```text
In-app
Email
SMS
Push
```

The core domain should emit:

```text
AlertTriggered
RiskLevelChanged
IncidentCreated
MaintenanceOverdue
```

A notification subsystem decides whether/how to notify.

Do not embed email/SMS code inside the alert engine.

---

# 20. Analytics Strategy

Analytics should consume operational data/events without changing source-of-truth records.

Initial metrics:

### Station

- health trend;
- uptime;
- incident count;
- active alerts.

### Energy

- generation;
- consumption;
- peak load;
- efficiency.

### Fuel

- consumption rate;
- forecast depletion;
- historical usage.

### Assets

- downtime;
- failures;
- maintenance frequency;
- health trend.

### Environment

- temperature trends;
- wind;
- severe-weather periods.

---

# 21. AI Safety and Trust Rules

The AI assistant is not the source of truth.

It must:

1. retrieve data through approved backend tools;
2. distinguish current state from historical data;
3. distinguish observed facts from predictions;
4. show supporting evidence where appropriate;
5. avoid inventing sensor values;
6. avoid changing operational state without explicit authorized workflows;
7. use simulation for hypothetical questions;
8. respect user permissions;
9. record important assistant actions for auditability.

For example:

> "Why is Maitri at high risk?"

The assistant should obtain the current risk and contributing factors from the backend rather than infer them from memory.

---

# 22. Testing Strategy

Testing follows the same chronology as development.

## Unit tests

Use for:

- business rules;
- scoring;
- validation;
- forecasting;
- simulation;
- state transitions.

## Integration tests

Test:

```text
API → Service → Database
Telemetry → Alert Engine
Inventory → Forecast
Weather → Risk
```

## Contract tests

Verify:

- API request/response shapes;
- event schemas;
- module boundaries.

## End-to-end tests

Critical scenario:

```text
Login
 ↓
Select station
 ↓
Read telemetry
 ↓
Trigger abnormal condition
 ↓
Alert created
 ↓
Operator acknowledges
 ↓
Incident created
 ↓
Maintenance action
 ↓
Incident resolved
```

## Resilience tests

Test:

- database outage;
- external weather outage;
- Redis outage if used;
- duplicate telemetry;
- delayed events;
- offline sync;
- malformed data.

---

# 23. Observability Strategy

Every request and important event should be traceable.

Recommended concepts:

```text
requestId
correlationId
eventId
causationId
userId where appropriate
stationId
entityId
```

Logs should answer:

> What happened, to what entity, at which station, when, and because of which workflow?

Avoid sensitive data in logs.

---

# 24. Code Agent Operating Protocol

This section is specifically for AI/code agents.

## Before starting work

The agent must:

1. read this document;
2. identify the current phase;
3. identify the module it owns;
4. inspect existing code before creating new abstractions;
5. inspect adjacent module contracts;
6. identify dependencies;
7. avoid modifying unrelated modules;
8. state assumptions if requirements are ambiguous.

## During implementation

The agent should:

- follow existing conventions;
- keep changes scoped;
- use typed contracts;
- validate boundaries;
- add tests with behavior;
- preserve event schema conventions;
- avoid duplicated domain logic;
- avoid introducing new infrastructure without justification;
- avoid changing public contracts silently.

## Before finishing

The agent must verify:

```text
Typecheck
Lint
Unit tests
Relevant integration tests
Build
API/event contract compatibility
```

Then provide a concise implementation report:

```text
Implemented:
Changed:
Tests:
Events:
APIs:
Database:
Dependencies:
Known limitations:
Next recommended step:
```

---

# 25. Agent Context Handoff Template

Every agent handoff should contain:

```markdown
## Task
<what is being implemented>

## Current Phase
<phase number and name>

## Module
<module>

## Objective
<one paragraph>

## Existing Contracts
<APIs/events/data contracts>

## Dependencies
<modules that must already exist>

## Inputs
<data consumed>

## Outputs
<data/events produced>

## Constraints
<architecture/business rules>

## Files/Areas Allowed
<scope>

## Files/Areas Avoid
<scope>

## Acceptance Criteria
<testable requirements>

## Validation
<commands/tests>

## Handoff Notes
<what the next agent needs to know>
```

---

# 26. Phase Handoff Protocol

No phase is considered complete merely because code exists.

Each phase ends with:

### 1. Feature completion

All planned behavior exists.

### 2. Contract completion

APIs/events/data contracts are documented.

### 3. Test completion

Critical behavior is covered.

### 4. Integration completion

Dependent modules can consume it.

### 5. Observability completion

Important operations can be diagnosed.

### 6. Documentation completion

The next agent can continue without reverse-engineering the previous agent.

### 7. Demo completion

There is at least one realistic workflow proving the phase works.

---

# 27. Recommended Team Workstreams

For a six-person development team, organize work by domain ownership rather than arbitrary files.

### Workstream A — Platform/Core

Owns:

- foundation;
- auth;
- configuration;
- common infrastructure;
- API conventions.

### Workstream B — Station/Infrastructure

Owns:

- stations;
- buildings;
- zones;
- assets;
- maintenance.

### Workstream C — Telemetry

Owns:

- sensors;
- telemetry;
- simulator;
- ingestion;
- sensor health.

### Workstream D — Operations

Owns:

- energy;
- inventory;
- alerts;
- incidents.

### Workstream E — Intelligence

Owns:

- environmental integration;
- station health;
- risk;
- prediction;
- simulation.

### Workstream F — Twin/Realtime/AI

Owns:

- digital twin contracts;
- realtime;
- edge synchronization;
- AI assistant integration.

Ownership does not mean modules are developed simultaneously without coordination. Dependency order still applies.

---

# 28. Definition of Done

A module is done only when:

- [ ] domain behavior is implemented;
- [ ] input validation exists;
- [ ] authorization is applied where required;
- [ ] persistence is implemented;
- [ ] public API is documented if applicable;
- [ ] emitted events are documented;
- [ ] consumed events are documented;
- [ ] error behavior is defined;
- [ ] unit tests exist for core rules;
- [ ] integration tests cover persistence;
- [ ] logs/observability exist for important workflows;
- [ ] no unrelated code is modified;
- [ ] build/typecheck/lint pass;
- [ ] downstream consumers can integrate;
- [ ] at least one realistic workflow has been demonstrated.

---

# 29. Development Order Summary

```text
PHASE 0
Product + contracts
       ↓
PHASE 1
Foundation + identity
       ↓
PHASE 2
Station model
       ↓
PHASE 3
Assets + infrastructure
       ↓
PHASE 4
Sensors + telemetry simulator
       ↓
PHASE 5
Energy monitoring
       ↓
PHASE 6
Logistics/resource inventory
       ↓
PHASE 7
Environmental monitoring
       ↓
PHASE 8
Alert + risk engine
       ↓
PHASE 9
Fuel prediction
       ↓
PHASE 10
What-if simulation
       ↓
PHASE 11
2D/3D spatial twin
       ↓
PHASE 12
Predictive maintenance
       ↓
PHASE 13
Offline/edge mode
       ↓
PHASE 14
AI operations assistant
       ↓
PHASE 15
Real hardware integration
       ↓
PHASE 16
Production hardening
```

---

# 30. The Critical Dependency Graph

```text
                   FOUNDATION
                       │
                       ▼
                    STATION
                       │
              ┌────────┼─────────┐
              ▼        ▼         ▼
            ASSETS   ZONES    INVENTORY
              │
              ▼
            SENSORS
              │
              ▼
          TELEMETRY
              │
       ┌──────┼───────────────┐
       ▼      ▼               ▼
     ENERGY  ALERTS        ANALYTICS
       │      │
       │      ▼
       │    INCIDENTS
       │      │
       │   MAINTENANCE
       │      │
       └──────┼──────────────┐
              ▼              ▼
        PREDICTION         HEALTH
              │              │
              └──────┬───────┘
                     ▼
                  RISK
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
      SIMULATION            DIGITAL TWIN
          │                     │
          └──────────┬──────────┘
                     ▼
                 REALTIME
                     │
                     ▼
                   EDGE
                     │
                     ▼
                     AI
                     │
                     ▼
              DECISION SUPPORT
```

---

# 31. What Not To Do

## Do not start with AI

Without reliable operational data, AI becomes a demo gimmick.

## Do not start with 3D

The spatial twin needs a stable station model and state model.

## Do not start with hardware

The simulator must prove the platform independently.

## Do not build microservices prematurely

A modular monolith is easier to develop, test, and demonstrate.

## Do not create random events

Events must represent meaningful domain facts.

## Do not expose database tables as the product model

APIs should represent operational use cases.

## Do not allow simulation to modify live state

Simulation is isolated.

## Do not make predictions opaque

A useful prediction explains its inputs and confidence/quality.

## Do not let external providers own the domain model

Use adapters.

## Do not let code agents invent architecture independently

The shared contract in this document takes precedence.

---

# 32. Final Product Narrative

The completed system should demonstrate a coherent operational loop:

```text
PHYSICAL STATION
      ↓
DIGITAL MODEL
      ↓
SENSORS + DATA
      ↓
CURRENT STATE
      ↓
MONITORING
      ↓
ALERT / RISK
      ↓
INCIDENT / RESPONSE
      ↓
MAINTENANCE
      ↓
PREDICTION
      ↓
WHAT-IF SIMULATION
      ↓
DIGITAL TWIN
      ↓
DECISION SUPPORT
```

The platform therefore evolves from a simple monitoring system into an operational intelligence platform.

The final objective is not to maximize the number of technologies used.

The objective is to create a system where an operator can move from:

> **"What is happening?"**

to:

> **"Why is it happening?"**

to:

> **"What happens next?"**

to:

> **"What should we do?"**

with a trustworthy chain of data and reasoning connecting every step.

---

# 33. Master Engineering Rule

> **Every feature must strengthen the operational loop: Observe → Understand → Predict → Simulate → Decide.**

If a proposed feature does not meaningfully improve that loop, it should be questioned before implementation.

**End of Document**
