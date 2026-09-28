// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Spatial Digital Twin Controller
// ═══════════════════════════════════════════════════════════════

import type { Request, Response } from 'express';
import { digitalTwinService } from './digital-twin.service.js';
import { eventBus } from '../../lib/event-bus.js';
import { EventType, type DomainEvent } from '@repo/shared';
import { logger } from '../../config/logger.js';

export const digitalTwinController = {
  getState: async (req: Request, res: Response) => {
    try {
      const stationId = req.params.stationId as string;
      const state = await digitalTwinService.getSpatialStationState(stationId);
      res.json({
        success: true,
        data: state,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Digital twin state error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch twin state' },
        timestamp: new Date().toISOString(),
      });
    }
  },

  getZone: async (req: Request, res: Response) => {
    try {
      const stationId = req.params.stationId as string;
      const zoneId = req.params.zoneId as string;
      const zone = await digitalTwinService.getZoneSpatialState(stationId, zoneId);
      if (!zone) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Zone '${zoneId}' not found` },
          timestamp: new Date().toISOString(),
        });
      }
      res.json({
        success: true,
        data: zone,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Digital twin zone error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch zone state' },
        timestamp: new Date().toISOString(),
      });
    }
  },

  /**
   * Server-Sent Events (SSE) stream for live twin deltas
   */
  streamLiveEvents: async (req: Request, res: Response) => {
    const stationId = req.params.stationId as string;

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable proxy buffering
    });

    // Send initial handshake
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', stationId, timestamp: new Date().toISOString() })}\n\n`);

    // Event listener for domain updates
    const handleDomainEvent = (event: DomainEvent<any>) => {
      // Filter by station if stationId is specified on the event
      if (event.stationId && event.stationId !== stationId) {
        return;
      }

      const deltaPayload = {
        type: event.eventType,
        eventId: event.eventId,
        entityId: event.entityId,
        stationId: event.stationId,
        occurredAt: event.occurredAt,
        data: event.payload,
      };

      res.write(`data: ${JSON.stringify(deltaPayload)}\n\n`);
    };

    // Subscribe to live operational event streams
    const subscribedEvents = [
      EventType.TELEMETRY_READING_RECORDED,
      EventType.ALERT_TRIGGERED,
      EventType.ALERT_ACKNOWLEDGED,
      EventType.ALERT_RESOLVED,
      EventType.EQUIPMENT_HEALTH_DEGRADED,
      EventType.RISK_SCORE_UPDATED,
      EventType.INCIDENT_REPORTED,
      EventType.TWIN_STATE_UPDATED,
    ];

    const unsubscribers = subscribedEvents.map(eventType => {
      return eventBus.subscribe(eventType, handleDomainEvent);
    });

    // Keep-alive heartbeat interval every 20 seconds
    const heartbeatTimer = setInterval(() => {
      res.write(': keep-alive\n\n');
    }, 20000);

    // CRITICAL: Clean up subscribers and timer on client disconnect to prevent memory leaks
    req.on('close', () => {
      clearInterval(heartbeatTimer);
      unsubscribers.forEach(unsub => unsub());
      logger.debug(`[DigitalTwin] SSE client disconnected for station: ${stationId}`);
    });
  },
};
