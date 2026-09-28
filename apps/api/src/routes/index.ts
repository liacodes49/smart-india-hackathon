// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Central Route Registry
// ═══════════════════════════════════════════════════════════════
// All module routes are mounted here under /api/v1.
// This is the single place that defines the API surface.
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { usersRoutes } from '../modules/users/users.routes.js';
import { stationsRoutes } from '../modules/stations/stations.routes.js';
import { assetsRoutes } from '../modules/assets/assets.routes.js';
import { sensorsRoutes } from '../modules/sensors/sensors.routes.js';
import { telemetryRoutes } from '../modules/telemetry/telemetry.routes.js';
import { alertsRoutes } from '../modules/alerts/alerts.routes.js';
import { energyRoutes } from '../modules/energy/energy.routes.js';
import { inventoryRoutes } from '../modules/inventory/inventory.routes.js';
import { predictionsRoutes } from '../modules/predictions/predictions.routes.js';
import { simulationRoutes } from '../modules/simulation/simulation.routes.js';
import { maintenanceRoutes } from '../modules/maintenance/maintenance.routes.js';
import { digitalTwinRoutes } from '../modules/digital-twin/digital-twin.routes.js';
import { reportsRoutes } from '../modules/reports/reports.routes.js';
import { auditRoutes } from '../modules/audit/audit.routes.js';
import { weatherRoutes } from '../modules/weather/weather.routes.js';
import { riskRoutes } from '../modules/risk/risk.routes.js';
import { incidentRoutes } from '../modules/incidents/incidents.routes.js';
import { assistantRoutes } from '../modules/assistant/assistant.routes.js';
import { edgeRoutes } from '../modules/edge/edge.routes.js';
import { gatewayRoutes } from '../modules/gateway/gateway.routes.js';
import { analyticsRoutes } from '../modules/analytics/analytics.routes.js';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'antarctic-digital-twin-api',
      version: '0.2.0',
      uptime: process.uptime(),
    },
    timestamp: new Date().toISOString(),
  });
});

// Mount module routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/stations', stationsRoutes);
router.use('/assets', assetsRoutes);
router.use('/sensors', sensorsRoutes);
router.use('/telemetry', telemetryRoutes);
router.use('/alerts', alertsRoutes);
router.use('/energy', energyRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/predictions', predictionsRoutes);
router.use('/simulations', simulationRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/digital-twin', digitalTwinRoutes);
router.use('/reports', reportsRoutes);
router.use('/audit', auditRoutes);
router.use('/weather', weatherRoutes);
router.use('/risk', riskRoutes);
router.use('/incidents', incidentRoutes);
router.use('/assistant', assistantRoutes);
router.use('/edge', edgeRoutes);
router.use('/gateway', gatewayRoutes);
router.use('/analytics', analyticsRoutes);

export const apiRouter: Router = router;
export const apiRoutes: Router = router;



