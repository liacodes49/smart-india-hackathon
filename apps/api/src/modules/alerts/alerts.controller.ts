import type { Request, Response } from 'express';
import { alertsService } from './alerts.service.js';
import { logger } from '../../config/logger.js';
import { formatResponse, formatError } from '../../utils/index.js';

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? '';
  return param ?? '';
}

export const alertsController = {
  list: async (req: Request, res: Response) => {
    try {
      const { stationId, sensorId, assetId, severity, status, category, page, limit } = req.query;
      const result = await alertsService.getAlerts({
        stationId: stationId as string | undefined,
        sensorId: sensorId as string | undefined,
        assetId: assetId as string | undefined,
        severity: severity as any,
        status: status as any,
        category: category as any,
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
      logger.error('Alerts list error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch alerts'));
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const alert = await alertsService.getAlertById(id);
      if (!alert) {
        res.status(404).json(formatError('NOT_FOUND', `Alert '${id}' not found`));
        return;
      }
      res.json(formatResponse(alert));
    } catch (error) {
      logger.error('Alert get error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch alert'));
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const alert = await alertsService.createAlert(req.body, userId);
      res.status(201).json(formatResponse(alert, 'Alert created successfully'));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to create alert';
      logger.error('Alert create error:', { error: msg });
      res.status(400).json(formatError('CREATE_ALERT_FAILED', msg));
    }
  },

  acknowledge: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const userId = req.user?.id ?? req.body?.acknowledgedBy ?? '00000000-0000-0000-0000-000000000000';
      const notes = req.body?.notes ?? req.body?.operatorNotes;

      const updated = await alertsService.acknowledgeAlert(id, {
        acknowledgedBy: userId,
        notes,
      });

      if (!updated) {
        res.status(404).json(formatError('NOT_FOUND', `Alert '${id}' not found`));
        return;
      }

      res.json(formatResponse(updated, 'Alert acknowledged successfully'));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to acknowledge alert';
      logger.error('Alert acknowledge error:', { error: msg });
      res.status(400).json(formatError('ACKNOWLEDGE_ALERT_FAILED', msg));
    }
  },

  resolve: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const userId = req.user?.id ?? req.body?.resolvedBy ?? '00000000-0000-0000-0000-000000000000';
      const notes = req.body?.notes ?? req.body?.resolutionNotes ?? req.body?.operatorNotes;

      const updated = await alertsService.resolveAlert(id, userId, notes);
      if (!updated) {
        res.status(404).json(formatError('NOT_FOUND', `Alert '${id}' not found`));
        return;
      }

      res.json(formatResponse(updated, 'Alert resolved successfully'));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to resolve alert';
      logger.error('Alert resolve error:', { error: msg });
      res.status(400).json(formatError('RESOLVE_ALERT_FAILED', msg));
    }
  },
};
