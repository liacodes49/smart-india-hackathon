// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Industrial Gateway Controller
// ═══════════════════════════════════════════════════════════════

import type { Request, Response } from 'express';
import { gatewayService } from './gateway.service.js';
import { logger } from '../../config/logger.js';
import { GatewayProtocol } from '@repo/shared';
import {
  gatewayIngestParamsSchema,
  gatewayIngestBodySchema,
  gatewayQuerySchema,
} from '@repo/schemas';

export const gatewayController = {
  ingest: async (req: Request, res: Response) => {
    try {
      const { protocol } = gatewayIngestParamsSchema.parse(req.params);
      const parsed = gatewayIngestBodySchema.parse(req.body);

      const result = await gatewayService.ingest(protocol as GatewayProtocol, parsed);
      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('[GatewayController] Ingest error:', error);
      const statusCode = error.name === 'ZodError' ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error: { code: error.name === 'ZodError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR', message: error.message },
        timestamp: new Date().toISOString(),
      });
    }
  },

  getStats: async (_req: Request, res: Response) => {
    try {
      const stats = gatewayService.getStats();
      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('[GatewayController] Stats error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch gateway statistics' },
        timestamp: new Date().toISOString(),
      });
    }
  },

  getDeadLetter: async (req: Request, res: Response) => {
    try {
      const query = gatewayQuerySchema.parse(req.query);
      const items = gatewayService.getDeadLetter(
        query.stationId,
        query.protocol as GatewayProtocol | undefined
      );

      res.json({
        success: true,
        data: items.slice(0, query.limit),
        total: items.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('[GatewayController] Dead letter error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch dead-letter queue' },
        timestamp: new Date().toISOString(),
      });
    }
  },
};
