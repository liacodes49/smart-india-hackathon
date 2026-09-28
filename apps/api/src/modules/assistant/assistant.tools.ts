// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Assistant Approved Backend Tools
// ═══════════════════════════════════════════════════════════════
// Strict backend tool registry for Grounded AI Operations Assistant.
// INVARIANT: The assistant layer NEVER touches the database directly.
// All operational telemetry, predictions, and simulations are retrieved
// exclusively through approved, validated domain services.
// ═══════════════════════════════════════════════════════════════

import { riskService } from '../risk/risk.service.js';
import { fuelForecastingService } from '../predictions/fuel.service.js';
import { equipmentHealthService } from '../predictions/equipment-health.service.js';
import { simulationService } from '../simulation/simulation.service.js';
import { incidentsService } from '../incidents/incidents.service.js';
import { weatherService } from '../weather/weather.service.js';
import { assetsRepository } from '../assets/assets.repository.js';
import type { AssistantEvidence } from '@repo/shared';

export interface ToolResult {
  toolName: string;
  evidence: AssistantEvidence;
}

export const assistantTools = {
  /**
   * Tool: queryStationRisk
   */
  async queryStationRisk(stationId: string): Promise<ToolResult> {
    const risk = await riskService.assessStationRisk(stationId);
    return {
      toolName: 'queryStationRisk',
      evidence: {
        source: 'station_health',
        timestamp: risk.assessedAt,
        fields: ['compositeScore', 'riskLevel', 'isEmergencyOverride', 'topDrivers', 'recommendedActions'],
        data: {
          compositeScore: risk.compositeScore,
          riskLevel: risk.riskLevel,
          isEmergencyOverride: risk.isEmergencyOverride,
          overrideReason: risk.overrideReason,
          energyScore: risk.pillars.energyRisk.score,
          equipmentScore: risk.pillars.equipmentRisk.score,
          weatherScore: risk.pillars.weatherRisk.score,
          supplyScore: risk.pillars.supplyRisk.score,
          topDrivers: risk.topDrivers,
          recommendedActions: risk.recommendedActions,
        },
      },
    };
  },

  /**
   * Tool: queryFuelOutlook
   */
  async queryFuelOutlook(stationId: string): Promise<ToolResult> {
    const fuel = await fuelForecastingService.forecastFuelDepletion(stationId);
    return {
      toolName: 'queryFuelOutlook',
      evidence: {
        source: 'fuel_forecast',
        timestamp: fuel.forecastedAt,
        fields: ['currentStockLiters', 'dailyBurnRateLiters', 'estimatedDaysRemaining', 'daysToMinimumThreshold', 'resupplyFeasible'],
        data: {
          currentStockLiters: fuel.currentStockLiters,
          dailyBurnRateLiters: fuel.dailyBurnRateLiters,
          estimatedDaysRemaining: fuel.estimatedDaysRemaining,
          estimatedDepletionDate: fuel.estimatedDepletionDate,
          daysToMinimumThreshold: fuel.daysToMinimumThreshold,
          resupplyFeasible: fuel.resupplyFeasible,
          nextResupplyDate: fuel.nextResupplyDate,
        },
      },
    };
  },

  /**
   * Tool: queryEquipmentHealth
   */
  async queryEquipmentHealth(stationId: string, assetId?: string): Promise<ToolResult> {
    if (assetId) {
      const health = await equipmentHealthService.evaluateAssetHealth(assetId);
      return {
        toolName: 'queryEquipmentHealth',
        evidence: {
          source: 'equipment_health',
          timestamp: health.lastEvaluatedAt,
          fields: ['assetName', 'healthScore', 'failureRiskEstimate', 'estimatedRul', 'operatingStressFactors'],
          data: {
            assetId: health.assetId,
            assetName: health.assetName,
            healthScore: health.healthScore,
            failureRiskEstimate: health.failureRiskEstimate,
            estimatedRul: health.estimatedRul,
            operatingStressFactors: health.operatingStressFactors,
          },
        },
      };
    }

    const { data: assets } = await assetsRepository.findAll({ stationId, limit: 20 });
    const summaries = await Promise.all(
      assets.slice(0, 5).map(a => equipmentHealthService.evaluateAssetHealth(a.id).catch(() => null))
    );
    const valid = summaries.filter((s): s is NonNullable<typeof s> => s !== null);

    return {
      toolName: 'queryEquipmentHealth',
      evidence: {
        source: 'equipment_health',
        timestamp: new Date().toISOString(),
        fields: ['stationId', 'totalEquipmentCount', 'criticalAssetsDegraded', 'assets'],
        data: {
          stationId,
          totalEquipmentCount: assets.length,
          criticalAssetsDegraded: valid.filter(s => s.healthScore < 70).length,
          assets: valid.map(s => ({
            assetId: s.assetId,
            assetName: s.assetName,
            healthScore: s.healthScore,
            risk: s.failureRiskEstimate,
          })),
        },
      },
    };
  },

  /**
   * Tool: runWhatIfScenario
   */
  async runWhatIfScenario(
    stationId: string,
    type: string,
    parameters: Record<string, unknown>
  ): Promise<ToolResult> {
    const simResult = await simulationService.quickRunSimulation(stationId, type, parameters);
    return {
      toolName: 'runWhatIfScenario',
      evidence: {
        source: 'simulation_result',
        timestamp: simResult.executedAt,
        fields: ['summary', 'impactScore', 'deltas', 'recommendations'],
        data: {
          summary: simResult.summary,
          impactScore: simResult.impactScore,
          deltas: simResult.deltas,
          recommendations: simResult.recommendations,
          mitigations: simResult.mitigations,
        },
      },
    };
  },

  /**
   * Tool: queryActiveIncidents
   */
  async queryActiveIncidents(stationId: string): Promise<ToolResult> {
    const incidents = await incidentsService.listIncidents({ stationId, status: 'OPEN' as any, page: 1, limit: 10 });
    return {
      toolName: 'queryActiveIncidents',
      evidence: {
        source: 'active_incidents',
        timestamp: new Date().toISOString(),
        fields: ['openIncidentCount', 'incidents'],
        data: {
          openIncidentCount: incidents.total,
          incidents: incidents.data.map(inc => ({
            id: inc.id,
            title: inc.title,
            severity: inc.severity,
            status: inc.status,
            remediationSteps: inc.remediationSteps,
          })),
        },
      },
    };
  },

  /**
   * Tool: queryWeather
   */
  async queryWeather(stationId: string): Promise<ToolResult> {
    const weather = await weatherService.getCurrentWeather(stationId);
    const recordedAt = weather.recordedAt instanceof Date ? weather.recordedAt.toISOString() : String(weather.recordedAt);
    const stormSeverityIndex = (weather as any).stormSeverityIndex ?? ((weather.windSpeed > 25 || weather.temperature < -30) ? 65 : 20);
    const isBlizzardWarning = (weather as any).isBlizzardWarning ?? (weather.windSpeed > 30 && weather.visibilityMeters < 500);

    return {
      toolName: 'queryWeather',
      evidence: {
        source: 'weather',
        timestamp: recordedAt,
        fields: ['temperature', 'windSpeed', 'windChill', 'condition', 'stormSeverityIndex', 'isBlizzardWarning'],
        data: {
          temperature: weather.temperature,
          windSpeed: weather.windSpeed,
          windChill: weather.windChill,
          condition: weather.condition,
          stormSeverityIndex,
          isBlizzardWarning,
        },
      },
    };
  },
};
