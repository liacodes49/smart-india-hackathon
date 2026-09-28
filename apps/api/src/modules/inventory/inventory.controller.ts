import type { Request, Response } from 'express';
import { inventoryService } from './inventory.service.js';
import { logger } from '../../config/logger.js';
import { formatResponse, formatError } from '../../utils/index.js';

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? '';
  return param ?? '';
}

export const inventoryController = {
  list: async (req: Request, res: Response) => {
    try {
      const { stationId, category, lowStockOnly, page, limit } = req.query;
      const result = await inventoryService.getInventory({
        stationId: stationId as string | undefined,
        category: category as any,
        lowStockOnly: lowStockOnly !== undefined ? lowStockOnly === 'true' : undefined,
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
      logger.error('Inventory list error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch inventory items'));
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const item = await inventoryService.getInventoryItemById(id);
      if (!item) {
        res.status(404).json(formatError('NOT_FOUND', `Inventory item '${id}' not found`));
        return;
      }
      res.json(formatResponse(item));
    } catch (error) {
      logger.error('Inventory get error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch inventory item'));
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const item = await inventoryService.createInventoryItem(req.body, userId);
      res.status(201).json(formatResponse(item, 'Inventory item created successfully'));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to create inventory item';
      logger.error('Inventory create error:', { error: msg });
      const status = msg.includes('already exists') ? 409 : 400;
      res.status(status).json(formatError('CREATE_INVENTORY_FAILED', msg));
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const userId = req.user?.id;
      const updated = await inventoryService.updateInventoryItem(id, req.body, userId);
      if (!updated) {
        res.status(404).json(formatError('NOT_FOUND', `Inventory item '${id}' not found`));
        return;
      }
      res.json(formatResponse(updated, 'Inventory item updated successfully'));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to update inventory item';
      logger.error('Inventory update error:', { error: msg });
      res.status(400).json(formatError('UPDATE_INVENTORY_FAILED', msg));
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const success = await inventoryService.deleteInventoryItem(id);
      if (!success) {
        res.status(404).json(formatError('NOT_FOUND', `Inventory item '${id}' not found`));
        return;
      }
      res.json(formatResponse(null, `Inventory item '${id}' deleted successfully`));
    } catch (error) {
      logger.error('Inventory delete error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to delete inventory item'));
    }
  },

  consume: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const userId = req.user?.id;
      const result = await inventoryService.consumeResource(id, req.body, userId);
      res.status(200).json(formatResponse(result, 'Resource consumed successfully'));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to consume resource';
      logger.error('Resource consumption error:', { error: msg });
      const status = msg.includes('Insufficient stock') ? 422 : 400;
      res.status(status).json(formatError('CONSUMPTION_FAILED', msg));
    }
  },

  getLowStock: async (req: Request, res: Response) => {
    try {
      const stationId = getParam(req.params.stationId);
      const items = await inventoryService.getLowStockItems(stationId);
      res.json(formatResponse(items));
    } catch (error) {
      logger.error('Low stock error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch low stock items'));
    }
  },

  getHistory: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const history = await inventoryService.getConsumptionHistory(id);
      res.json(formatResponse(history));
    } catch (error) {
      logger.error('Consumption history error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch consumption history'));
    }
  },
};
