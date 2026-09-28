// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Assistant Controller
// ═══════════════════════════════════════════════════════════════

import type { Request, Response } from 'express';
import { assistantService } from './assistant.service.js';
import { logger } from '../../config/logger.js';

export const assistantController = {
  chat: async (req: Request, res: Response) => {
    try {
      const response = await assistantService.processInquiry(req.body);
      res.json({
        success: true,
        data: response,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Assistant chat error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'ASSISTANT_ERROR', message: error.message || 'Failed to process assistant inquiry' },
        timestamp: new Date().toISOString(),
      });
    }
  },
};
