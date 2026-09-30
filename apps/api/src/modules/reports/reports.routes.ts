import { Router } from 'express';
import { reportsController } from './reports.controller.js';
import { optionalAuthMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();
router.get('/', optionalAuthMiddleware, reportsController.list);
router.post('/', optionalAuthMiddleware, reportsController.generate);
export const reportsRoutes: Router = router;
