import { Router } from 'express';
import { maintenanceController } from './maintenance.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { createMaintenanceSchema, updateMaintenanceSchema, maintenanceQuerySchema } from '@repo/schemas';

const router = Router();
router.get('/', authMiddleware, validate(maintenanceQuerySchema, 'query'), maintenanceController.list);
router.get('/:id', authMiddleware, maintenanceController.getById);
router.post('/', authMiddleware, validate(createMaintenanceSchema), maintenanceController.create);
router.put('/:id', authMiddleware, validate(updateMaintenanceSchema), maintenanceController.update);
export const maintenanceRoutes: Router = router;
