import type { Request, Response } from 'express';
import { desc } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { auditLogs } from '../../db/schema/index.js';
import { logger } from '../../config/logger.js';
import { formatResponse, formatError } from '../../utils/index.js';

export const auditController = {
  list: async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? Math.min(100, Math.max(1, Number(req.query.limit))) : 50;
      const logs = await db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);

      res.json(formatResponse(logs));
    } catch (error) {
      logger.error('Audit list error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch audit logs'));
    }
  },
};
