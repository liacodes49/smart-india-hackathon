// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Assistant Provider Abstraction
// ═══════════════════════════════════════════════════════════════
// Pluggable provider interface allowing local deterministic decision-support
// synthesis or drop-in cloud LLM integrations without changing domain logic.
// ═══════════════════════════════════════════════════════════════

import type { ToolResult } from './assistant.tools.js';

export interface AssistantSynthesisResult {
  answer: string;
  suggestedActions: string[];
}

export interface IAssistantProvider {
  synthesizeAnswer(
    message: string,
    stationId: string,
    evidence: ToolResult[]
  ): Promise<AssistantSynthesisResult>;
}

export class PolarOperationsAssistantProvider implements IAssistantProvider {
  async synthesizeAnswer(
    _message: string,
    _stationId: string,
    evidence: ToolResult[]
  ): Promise<AssistantSynthesisResult> {
    if (!evidence || evidence.length === 0) {
      return {
        answer: 'I cannot determine that from the available station data. No matching telemetry, risk, or inventory evidence could be resolved for this station.',
        suggestedActions: [
          'Verify that station sensors and telemetry collectors are online',
          'Inspect the station dashboard for connection status',
        ],
      };
    }

    const actions: string[] = [];
    const responseParagraphs: string[] = [];

    // Synthesize based on retrieved evidence sources
    for (const item of evidence) {
      const { source, data } = item.evidence;

      if (source === 'station_health') {
        responseParagraphs.push(
          `**Station Risk Assessment**: Current composite risk score is **${data.compositeScore}/100** (${data.riskLevel}). ` +
          `Individual pillar breakdown: Energy **${data.energyScore}/100**, Equipment **${data.equipmentScore}/100**, Weather **${data.weatherScore}/100**, Supply **${data.supplyScore}/100**.`
        );
        if (data.isEmergencyOverride) {
          responseParagraphs.push(`⚠️ **Emergency Override Active**: ${data.overrideReason}`);
        }
        if (Array.isArray(data.recommendedActions) && data.recommendedActions.length > 0) {
          actions.push(...data.recommendedActions);
        }
      }

      if (source === 'fuel_forecast') {
        const fuel = data as {
          currentStockLiters?: number;
          dailyBurnRateLiters?: number;
          estimatedDaysRemaining?: number;
          estimatedDepletionDate?: string;
          daysToMinimumThreshold?: number;
          resupplyFeasible?: boolean;
        };
        const stockLiters = Number(fuel.currentStockLiters ?? 0);
        responseParagraphs.push(
          `**Fuel Autonomy Outlook**: Current stock is **${stockLiters.toLocaleString()} Liters** burning at **${fuel.dailyBurnRateLiters ?? 0} L/day**. ` +
          `Estimated remaining duration: **${fuel.estimatedDaysRemaining ?? 0} days** (Depletion target: ${fuel.estimatedDepletionDate ? new Date(fuel.estimatedDepletionDate).toLocaleDateString() : 'N/A'}). ` +
          `Reserve threshold breach in **${fuel.daysToMinimumThreshold ?? 0} days**.`
        );
        if (fuel.resupplyFeasible === false) {
          responseParagraphs.push('⚠️ **Resupply Alert**: Projected depletion date precedes the scheduled summer resupply vessel arrival.');
          actions.push('Institute non-essential power rationing to extend fuel autonomy');
        }
      }

      if (source === 'weather') {
        responseParagraphs.push(
          `**Environmental Context**: Ambient temperature is **${data.temperature}°C** (Wind Chill: **${data.windChill}°C**) with **${data.windSpeed} km/h** winds (${data.condition}). ` +
          `Storm severity index: **${data.stormSeverityIndex}/100**.`
        );
        if (data.isBlizzardWarning) {
          responseParagraphs.push('⚠️ **Blizzard Warning Active**: Outdoor travel is prohibited (Condition Red).');
          actions.push('Enforce Station Condition Red and seal HVAC external ventilation dampers');
        }
      }

      if (source === 'active_incidents') {
        responseParagraphs.push(
          `**Active Operational Incidents**: **${data.openIncidentCount}** open incident(s) currently registered.`
        );
        if (Array.isArray(data.incidents) && data.incidents.length > 0) {
          const incList = data.incidents.map((i: any) => `• [${i.severity}] ${i.title}`).join('\n');
          responseParagraphs.push(incList);
          actions.push('Review unresolved incidents in the Incident Management queue');
        }
      }

      if (source === 'simulation_result') {
        const deltas = (data.deltas as any) ?? {};
        responseParagraphs.push(
          `**What-If Contingency Projection**: ${data.summary} ` +
          `Projected Impact Score: **${data.impactScore}/100**.`
        );
        if (deltas.powerDemandKw) {
          responseParagraphs.push(
            `Projected Power Demand: ${deltas.powerDemandKw.projected} kW (Delta: ${deltas.powerDemandKw.delta > 0 ? '+' : ''}${deltas.powerDemandKw.delta} kW). ` +
            `Surviving Generation: ${deltas.generationCapacityKw?.projected} kW.`
          );
        }
        if (Array.isArray(data.recommendations) && data.recommendations.length > 0) {
          actions.push(...data.recommendations);
        }
      }

      if (source === 'equipment_health') {
        if (data.assetName) {
          responseParagraphs.push(
            `**Equipment Health for ${data.assetName}**: Health Score **${data.healthScore}/100**, Risk: **${data.failureRiskEstimate}**. ` +
            `Estimated RUL: **${(data.estimatedRul as any)?.estimatedDays} days** (Confidence: ${Math.round(((data.estimatedRul as any)?.confidence ?? 0.8) * 100)}%).`
          );
        } else {
          responseParagraphs.push(
            `**Station Equipment Overview**: Monitoring **${data.totalEquipmentCount}** total physical assets. ` +
            `Critical assets in degraded state: **${data.criticalAssetsDegraded}**.`
          );
        }
      }
    }

    // Default recommendation if none collected
    if (actions.length === 0) {
      actions.push('Continue continuous telemetry monitoring under standard operational protocols');
    }

    return {
      answer: responseParagraphs.join('\n\n'),
      suggestedActions: Array.from(new Set(actions)),
    };
  }
}

export const defaultAssistantProvider = new PolarOperationsAssistantProvider();
