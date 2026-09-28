// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Edge Controller
// ═══════════════════════════════════════════════════════════════

import type { Request, Response } from 'express';
import { edgeService } from './edge.service.js';
import { logger } from '../../config/logger.js';
import {
  connectivityTransitionSchema,
  edgeOutboxEnqueueSchema,
  edgeSyncPushBatchSchema,
  edgeSyncQuerySchema,
} from '@repo/schemas';

export const edgeController = {
  getConnectivity: async (req: Request, res: Response) => {
    try {
      const stationId = req.params.stationId as string;
      const state = await edgeService.getConnectivity(stationId);
      res.json({
        success: true,
        data: state,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('[EdgeController] Get connectivity error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch connectivity state' },
        timestamp: new Date().toISOString(),
      });
    }
  },

  setConnectivity: async (req: Request, res: Response) => {
    try {
      const stationId = req.params.stationId as string;
      const parsed = connectivityTransitionSchema.parse({
        stationId,
        state: req.body.state,
        reason: req.body.reason,
        updatedBy: (req as any).user?.id || req.body.updatedBy,
      });

      const updated = await edgeService.setConnectivity(parsed);
      res.json({
        success: true,
        data: updated,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('[EdgeController] Set connectivity error:', error);
      const statusCode = error.name === 'ZodError' ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error: { code: error.name === 'ZodError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR', message: error.message },
        timestamp: new Date().toISOString(),
      });
    }
  },

  enqueueOutbox: async (req: Request, res: Response) => {
    try {
      const parsed = edgeOutboxEnqueueSchema.parse(req.body);
      const enqueued = await edgeService.enqueueOutbox(parsed);
      res.status(201).json({
        success: true,
        data: enqueued,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('[EdgeController] Enqueue outbox error:', error);
      const statusCode = error.name === 'ZodError' ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error: { code: error.name === 'ZodError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR', message: error.message },
        timestamp: new Date().toISOString(),
      });
    }
  },

  pushBatch: async (req: Request, res: Response) => {
    try {
      const parsed = edgeSyncPushBatchSchema.parse(req.body);
      const result = await edgeService.reconcileSyncBatch(parsed);
      res.status(result.status === 'FAILED' ? 400 : 200).json({
        success: result.status !== 'FAILED',
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('[EdgeController] Push sync batch error:', error);
      const statusCode = error.name === 'ZodError' ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error: { code: error.name === 'ZodError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR', message: error.message },
        timestamp: new Date().toISOString(),
      });
    }
  },

  listBatches: async (req: Request, res: Response) => {
    try {
      const stationId = req.params.stationId as string;
      const query = edgeSyncQuerySchema.parse({
        stationId,
        status: req.query.status,
        page: req.query.page,
        limit: req.query.limit,
      });

      const result = await edgeService.listBatches(query);
      res.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: Number(query.page),
          limit: Number(query.limit),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('[EdgeController] List batches error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to list sync batches' },
        timestamp: new Date().toISOString(),
      });
    }
  },
};
