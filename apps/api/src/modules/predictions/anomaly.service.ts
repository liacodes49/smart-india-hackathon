// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Statistical Anomaly Detection Engine
// ═══════════════════════════════════════════════════════════════
// Explainable Z-score anomaly detector operating over sliding-window
// sensor telemetry buffers. Adheres to scientific guardrail of avoiding
// fake precision by exposing calculation basis, standard deviation,
// and confidence metrics.
// ═══════════════════════════════════════════════════════════════

export interface AnomalyEvaluationResult {
  isAnomaly: boolean;
  zScore: number;
  anomalyScore: number; // 0–100 normalized score
  baselineMean: number;
  baselineStdDev: number;
  sampleCount: number;
  confidence: number;
  calculationBasis: string;
}

export class AnomalyService {
  /**
   * Evaluate a reading against a sliding window of previous readings
   * using standard Z-score statistical evaluation:
   * Z = |x - mean| / stdDev
   */
  evaluateReading(
    currentValue: number,
    windowReadings: number[]
  ): AnomalyEvaluationResult {
    if (windowReadings.length < 3) {
      return {
        isAnomaly: false,
        zScore: 0,
        anomalyScore: 0,
        baselineMean: currentValue,
        baselineStdDev: 0,
        sampleCount: windowReadings.length,
        confidence: 0.3, // Low confidence due to sparse sample window
        calculationBasis:
          'PROTOTYPE_ASSUMPTION: Insufficient sample points (< 3) to compute statistically significant Z-score.',
      };
    }

    const n = windowReadings.length;
    const mean = windowReadings.reduce((sum, val) => sum + val, 0) / n;

    const variance =
      windowReadings.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Safeguard against zero variance in perfectly flat simulated data
    if (stdDev < 1e-6) {
      const diff = Math.abs(currentValue - mean);
      const isAnomaly = diff > 0.1 * Math.abs(mean || 1);
      return {
        isAnomaly,
        zScore: isAnomaly ? 3.5 : 0,
        anomalyScore: isAnomaly ? 75 : 0,
        baselineMean: Math.round(mean * 100) / 100,
        baselineStdDev: 0,
        sampleCount: n,
        confidence: 0.5,
        calculationBasis:
          'PROTOTYPE_ASSUMPTION: Sensor baseline had near-zero variance; evaluated as relative percentage step change.',
      };
    }

    const zScore = Math.abs(currentValue - mean) / stdDev;
    const roundedZ = Math.round(zScore * 100) / 100;

    // Normalization mapping from Z-score to 0–100 scale:
    // Z <= 1.0 -> 0–20 (Normal operational variance)
    // 1.0 < Z <= 2.0 -> 20–50 (Moderate drift)
    // 2.0 < Z <= 3.0 -> 50–80 (Significant warning anomaly)
    // Z > 3.0 -> 80–100 (Severe statistical outlier > 3-sigma)
    let anomalyScore = 0;
    if (zScore <= 1.0) {
      anomalyScore = (zScore / 1.0) * 20;
    } else if (zScore <= 2.0) {
      anomalyScore = 20 + ((zScore - 1.0) / 1.0) * 30;
    } else if (zScore <= 3.0) {
      anomalyScore = 50 + ((zScore - 2.0) / 1.0) * 30;
    } else {
      anomalyScore = Math.min(100, 80 + ((zScore - 3.0) / 2.0) * 20);
    }

    const isAnomaly = zScore >= 2.5;
    // Statistical confidence increases with sample window size (max 95%)
    const sampleConfidence = Math.min(0.95, 0.5 + (n / 100) * 0.45);

    return {
      isAnomaly,
      zScore: roundedZ,
      anomalyScore: Math.round(anomalyScore),
      baselineMean: Math.round(mean * 100) / 100,
      baselineStdDev: Math.round(stdDev * 100) / 100,
      sampleCount: n,
      confidence: Math.round(sampleConfidence * 100) / 100,
      calculationBasis: `Standard Z-score statistical evaluation (Z=${roundedZ}, N=${n} readings over 24h window).`,
    };
  }
}

export const anomalyService = new AnomalyService();
