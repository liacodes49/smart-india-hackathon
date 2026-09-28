// ═══════════════════════════════════════════════════════════════
// @repo/api-client — Complete Typed SDK for Frontend & UI Team
// ═══════════════════════════════════════════════════════════════

import { ApiClient, type ClientConfig } from './client.js';
import { createStationsApi } from './stations.js';
import { createTelemetryApi } from './telemetry.js';
import { createAlertsApi } from './alerts.js';
import { createEnergyApi } from './energy.js';
import { createInventoryApi } from './inventory.js';
import { createWeatherApi } from './weather.js';
import { createPredictionsApi } from './predictions.js';
import { createSimulationApi } from './simulation.js';
import { createDigitalTwinApi } from './digital-twin.js';
import { createIncidentsApi } from './incidents.js';
import { createAssistantApi } from './assistant.js';
import { createEdgeApi } from './edge.js';
import { createGatewayApi } from './gateway.js';
import { createAnalyticsApi } from './analytics.js';

export { ApiClient } from './client.js';
export type { ClientConfig } from './client.js';

export { createStationsApi } from './stations.js';
export { createTelemetryApi } from './telemetry.js';
export { createAlertsApi } from './alerts.js';
export { createEnergyApi } from './energy.js';
export { createInventoryApi } from './inventory.js';
export { createWeatherApi } from './weather.js';
export { createPredictionsApi } from './predictions.js';
export { createSimulationApi } from './simulation.js';
export { createDigitalTwinApi } from './digital-twin.js';
export { createIncidentsApi } from './incidents.js';
export { createAssistantApi } from './assistant.js';
export { createEdgeApi } from './edge.js';
export { createGatewayApi } from './gateway.js';
export { createAnalyticsApi } from './analytics.js';

/**
 * Unified Typed Antarctic Digital Twin Client SDK
 */
export class AntarcticTwinClient {
  public readonly client: ApiClient;

  public readonly stations: ReturnType<typeof createStationsApi>;
  public readonly telemetry: ReturnType<typeof createTelemetryApi>;
  public readonly alerts: ReturnType<typeof createAlertsApi>;
  public readonly energy: ReturnType<typeof createEnergyApi>;
  public readonly inventory: ReturnType<typeof createInventoryApi>;
  public readonly weather: ReturnType<typeof createWeatherApi>;
  public readonly predictions: ReturnType<typeof createPredictionsApi>;
  public readonly simulation: ReturnType<typeof createSimulationApi>;
  public readonly digitalTwin: ReturnType<typeof createDigitalTwinApi>;
  public readonly incidents: ReturnType<typeof createIncidentsApi>;
  public readonly assistant: ReturnType<typeof createAssistantApi>;
  public readonly edge: ReturnType<typeof createEdgeApi>;
  public readonly gateway: ReturnType<typeof createGatewayApi>;
  public readonly analytics: ReturnType<typeof createAnalyticsApi>;

  constructor(config: ClientConfig) {
    this.client = new ApiClient(config);

    this.stations = createStationsApi(this.client);
    this.telemetry = createTelemetryApi(this.client);
    this.alerts = createAlertsApi(this.client);
    this.energy = createEnergyApi(this.client);
    this.inventory = createInventoryApi(this.client);
    this.weather = createWeatherApi(this.client);
    this.predictions = createPredictionsApi(this.client);
    this.simulation = createSimulationApi(this.client);
    this.digitalTwin = createDigitalTwinApi(this.client);
    this.incidents = createIncidentsApi(this.client);
    this.assistant = createAssistantApi(this.client);
    this.edge = createEdgeApi(this.client);
    this.gateway = createGatewayApi(this.client);
    this.analytics = createAnalyticsApi(this.client);
  }

  setToken(token: string): void {
    this.client.setToken(token);
  }

  clearToken(): void {
    this.client.clearToken();
  }
}
