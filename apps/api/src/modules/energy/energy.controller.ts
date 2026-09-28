import type { Request, Response } from 'express';
import { energyService } from './energy.service.js';
import { logger } from '../../config/logger.js';
import { formatResponse, formatError } from '../../utils/index.js';

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? '';
  return param ?? '';
}

export const energyController = {
  getSummary: async (req: Request, res: Response) => {
    try {
      const stationId = getParam(req.params.stationId);
      const summary = await energyService.getStationEnergySummary(stationId);
      res.json(formatResponse(summary));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch energy summary';
      logger.error('Energy summary error:', { error: msg });
      const status = msg.includes('not found') ? 404 : 500;
      res.status(status).json(formatError('INTERNAL_ERROR', msg));
    }
  },

  getTrends: async (req: Request, res: Response) => {
    try {
      const stationId = getParam(req.params.stationId);
      const trends = await energyService.getStationEnergyTrends(stationId);
      res.json(formatResponse(trends));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch energy trends';
      logger.error('Energy trends error:', { error: msg });
      const status = msg.includes('not found') ? 404 : 500;
      res.status(status).json(formatError('INTERNAL_ERROR', msg));
    }
  },
};
