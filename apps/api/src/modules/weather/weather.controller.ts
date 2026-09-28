// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Weather Controller
// ═══════════════════════════════════════════════════════════════

import type { Request, Response } from 'express';
import { weatherService } from './weather.service.js';
import { logger } from '../../config/logger.js';
import { formatResponse, formatError } from '../../utils/index.js';

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? '';
  return param ?? '';
}

export const weatherController = {
  getCurrent: async (req: Request, res: Response) => {
    try {
      const stationId = getParam(req.params.stationId);
      const current = await weatherService.getCurrentWeather(stationId);
      res.json(formatResponse(current));
    } catch (error) {
      logger.error('Weather getCurrent error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch current weather'));
    }
  },

  getForecast: async (req: Request, res: Response) => {
    try {
      const stationId = getParam(req.params.stationId);
      const days = req.query.days ? Number(req.query.days) : 7;
      const forecast = await weatherService.getForecast(stationId, days);
      res.json(formatResponse(forecast));
    } catch (error) {
      logger.error('Weather getForecast error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to generate weather forecast'));
    }
  },

  getHistory: async (req: Request, res: Response) => {
    try {
      const stationId = getParam(req.params.stationId);
      const { startDate, endDate, limit } = req.query;
      const history = await weatherService.getHistory(
        stationId,
        startDate as string | undefined,
        endDate as string | undefined,
        limit ? Number(limit) : 50
      );
      res.json(formatResponse(history));
    } catch (error) {
      logger.error('Weather getHistory error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch weather history'));
    }
  },

  recordObservation: async (req: Request, res: Response) => {
    try {
      const observation = await weatherService.recordObservation(req.body);
      res.status(201).json(formatResponse(observation));
    } catch (error) {
      logger.error('Weather recordObservation error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to record weather observation'));
    }
  },
};
