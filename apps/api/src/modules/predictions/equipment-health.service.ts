// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Equipment Health & Failure Risk Engine
// ═══════════════════════════════════════════════════════════════
// Deterministic physics & statistical degradation engine for mission-critical
// Antarctic assets (generators, HVAC, pumps, life support).
// Adheres strictly to scientific guardrails:
// 1. Uses "Estimated Remaining Useful Life" (Estimated RUL) with ranges & confidence.
// 2. Uses "Failure Risk Estimate" (distinct from calibrated failure probability).
// 3. Generates Maintenance Recommendations (status: RECOMMENDED) requiring operator review.
// 4. Exposes top contributing sensor signals and operating stress factors.
// ═══════════════════════════════════════════════════════════════

import {
  EventType,
  createDomainEvent,
  RiskLevel,
  SensorStatus,
  SensorType,
  AssetCategory,
  PredictionType,
  MaintenancePriority,
  type EquipmentHealthSummary,
  type EstimatedRul,
  type ContributingSignal,
} from '@repo/shared';
import { eventBus } from '../../lib/event-bus.js';
import { assetsRepository } from '../assets/assets.repository.js';
import { sensorsRepository } from '../sensors/sensors.repository.js';
import { telemetryRepository } from '../telemetry/telemetry.repository.js';
import { predictionsRepository } from './predictions.repository.js';
import { anomalyService } from './anomaly.service.js';
import { maintenanceService } from '../maintenance/maintenance.service.js';

export const EQUIPMENT_PROTOTYPE_ASSUMPTIONS = [
  'PROTOTYPE_ASSUMPTION: Asset health index is computed via a multi-sensor penalty model normalized to 0–100.',
  'PROTOTYPE_ASSUMPTION: Estimated RUL is derived from current operating stress and baseline degradation rates, not a multi-year fleet failure dataset.',
  'PROTOTYPE_ASSUMPTION: Failure Risk Estimate reflects current stress state relative to critical thresholds, not an empirically calibrated probability.',
  'PROTOTYPE_ASSUMPTION: Baseline operating temperature for station generators is assumed at 80°C, and vibration baseline at 1.8 mm/s.',
];

export class EquipmentHealthService {
  /**
   * Evaluate health, anomaly state, failure risk, and estimated RUL for an asset
   */
  async evaluateAssetHealth(assetId: string): Promise<EquipmentHealthSummary> {
    const asset = await assetsRepository.findById(assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    // Retrieve all sensors mounted on this asset
    const sensors = await sensorsRepository.findByAssetId(assetId);

    const contributingSignals: ContributingSignal[] = [];
    const operatingStressFactors: string[] = [];

    let thermalPenalty = 0;
    let vibrationPenalty = 0;
    let loadPenalty = 0;
    let maxAnomalyScore = 0;

    for (const sensor of sensors) {
      // Fetch recent 24-hour telemetry window for rolling stats
      const { data: recentReadings } = await telemetryRepository.findAll({
        sensorId: sensor.id,
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        limit: 100,
      });

      const values = recentReadings.map((r) => r.value);
      const currentValue = sensor.lastReading ?? (values.length > 0 ? values[values.length - 1]! : 0);

      // Evaluate statistical anomaly
      const anomalyResult = anomalyService.evaluateReading(currentValue, values);
      if (anomalyResult.anomalyScore > maxAnomalyScore) {
        maxAnomalyScore = anomalyResult.anomalyScore;
      }

      // Domain physics evaluation based on sensor type
      if (sensor.type === SensorType.TEMPERATURE) {
        const baseline = 80.0; // Normal coolant temperature °C
        const deviationPercent = Math.round(((currentValue - baseline) / baseline) * 100);

        if (currentValue > 95) {
          thermalPenalty = Math.max(thermalPenalty, 100);
          operatingStressFactors.push(
            `Severe thermal stress: coolant temperature ${currentValue}°C exceeds 95°C threshold`
          );
        } else if (currentValue > 85) {
          thermalPenalty = Math.max(thermalPenalty, ((currentValue - 85) / 10) * 80);
          operatingStressFactors.push(
            `Elevated operating temperature: coolant temperature ${currentValue}°C (baseline ${baseline}°C)`
          );
        }

        contributingSignals.push({
          sensorId: sensor.id,
          sensorName: sensor.name,
          sensorType: sensor.type as unknown as SensorType,
          currentValue,
          unit: sensor.unit,
          baseline,
          deviationPercent,
          stressWeight: 0.4,
        });
      } else if (sensor.type === SensorType.VIBRATION) {
        const baseline = 1.8; // Normal generator vibration in mm/s
        const deviationPercent = Math.round(((currentValue - baseline) / baseline) * 100);

        if (currentValue > 4.5) {
          vibrationPenalty = Math.max(vibrationPenalty, 100);
          operatingStressFactors.push(
            `Excessive mechanical vibration: ${currentValue} mm/s indicates severe bearing wear or misalignment`
          );
        } else if (currentValue > 2.8) {
          vibrationPenalty = Math.max(vibrationPenalty, ((currentValue - 2.8) / 1.7) * 75);
          operatingStressFactors.push(
            `Vibration drift detected: ${currentValue} mm/s (baseline ${baseline} mm/s)`
          );
        }

        contributingSignals.push({
          sensorId: sensor.id,
          sensorName: sensor.name,
          sensorType: sensor.type as unknown as SensorType,
          currentValue,
          unit: sensor.unit,
          baseline,
          deviationPercent,
          stressWeight: 0.35,
        });
      } else if (sensor.type === SensorType.POWER) {
        const baseline = 65.0; // Normal load %
        const deviationPercent = Math.round(((currentValue - baseline) / baseline) * 100);

        if (currentValue > 90) {
          loadPenalty = Math.max(loadPenalty, 85);
          operatingStressFactors.push(
            `Heavy electrical loading: sustained output at ${currentValue}%`
          );
        } else if (currentValue > 80) {
          loadPenalty = Math.max(loadPenalty, 40);
        }

        contributingSignals.push({
          sensorId: sensor.id,
          sensorName: sensor.name,
          sensorType: sensor.type as unknown as SensorType,
          currentValue,
          unit: sensor.unit,
          baseline,
          deviationPercent,
          stressWeight: 0.25,
        });
      }
    }

    // Compute composite health score (0–100 scale)
    const compositePenalty =
      thermalPenalty * 0.4 + vibrationPenalty * 0.35 + loadPenalty * 0.25;
    const rawHealth = 100 - compositePenalty;
    const healthScore = Math.round(Math.max(0, Math.min(100, rawHealth)));

    // Determine Failure Risk Estimate (distinct from calibrated probability)
    let failureRiskEstimate: RiskLevel = RiskLevel.LOW;
    if (healthScore < 50) {
      failureRiskEstimate = RiskLevel.CRITICAL;
    } else if (healthScore < 70) {
      failureRiskEstimate = RiskLevel.HIGH;
    } else if (healthScore < 85) {
      failureRiskEstimate = RiskLevel.MEDIUM;
    }

    // Determine Estimated Remaining Useful Life (Estimated RUL)
    const estimatedRul = this.calculateEstimatedRul(healthScore);

    // Map sensor status
    let status: SensorStatus = SensorStatus.NORMAL;
    if (failureRiskEstimate === RiskLevel.CRITICAL) {
      status = SensorStatus.CRITICAL;
    } else if (failureRiskEstimate === RiskLevel.HIGH || failureRiskEstimate === RiskLevel.MEDIUM) {
      status = SensorStatus.WARNING;
    }

    const summary: EquipmentHealthSummary = {
      assetId,
      assetName: asset.name,
      stationId: asset.stationId,
      category: asset.category as unknown as AssetCategory,
      healthScore,
      anomalyScore: Math.round(maxAnomalyScore),
      failureRiskEstimate,
      estimatedRul,
      status,
      topContributingSignals: contributingSignals.sort(
        (a, b) => Math.abs(b.deviationPercent) - Math.abs(a.deviationPercent)
      ),
      operatingStressFactors,
      assumptions: EQUIPMENT_PROTOTYPE_ASSUMPTIONS,
      lastEvaluatedAt: new Date().toISOString(),
    };

    // Save prediction record to DB
    await predictionsRepository.create({
      stationId: asset.stationId,
      assetId,
      type: PredictionType.FAILURE_PREDICTION,
      title: `Health Assessment: ${asset.name}`,
      description: `Health score ${healthScore}/100. Failure Risk Estimate: ${failureRiskEstimate}. Estimated RUL: ~${estimatedRul.estimateHours}h (${estimatedRul.minHours}–${estimatedRul.maxHours}h).`,
      confidence: estimatedRul.confidence,
      predictedValue: healthScore,
      predictedAt: new Date(),
      horizon: '24h',
      metadata: {
        healthScore,
        failureRiskEstimate,
        estimatedRul,
        operatingStressFactors,
        assumptions: EQUIPMENT_PROTOTYPE_ASSUMPTIONS,
      },
    });

    // Workflow guardrail: Trigger Maintenance Recommendation if health drops below 70%
    if (healthScore < 70) {
      const priority =
        healthScore < 50 ? MaintenancePriority.CRITICAL : MaintenancePriority.HIGH;

      await maintenanceService.createRecommendation({
        stationId: asset.stationId,
        assetId,
        title: `Inspect ${asset.name} (${failureRiskEstimate} Risk)`,
        description: `Automated prediction detected asset health degradation to ${healthScore}/100 with estimated RUL ~${estimatedRul.estimateHours}h. Stress factors: ${operatingStressFactors.join('; ')}`,
        priority,
        suggestedAction:
          healthScore < 50
            ? 'Emergency maintenance overhaul required before polar storm'
            : 'Schedule preventative diagnostic and sensor recalibration',
        notes: `Top contributing signals: ${contributingSignals.map((s) => `${s.sensorName}=${s.currentValue}${s.unit}`).join(', ')}`,
      });

      eventBus.publish(
        createDomainEvent({
          eventType: EventType.EQUIPMENT_HEALTH_DEGRADED,
          source: 'equipment-health-service',
          stationId: asset.stationId,
          entityId: assetId,
          payload: summary,
        })
      );

      eventBus.publish(
        createDomainEvent({
          eventType: EventType.FAILURE_RISK_ELEVATED,
          source: 'equipment-health-service',
          stationId: asset.stationId,
          entityId: assetId,
          payload: { assetId, failureRiskEstimate, healthScore },
        })
      );
    }

    return summary;
  }

  /**
   * Calculate Estimated Remaining Useful Life (Estimated RUL) with uncertainty bounds
   */
  private calculateEstimatedRul(healthScore: number): EstimatedRul {
    if (healthScore >= 85) {
      return {
        estimateHours: 2500,
        minHours: 2000,
        maxHours: 3200,
        confidence: 0.85,
        degradationTrend: 'STABLE',
      };
    }

    if (healthScore >= 70) {
      return {
        estimateHours: 1200,
        minHours: 900,
        maxHours: 1600,
        confidence: 0.75,
        degradationTrend: 'DEGRADING',
      };
    }

    if (healthScore >= 50) {
      return {
        estimateHours: 380,
        minHours: 200,
        maxHours: 550,
        confidence: 0.68,
        degradationTrend: 'RAPID_DEGRADATION',
      };
    }

    // Critical failure imminent
    return {
      estimateHours: 72,
      minHours: 24,
      maxHours: 140,
      confidence: 0.8,
      degradationTrend: 'RAPID_DEGRADATION',
    };
  }
}

export const equipmentHealthService = new EquipmentHealthService();
