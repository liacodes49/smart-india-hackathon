import type { Request, Response } from 'express';
import { logger } from '../../config/logger.js';

export const simulationController = {
  list: async (_req: Request, res: Response) => { try { res.json({ success: true, data: [], timestamp: new Date().toISOString() }); } catch (error) { logger.error('Simulation list error:', error); res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch simulations' }, timestamp: new Date().toISOString() }); } },
  getById: async (req: Request, res: Response) => { try { res.json({ success: true, data: { id: req.params.id }, timestamp: new Date().toISOString() }); } catch (error) { logger.error('Simulation get error:', error); res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch simulation' }, timestamp: new Date().toISOString() }); } },
  create: async (req: Request, res: Response) => { try { res.status(201).json({ success: true, data: req.body, timestamp: new Date().toISOString() }); } catch (error) { logger.error('Simulation create error:', error); res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create simulation' }, timestamp: new Date().toISOString() }); } },
  run: async (req: Request, res: Response) => { try { res.json({ success: true, data: { id: req.params.id, status: 'RUNNING' }, timestamp: new Date().toISOString() }); } catch (error) { logger.error('Simulation run error:', error); res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to run simulation' }, timestamp: new Date().toISOString() }); } },
};
