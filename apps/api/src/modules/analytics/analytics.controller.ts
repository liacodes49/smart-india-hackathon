// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Analytics & Reports Controller
// ═══════════════════════════════════════════════════════════════

import type { Request, Response } from 'express';
import { analyticsService } from './analytics.service.js';
import { logger } from '../../config/logger.js';
import {
  historicalAnalyticsQuerySchema,
  reliabilityQuerySchema,
  reportGenerateSchema,
  reportExportQuerySchema,
} from '@repo/schemas';

export const analyticsController = {
  getEnergyTrend: async (req: Request, res: Response) => {
    try {
      const stationId = req.params.stationId as string;
      const parsed = historicalAnalyticsQuerySchema.parse({
        stationId,
        startTime: req.query.startTime,
        endTime: req.query.endTime,
        resolution: req.query.resolution,
      });

      const trend = await analyticsService.getEnergyTrend(parsed);
      res.json({
        success: true,
        data: trend,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('[AnalyticsController] Get energy trend error:', error);
      const statusCode = error.name === 'ZodError' ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error: { code: error.name === 'ZodError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR', message: error.message },
        timestamp: new Date().toISOString(),
      });
    }
  },

  getFuelTrend: async (req: Request, res: Response) => {
    try {
      const stationId = req.params.stationId as string;
      const parsed = historicalAnalyticsQuerySchema.parse({
        stationId,
        startTime: req.query.startTime,
        endTime: req.query.endTime,
        resolution: req.query.resolution,
      });

      const trend = await analyticsService.getFuelTrend(parsed);
      res.json({
        success: true,
        data: trend,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('[AnalyticsController] Get fuel trend error:', error);
      const statusCode = error.name === 'ZodError' ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error: { code: error.name === 'ZodError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR', message: error.message },
        timestamp: new Date().toISOString(),
      });
    }
  },

  getReliability: async (req: Request, res: Response) => {
    try {
      const stationId = req.params.stationId as string;
      const parsed = reliabilityQuerySchema.parse({
        stationId,
        periodStart: req.query.periodStart,
        periodEnd: req.query.periodEnd,
      });

      const metrics = await analyticsService.getReliabilityMetrics(parsed);
      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('[AnalyticsController] Get reliability error:', error);
      const statusCode = error.name === 'ZodError' ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error: { code: error.name === 'ZodError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR', message: error.message },
        timestamp: new Date().toISOString(),
      });
    }
  },

  generateReport: async (req: Request, res: Response) => {
    try {
      const parsed = reportGenerateSchema.parse(req.body);
      const userId = (req as any).user?.id;
      const report = await analyticsService.generateReport(parsed, userId);

      res.status(201).json({
        success: true,
        data: report,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('[AnalyticsController] Generate report error:', error);
      const statusCode = error.name === 'ZodError' ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error: { code: error.name === 'ZodError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR', message: error.message },
        timestamp: new Date().toISOString(),
      });
    }
  },

  exportReport: async (req: Request, res: Response) => {
    try {
      const parsed = reportExportQuerySchema.parse(req.query);
      const report = await analyticsService.generateReport(
        {
          stationId: parsed.stationId,
          type: parsed.type,
          format: parsed.format,
          periodStart: parsed.periodStart,
          periodEnd: parsed.periodEnd,
        },
        (req as any).user?.id
      );

      if (parsed.format === 'CSV') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${parsed.type}_${parsed.stationId}.csv"`
        );
        res.send(report.content);
        return;
      }

      res.json({
        success: true,
        data: report,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('[AnalyticsController] Export report error:', error);
      const statusCode = error.name === 'ZodError' ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error: { code: error.name === 'ZodError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR', message: error.message },
        timestamp: new Date().toISOString(),
      });
    }
  },
};
