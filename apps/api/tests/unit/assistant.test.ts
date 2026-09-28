// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Grounded AI Assistant Unit Tests
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assistantService } from '../../src/modules/assistant/assistant.service.js';
import { assistantTools } from '../../src/modules/assistant/assistant.tools.js';
import { stationsRepository } from '../../src/modules/stations/stations.repository.js';
import { RiskLevel } from '@repo/shared';

describe('AI Assistant — Intent Routing & Evidence Grounding', () => {
  const stationId = '00000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(stationsRepository, 'findById').mockResolvedValue({
      id: stationId,
      stationId: 'MAITRI',
      name: 'Maitri Station',
      latitude: -70.767,
      longitude: 11.733,
      altitude: 117,
      status: 'OPERATIONAL',
      timezone: 'UTC+5:30',
      description: 'Maitri',
      imageUrl: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.spyOn(assistantTools, 'queryStationRisk').mockResolvedValue({
      toolName: 'queryStationRisk',
      evidence: {
        source: 'station_health',
        timestamp: new Date().toISOString(),
        fields: ['compositeScore', 'riskLevel', 'energyScore'],
        data: {
          compositeScore: 45,
          riskLevel: RiskLevel.MEDIUM,
          energyScore: 35,
          equipmentScore: 50,
          weatherScore: 40,
          supplyScore: 20,
          isEmergencyOverride: false,
          topDrivers: [],
          recommendedActions: ['Service backup generator air filter'],
        },
      },
    });

    vi.spyOn(assistantTools, 'queryFuelOutlook').mockResolvedValue({
      toolName: 'queryFuelOutlook',
      evidence: {
        source: 'fuel_forecast',
        timestamp: new Date().toISOString(),
        fields: ['currentStockLiters', 'dailyBurnRateLiters', 'estimatedDaysRemaining'],
        data: {
          currentStockLiters: 42000,
          dailyBurnRateLiters: 650,
          estimatedDaysRemaining: 64.6,
          estimatedDepletionDate: '2026-11-20T00:00:00Z',
          daysToMinimumThreshold: 49.2,
          resupplyFeasible: true,
        },
      },
    });

    vi.spyOn(assistantTools, 'runWhatIfScenario').mockResolvedValue({
      toolName: 'runWhatIfScenario',
      evidence: {
        source: 'simulation_result',
        timestamp: new Date().toISOString(),
        fields: ['summary', 'impactScore', 'deltas'],
        data: {
          summary: 'Generator trip simulated',
          impactScore: 82,
          deltas: {
            powerDemandKw: { baseline: 135, projected: 135, delta: 0, unit: 'kW' },
            generationCapacityKw: { baseline: 125, projected: 62.5, delta: -62.5, unit: 'kW' },
          },
          recommendations: ['Shed Tier-3 science equipment'],
        },
      },
    });
  });

  it('routes fuel queries to queryFuelOutlook and returns structured evidence', async () => {
    const response = await assistantService.processInquiry({
      message: 'How long will station diesel fuel last at Maitri?',
      stationId,
    });

    expect(response.groundingStatus).toBe('GROUNDED');
    expect(response.toolsInvoked).toContain('queryFuelOutlook');
    expect(response.evidence).toHaveLength(1);
    expect(response.evidence[0].source).toBe('fuel_forecast');
    expect(response.answer).toContain('42,000 Liters');
    expect(response.answer).toContain('64.6 days');
  });

  it('routes risk queries to queryStationRisk and details pillar scores', async () => {
    const response = await assistantService.processInquiry({
      message: 'Why is Maitri station currently at risk?',
      stationId,
    });

    expect(response.groundingStatus).toBe('GROUNDED');
    expect(response.toolsInvoked).toContain('queryStationRisk');
    expect(response.evidence[0].source).toBe('station_health');
    expect(response.answer).toContain('45/100');
    expect(response.answer).toContain('MEDIUM');
    expect(response.suggestedActions).toContain('Service backup generator air filter');
  });

  it('routes what-if inquiries to runWhatIfScenario and cites projected deltas', async () => {
    const response = await assistantService.processInquiry({
      message: 'What if Generator 2 fails during blizzard?',
      stationId,
    });

    expect(response.groundingStatus).toBe('GROUNDED');
    expect(response.toolsInvoked).toContain('runWhatIfScenario');
    expect(response.evidence[0].source).toBe('simulation_result');
    expect(response.answer).toContain('82/100');
    expect(response.answer).toContain('62.5 kW');
  });

  it('returns explicit "cannot determine" message when station cannot be resolved', async () => {
    vi.spyOn(stationsRepository, 'findById').mockResolvedValue(null);

    const response = await assistantService.processInquiry({
      message: 'What is the fuel level?',
      stationId: '99999999-9999-9999-9999-999999999999',
    });

    expect(response.groundingStatus).toBe('INSUFFICIENT_DATA');
    expect(response.answer).toContain('I cannot determine that from the available station data');
    expect(response.evidence).toHaveLength(0);
  });
});
