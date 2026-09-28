// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — AI Operations Assistant Service
// ═══════════════════════════════════════════════════════════════
// Grounded decision-support coordinator.
// Enforces:
// 1. Tool execution exclusively through approved backend services.
// 2. Structured evidence attribution (provenance, timestamps, fields).
// 3. Zero direct database access.
// ═══════════════════════════════════════════════════════════════

import type {
  AssistantQueryRequest,
  AssistantQueryResponse,
  AssistantEvidence,
} from '@repo/shared';
import { stationsRepository } from '../stations/stations.repository.js';
import { assistantTools, type ToolResult } from './assistant.tools.js';
import {
  defaultAssistantProvider,
  type IAssistantProvider,
} from './assistant.provider.js';
import { logger } from '../../config/logger.js';

export class AssistantService {
  constructor(private provider: IAssistantProvider = defaultAssistantProvider) {}

  /**
   * Process a natural language operational inquiry with verified evidence retrieval
   */
  async processInquiry(request: AssistantQueryRequest): Promise<AssistantQueryResponse> {
    const message = request.message || (request as any).query || '';
    const lower = message.toLowerCase();

    // 1. Resolve target station
    let stationId = request.stationId;
    if (!stationId) {
      if (lower.includes('bharati')) {
        const bharati = await stationsRepository.findById('BHARATI');
        stationId = bharati?.id;
      } else {
        const maitri = await stationsRepository.findById('MAITRI');
        stationId = maitri?.id;
      }
    }

    if (!stationId) {
      return {
        answer: 'I cannot determine that from the available station data. Please specify an Antarctic research station (e.g., Maitri or Bharati).',
        evidence: [],
        toolsInvoked: [],
        suggestedActions: ['Specify stationId or mention Maitri/Bharati in your request'],
        groundingStatus: 'INSUFFICIENT_DATA',
      };
    }

    const station = await stationsRepository.findById(stationId);
    if (!station) {
      return {
        answer: 'I cannot determine that from the available station data. The requested station could not be found.',
        evidence: [],
        toolsInvoked: [],
        suggestedActions: ['Verify that the station ID or code is valid'],
        groundingStatus: 'INSUFFICIENT_DATA',
      };
    }

    // 2. Intent Routing & Approved Tool Dispatching
    const toolsToInvoke: Array<() => Promise<ToolResult>> = [];
    const toolsInvokedNames: string[] = [];

    const isFuelQuery = lower.includes('fuel') || lower.includes('diesel') || lower.includes('burn') || lower.includes('deplet') || lower.includes('autonomy');
    const isRiskQuery = lower.includes('risk') || lower.includes('health') || lower.includes('status') || lower.includes('why is') || lower.includes('condition');
    const isWeatherQuery = lower.includes('weather') || lower.includes('blizzard') || lower.includes('wind') || lower.includes('temp') || lower.includes('storm') || lower.includes('cold');
    const isIncidentQuery = lower.includes('incident') || lower.includes('alert') || lower.includes('ticket') || lower.includes('issue') || lower.includes('problem') || lower.includes('unresolved');
    const isEquipmentQuery = lower.includes('equipment') || lower.includes('generator') || lower.includes('rul') || lower.includes('degrad') || lower.includes('hvac');
    const isSimulationQuery = lower.includes('what if') || lower.includes('simulate') || lower.includes('contingency') || lower.includes('fails') || lower.includes('trip');

    if (isSimulationQuery) {
      // Route to simulation quick-run tool
      toolsToInvoke.push(() =>
        assistantTools.runWhatIfScenario(stationId!, 'POWER_FAILURE', { offlineGeneratorCount: 1 })
      );
      toolsInvokedNames.push('runWhatIfScenario');
    } else {
      if (isFuelQuery) {
        toolsToInvoke.push(() => assistantTools.queryFuelOutlook(stationId!));
        toolsInvokedNames.push('queryFuelOutlook');
      }

      if (isRiskQuery) {
        toolsToInvoke.push(() => assistantTools.queryStationRisk(stationId!));
        toolsInvokedNames.push('queryStationRisk');
      }

      if (isWeatherQuery) {
        toolsToInvoke.push(() => assistantTools.queryWeather(stationId!));
        toolsInvokedNames.push('queryWeather');
      }

      if (isIncidentQuery) {
        toolsToInvoke.push(() => assistantTools.queryActiveIncidents(stationId!));
        toolsInvokedNames.push('queryActiveIncidents');
      }

      if (isEquipmentQuery) {
        toolsToInvoke.push(() => assistantTools.queryEquipmentHealth(stationId!));
        toolsInvokedNames.push('queryEquipmentHealth');
      }
    }

    // Default fallback: if query did not match specific keywords, pull risk and active incidents for situational awareness
    if (toolsToInvoke.length === 0) {
      toolsToInvoke.push(() => assistantTools.queryStationRisk(stationId!));
      toolsInvokedNames.push('queryStationRisk');
      toolsToInvoke.push(() => assistantTools.queryActiveIncidents(stationId!));
      toolsInvokedNames.push('queryActiveIncidents');
    }

    // 3. Execute approved backend tools in parallel with fault tolerance
    const toolResults: ToolResult[] = [];
    const settlements = await Promise.allSettled(toolsToInvoke.map(fn => fn()));
    for (const res of settlements) {
      if (res.status === 'fulfilled') {
        toolResults.push(res.value);
      } else {
        logger.warn('Assistant tool execution failed:', res.reason);
      }
    }

    // 4. Synthesize answer through provider abstraction
    const synthesis = await this.provider.synthesizeAnswer(message, stationId, toolResults);

    // 5. Build structured evidence array
    const evidence: AssistantEvidence[] = toolResults.map(tr => tr.evidence);

    return {
      answer: synthesis.answer,
      evidence,
      toolsInvoked: toolsInvokedNames,
      suggestedActions: synthesis.suggestedActions,
      groundingStatus: evidence.length > 0 ? 'GROUNDED' : 'INSUFFICIENT_DATA',
    };
  }
}

export const assistantService = new AssistantService();
