// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Risk Schemas
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';

export const riskWeightsSchema = z.object({
  energyWeight: z.number().min(0).max(1).default(0.35),
  equipmentWeight: z.number().min(0).max(1).default(0.25),
  weatherWeight: z.number().min(0).max(1).default(0.25),
  supplyWeight: z.number().min(0).max(1).default(0.15),
});
export type RiskWeightsInput = z.infer<typeof riskWeightsSchema>;

export const stationRiskQuerySchema = z.object({
  includeBreakdown: z.coerce.boolean().default(true),
  weights: riskWeightsSchema.optional(),
});
export type StationRiskQueryInput = z.infer<typeof stationRiskQuerySchema>;
