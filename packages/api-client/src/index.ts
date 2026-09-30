// ═══════════════════════════════════════════════════════════════
// @repo/api-client — Complete Typed SDK for Frontend & UI Team
// ═══════════════════════════════════════════════════════════════

import { ApiClient, type ClientConfig } from './client';
import { createStationsApi } from './stations';
import { createTelemetryApi } from './telemetry';
import { createAlertsApi } from './alerts';
import { createEnergyApi } from './energy';
import { createInventoryApi } from './inventory';
import { createWeatherApi } from './weather';
import { createPredictionsApi } from './predictions';
import { createSimulationApi } from './simulation';
import { createDigitalTwinApi } from './digital-twin';
import { createIncidentsApi } from './incidents';
import { createAssistantApi } from './assistant';
import { createEdgeApi } from './edge';
import { createGatewayApi } from './gateway';
import { createAnalyticsApi } from './analytics';
import { createMaintenanceApi } from './maintenance';
import { createSensorsApi } from './sensors';

export { ApiClient } from './client';
export type { ClientConfig } from './client';

export { createStationsApi } from './stations';
export { createTelemetryApi } from './telemetry';
export { createAlertsApi } from './alerts';
export { createEnergyApi } from './energy';
export { createInventoryApi } from './inventory';
export { createWeatherApi } from './weather';
export { createPredictionsApi } from './predictions';
export { createSimulationApi } from './simulation';
export { createDigitalTwinApi } from './digital-twin';
export { createIncidentsApi } from './incidents';
export { createAssistantApi } from './assistant';
export { createEdgeApi } from './edge';
export { createGatewayApi } from './gateway';
export { createAnalyticsApi } from './analytics';
export { createMaintenanceApi } from './maintenance';
export { createSensorsApi } from './sensors';


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
  public readonly maintenance: ReturnType<typeof createMaintenanceApi>;
  public readonly sensors: ReturnType<typeof createSensorsApi>;

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
    this.maintenance = createMaintenanceApi(this.client);
    this.sensors = createSensorsApi(this.client);
  }



  setToken(token: string): void {
    this.client.setToken(token);
  }

  clearToken(): void {
    this.client.clearToken();
  }
}
