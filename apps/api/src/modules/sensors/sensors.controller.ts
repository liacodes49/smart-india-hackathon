import type { Request, Response } from 'express';
import { sensorsService } from './sensors.service.js';
import { logger } from '../../config/logger.js';
import { formatResponse, formatError } from '../../utils/index.js';

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? '';
  return param ?? '';
}

export const sensorsController = {
  list: async (req: Request, res: Response) => {
    try {
      const { stationId, assetId, type, status, page, limit } = req.query;
      const result = await sensorsService.getSensors({
        stationId: stationId as string | undefined,
        assetId: assetId as string | undefined,
        type: type as any,
        status: status as any,
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
      logger.error('Sensors list error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch sensors'));
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const sensor = await sensorsService.getSensorById(id);
      if (!sensor) {
        res.status(404).json(formatError('NOT_FOUND', `Sensor '${id}' not found`));
        return;
      }
      res.json(formatResponse(sensor));
    } catch (error) {
      logger.error('Sensor get error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch sensor'));
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const sensor = await sensorsService.createSensor(req.body, userId);
      res.status(201).json(formatResponse(sensor, 'Sensor registered successfully'));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to create sensor';
      logger.error('Sensor create error:', { error: msg });
      const status = msg.includes('does not belong') ? 422 : 400;
      res.status(status).json(formatError('CREATE_SENSOR_FAILED', msg));
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const userId = req.user?.id;
      const updated = await sensorsService.updateSensor(id, req.body, userId);
      if (!updated) {
        res.status(404).json(formatError('NOT_FOUND', `Sensor '${id}' not found`));
        return;
      }
      res.json(formatResponse(updated, 'Sensor updated successfully'));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to update sensor';
      logger.error('Sensor update error:', { error: msg });
      res.status(400).json(formatError('UPDATE_SENSOR_FAILED', msg));
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const success = await sensorsService.deleteSensor(id);
      if (!success) {
        res.status(404).json(formatError('NOT_FOUND', `Sensor '${id}' not found`));
        return;
      }
      res.json(formatResponse(null, `Sensor '${id}' deleted successfully`));
    } catch (error) {
      logger.error('Sensor delete error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to delete sensor'));
    }
  },

  checkHealth: async (_req: Request, res: Response) => {
    try {
      const staleCount = await sensorsService.checkStaleSensors();
      res.json(formatResponse({ markedOffline: staleCount }, 'Sensor health check completed'));
    } catch (error) {
      logger.error('Sensor health check error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to run sensor health check'));
    }
  },
};
