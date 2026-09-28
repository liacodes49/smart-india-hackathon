import type { Request, Response } from 'express';
import { logger } from '../../config/logger.js';
import { analyticsRepository } from '../analytics/analytics.repository.js';
import { analyticsService } from '../analytics/analytics.service.js';
import { stationsRepository } from '../stations/stations.repository.js';
import { formatResponse, formatError } from '../../utils/index.js';

export const reportsController = {
  list: async (req: Request, res: Response) => {
    try {
      const stationIdParam = (req.query.stationId as string) || req.user?.stationId;
      let targetStationId = stationIdParam;

      if (!targetStationId) {
        const maitri = await stationsRepository.findById('MAITRI');
        targetStationId = maitri?.id;
      }

      if (!targetStationId) {
        return res.json(formatResponse([]));
      }

      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const reportList = await analyticsRepository.listReports(targetStationId, limit);
      res.json(formatResponse(reportList));
    } catch (error) {
      logger.error('Reports list error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch reports'));
    }
  },

  generate: async (req: Request, res: Response) => {
    try {
      const report = await analyticsService.generateReport(req.body, req.user?.id);
      res.status(201).json(formatResponse(report, 'Report generated successfully'));
    } catch (error) {
      logger.error('Report generate error:', error);
      res.status(500).json(
        formatError('INTERNAL_ERROR', error instanceof Error ? error.message : 'Failed to generate report')
      );
    }
  },
};
