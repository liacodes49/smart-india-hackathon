// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Maintenance Controller
// ═══════════════════════════════════════════════════════════════

import type { Request, Response } from 'express';
import { maintenanceService } from './maintenance.service.js';
import { logger } from '../../config/logger.js';
import { formatResponse, formatError } from '../../utils/index.js';

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? '';
  return param ?? '';
}

export const maintenanceController = {
  list: async (req: Request, res: Response) => {
    try {
      const result = await maintenanceService.list(req.query as any);
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const page = req.query.page ? Number(req.query.page) : 1;

      res.json({
        success: true,
        data: result.data,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Maintenance list error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch maintenance records'));
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const record = await maintenanceService.getById(id);
      if (!record) {
        res.status(404).json(formatError('NOT_FOUND', `Maintenance record '${id}' not found`));
        return;
      }
      res.json(formatResponse(record));
    } catch (error) {
      logger.error('Maintenance get error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch maintenance record'));
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const record = await maintenanceService.create(req.body);
      res.status(201).json(formatResponse(record));
    } catch (error) {
      logger.error('Maintenance create error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to create maintenance record'));
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const record = await maintenanceService.update(id, req.body);
      res.json(formatResponse(record));
    } catch (error) {
      logger.error('Maintenance update error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to update maintenance record'));
    }
  },

  approve: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const operatorId = req.user?.id ?? 'system';
      const { scheduledDate, assignedTo } = req.body || {};
      const record = await maintenanceService.approveRecommendation(
        id,
        operatorId,
        scheduledDate ? new Date(scheduledDate) : undefined,
        assignedTo
      );
      res.json(formatResponse(record));
    } catch (error) {
      logger.error('Maintenance approve error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to approve maintenance recommendation'));
    }
  },
};
