// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Assistant Routes
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { assistantController } from './assistant.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { assistantQuerySchema } from '@repo/schemas';

const router = Router();

router.post('/chat', authMiddleware, validate(assistantQuerySchema), assistantController.chat);
router.post('/query', authMiddleware, validate(assistantQuerySchema), assistantController.chat);

export const assistantRoutes: Router = router;
