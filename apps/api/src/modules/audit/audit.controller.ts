import type { Request, Response } from 'express';
import { logger } from '../../config/logger.js';

export const auditController = {
  list: async (_req: Request, res: Response) => { try { res.json({ success: true, data: [], timestamp: new Date().toISOString() }); } catch (error) { logger.error('Audit list error:', error); res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch audit logs' }, timestamp: new Date().toISOString() }); } },
};
