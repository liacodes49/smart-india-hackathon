import { Router } from 'express';
import { reportsController } from './reports.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();
router.get('/', authMiddleware, reportsController.list);
router.post('/', authMiddleware, reportsController.generate);
export const reportsRoutes: Router = router;
