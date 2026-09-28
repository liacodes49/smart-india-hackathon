import type { Request, Response } from 'express';
import { assetsService } from './assets.service.js';
import { logger } from '../../config/logger.js';
import { formatResponse, formatError } from '../../utils/index.js';

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? '';
  return param ?? '';
}

export const assetsController = {
  list: async (req: Request, res: Response) => {
    try {
      const { stationId, buildingId, roomId, category, criticality, status, page, limit } = req.query;
      const result = await assetsService.getAssets({
        stationId: stationId as string | undefined,
        buildingId: buildingId as string | undefined,
        roomId: roomId as string | undefined,
        category: category as any,
        criticality: criticality as any,
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
      logger.error('Assets list error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch assets'));
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const asset = await assetsService.getAssetById(id);
      if (!asset) {
        res.status(404).json(formatError('NOT_FOUND', `Asset '${id}' not found`));
        return;
      }
      res.json(formatResponse(asset));
    } catch (error) {
      logger.error('Asset get error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch asset'));
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const asset = await assetsService.createAsset(req.body, userId);
      res.status(201).json(formatResponse(asset, 'Asset registered successfully'));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to create asset';
      logger.error('Asset create error:', { error: msg });
      const status = msg.includes('already exists')
        ? 409
        : msg.includes('validation failed')
        ? 422
        : 400;
      res.status(status).json(formatError('CREATE_ASSET_FAILED', msg));
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const userId = req.user?.id;
      const updated = await assetsService.updateAsset(id, req.body, userId);
      if (!updated) {
        res.status(404).json(formatError('NOT_FOUND', `Asset '${id}' not found`));
        return;
      }
      res.json(formatResponse(updated, 'Asset updated successfully'));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to update asset';
      logger.error('Asset update error:', { error: msg });
      const status = msg.includes('validation failed') ? 422 : 400;
      res.status(status).json(formatError('UPDATE_ASSET_FAILED', msg));
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const success = await assetsService.deleteAsset(id);
      if (!success) {
        res.status(404).json(formatError('NOT_FOUND', `Asset '${id}' not found`));
        return;
      }
      res.json(formatResponse(null, `Asset '${id}' deleted successfully`));
    } catch (error) {
      logger.error('Asset delete error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to delete asset'));
    }
  },
};
