// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Simulation Controller
// ═══════════════════════════════════════════════════════════════

import type { Request, Response } from 'express';
import { simulationService } from './simulation.service.js';
import { logger } from '../../config/logger.js';

export const simulationController = {
  list: async (req: Request, res: Response) => {
    try {
      const result = await simulationService.listSimulations(req.query as any);
      res.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: Number(req.query.page ?? 1),
          limit: Number(req.query.limit ?? 20),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Simulation list error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to list simulations' },
        timestamp: new Date().toISOString(),
      });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const sim = await simulationService.getSimulationById(id);
      if (!sim) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Simulation '${id}' not found` },
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        data: sim,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Simulation get error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch simulation' },
        timestamp: new Date().toISOString(),
      });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId ?? (req as any).user?.id;
      const sim = await simulationService.createSimulation(req.body, userId ?? null);
      res.status(201).json({
        success: true,
        data: sim,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Simulation create error:', error);
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.message || 'Failed to create simulation' },
        timestamp: new Date().toISOString(),
      });
    }
  },

  run: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const sim = await simulationService.runSimulation(id);
      res.json({
        success: true,
        data: sim,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Simulation run error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SIMULATION_ERROR', message: error.message || 'Failed to run simulation' },
        timestamp: new Date().toISOString(),
      });
    }
  },

  quickRun: async (req: Request, res: Response) => {
    try {
      const { stationId, type, parameters } = req.body;
      const result = await simulationService.quickRunSimulation(stationId, type, parameters);
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Simulation quick-run error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SIMULATION_ERROR', message: error.message || 'Failed to execute quick simulation' },
        timestamp: new Date().toISOString(),
      });
    }
  },
};
