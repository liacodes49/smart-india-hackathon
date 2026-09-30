import type { Request, Response } from 'express';
import { telemetryService } from './telemetry.service.js';
import { telemetrySimulator, SimulationScenario } from '../../services/telemetry/simulator.js';
import { logger } from '../../config/logger.js';
import { formatResponse, formatError } from '../../utils/index.js';
import { eventBus } from '../../lib/event-bus.js';

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? '';
  return param ?? '';
}

export const telemetryController = {
  stream: (req: Request, res: Response) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    logger.info(`[SSE] Client connected: ${req.ip}`);

    // Send initial connection heartbeat
    res.write('event: ping\ndata: connected\n\n');

    // Set of domain event types forwarded to connected clients
    const sseEventTypes = new Set([
      'TELEMETRY_READING_RECORDED',
      'TELEMETRY_BATCH_RECORDED',
      'alert.triggered',
      'alert.acknowledged',
      'alert.resolved',
      'alert.escalated',
      'ALERT_TRIGGERED',
      'ALERT_ACKNOWLEDGED',
      'ALERT_RESOLVED',
      'ALERT_ESCALATED',
      'maintenance.recommended',
      'maintenance.scheduled',
      'maintenance.completed',
      'maintenance.updated',
      'MAINTENANCE_RECOMMENDED',
      'MAINTENANCE_SCHEDULED',
      'MAINTENANCE_COMPLETED',
      'MAINTENANCE_UPDATED',
      'equipment.health_degraded',
      'EQUIPMENT_HEALTH_DEGRADED',
      'risk.score_updated',
      'RISK_SCORE_UPDATED',
      'incident.reported',
      'INCIDENT_REPORTED',
      'weather.observation_recorded',
      'WEATHER_OBSERVATION_RECORDED',
    ]);

    // Keep-alive heartbeat interval every 20 seconds
    const heartbeatTimer = setInterval(() => {
      try {
        res.write(': keep-alive\n\n');
      } catch {
        // Ignored if socket closed
      }
    }, 20000);

    // Subscribe to mission-critical events
    const unsubscribe = eventBus.subscribeAll((event) => {
      if (sseEventTypes.has(event.eventType)) {
        const normalizedType = event.eventType.includes('.')
          ? event.eventType.toUpperCase().replace(/\./g, '_')
          : event.eventType;

        const payload = {
          eventType: event.eventType,
          stationId: event.stationId,
          entityId: event.entityId,
          occurredAt: event.occurredAt,
          data: event.payload,
        };

        try {
          res.write(`event: ${normalizedType}\n`);
          res.write(`data: ${JSON.stringify(payload)}\n\n`);

          if (normalizedType !== event.eventType) {
            res.write(`event: ${event.eventType}\n`);
            res.write(`data: ${JSON.stringify(payload)}\n\n`);
          }
        } catch (err) {
          logger.warn('[SSE] Failed to write event to client:', err);
        }
      }
    });

    // Cleanup on disconnect
    req.on('close', () => {
      clearInterval(heartbeatTimer);
      logger.info(`[SSE] Client disconnected: ${req.ip}`);
      unsubscribe();
    });
  },

  list: async (req: Request, res: Response) => {
    try {
      const { stationId, sensorId, assetId, startDate, endDate, status, order, page, limit } = req.query;
      const result = await telemetryService.getTelemetry({
        stationId: stationId as string | undefined,
        sensorId: sensorId as string | undefined,
        assetId: assetId as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        status: status as any,
        order: order === 'asc' ? 'asc' : 'desc',
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 50,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: {
          page: page ? Number(page) : 1,
          limit: limit ? Number(limit) : 50,
          total: result.total,
          totalPages: Math.ceil(result.total / (limit ? Number(limit) : 50)),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Telemetry list error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch telemetry'));
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const reading = await telemetryService.getTelemetryById(id);
      if (!reading) {
        res.status(404).json(formatError('NOT_FOUND', `Telemetry reading '${id}' not found`));
        return;
      }
      res.json(formatResponse(reading));
    } catch (error) {
      logger.error('Telemetry get error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch telemetry reading'));
    }
  },

  ingest: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const result = await telemetryService.ingestReading(req.body, userId);

      const status = result.isDuplicate ? 200 : 201;
      const message = result.isDuplicate
        ? 'Duplicate reading received and deduplicated'
        : result.alertResult?.breached
        ? `Telemetry recorded. Threshold breach detected (${result.alertResult.severity})`
        : 'Telemetry reading recorded successfully';

      res.status(status).json(formatResponse(result, message));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to ingest telemetry';
      logger.error('Telemetry ingest error:', { error: msg });
      const status = msg.includes('not found')
        ? 404
        : msg.includes('future') || msg.includes('mismatch') || msg.includes('does not belong')
        ? 400
        : 500;
      res.status(status).json(formatError('TELEMETRY_INGESTION_FAILED', msg));
    }
  },

  ingestBatch: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const result = await telemetryService.ingestBatch(req.body, userId);

      res.status(201).json(
        formatResponse(
          result,
          `Batch ingestion complete: ${result.inserted} inserted, ${result.duplicates} duplicates skipped`
        )
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to process batch telemetry';
      logger.error('Batch ingest error:', { error: msg });
      res.status(400).json(formatError('BATCH_INGESTION_FAILED', msg));
    }
  },

  getStats: async (req: Request, res: Response) => {
    try {
      const sensorId = getParam(req.params.sensorId);
      const window = (req.query.window as '5m' | '15m' | '1h' | '24h') || '24h';
      const stats = await telemetryService.getRollingStats(sensorId, window);
      res.json(formatResponse(stats));
    } catch (error) {
      logger.error('Rolling stats error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to compute rolling statistics'));
    }
  },

  getSummary: async (req: Request, res: Response) => {
    try {
      const stationId = req.query.stationId as string | undefined;
      const summary = await telemetryService.getSummary(stationId);
      res.json(formatResponse(summary));
    } catch (error) {
      logger.error('Telemetry summary error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch summary'));
    }
  },

  // ── Simulator Control Endpoints ────────────────────────────

  startSimulator: async (req: Request, res: Response) => {
    try {
      const { scenario, intervalMs, stationCode } = req.body;
      const status = await telemetrySimulator.start({
        scenario: scenario as SimulationScenario,
        intervalMs: intervalMs ? Number(intervalMs) : undefined,
        stationCode,
      });
      res.json(formatResponse(status, 'Telemetry simulator started'));
    } catch (error) {
      logger.error('Simulator start error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to start simulator'));
    }
  },

  stopSimulator: async (_req: Request, res: Response) => {
    try {
      const status = telemetrySimulator.stop();
      res.json(formatResponse(status, 'Telemetry simulator stopped'));
    } catch (error) {
      logger.error('Simulator stop error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to stop simulator'));
    }
  },

  getSimulatorStatus: async (_req: Request, res: Response) => {
    try {
      const status = telemetrySimulator.getStatus();
      res.json(formatResponse(status));
    } catch (error) {
      logger.error('Simulator status error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch simulator status'));
    }
  },
};
