// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Predictions Controller
// ═══════════════════════════════════════════════════════════════

import type { Request, Response } from 'express';
import { predictionsRepository } from './predictions.repository.js';
import { equipmentHealthService } from './equipment-health.service.js';
import { fuelForecastingService } from './fuel.service.js';
import { logger } from '../../config/logger.js';
import { formatResponse, formatError } from '../../utils/index.js';

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? '';
  return param ?? '';
}

export const predictionsController = {
  list: async (req: Request, res: Response) => {
    try {
      const { stationId, sensorId, assetId, type, minConfidence, page, limit } =
        req.query;
      const result = await predictionsRepository.findAll({
        stationId: stationId as string | undefined,
        sensorId: sensorId as string | undefined,
        assetId: assetId as string | undefined,
        type: type as any,
        minConfidence: minConfidence ? Number(minConfidence) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      const pageNum = page ? Number(page) : 1;
      const limitNum = limit ? Number(limit) : 20;

      res.json({
        success: true,
        data: result.data,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          totalPages: Math.ceil(result.total / limitNum),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Predictions list error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch predictions'));
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const prediction = await predictionsRepository.findById(id);
      if (!prediction) {
        res.status(404).json(formatError('NOT_FOUND', `Prediction '${id}' not found`));
        return;
      }
      res.json(formatResponse(prediction));
    } catch (error) {
      logger.error('Prediction get error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch prediction'));
    }
  },

  getAssetHealth: async (req: Request, res: Response) => {
    try {
      const assetId = getParam(req.params.assetId);
      const healthSummary = await equipmentHealthService.evaluateAssetHealth(assetId);
      res.json(formatResponse(healthSummary));
    } catch (error) {
      logger.error('Asset health evaluation error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to evaluate asset health'));
    }
  },

  getFuelForecast: async (req: Request, res: Response) => {
    try {
      const stationId = getParam(req.params.stationId);
      const { loadKwOverride, ambientTempOverride } = req.query;

      const forecast = await fuelForecastingService.forecastFuelDepletion(
        stationId,
        {
          loadKw: loadKwOverride ? Number(loadKwOverride) : undefined,
          ambientTempC: ambientTempOverride ? Number(ambientTempOverride) : undefined,
        }
      );
      res.json(formatResponse(forecast));
    } catch (error) {
      logger.error('Fuel forecasting error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to calculate fuel forecast'));
    }
  },

  evaluate: async (req: Request, res: Response) => {
    try {
      const { stationId, assetId } = req.body;
      if (assetId) {
        const health = await equipmentHealthService.evaluateAssetHealth(assetId);
        res.json(formatResponse({ evaluated: 'ASSET_HEALTH', result: health }));
        return;
      }

      if (stationId) {
        const fuel = await fuelForecastingService.forecastFuelDepletion(stationId);
        res.json(formatResponse({ evaluated: 'FUEL_FORECAST', result: fuel }));
        return;
      }

      res.status(400).json(formatError('VALIDATION_ERROR', 'Must provide stationId or assetId'));
    } catch (error) {
      logger.error('Manual prediction evaluation error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to evaluate prediction'));
    }
  },
};
