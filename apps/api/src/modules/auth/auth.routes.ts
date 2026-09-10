import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validation.middleware.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { authRateLimiter } from '../../middleware/rate-limit.middleware.js';
import { loginSchema, registerSchema, refreshTokenSchema } from '@repo/schemas';

const router = Router();

router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.post('/logout', authMiddleware, authController.logout);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.get('/me', authMiddleware, authController.me);

export const authRoutes: Router = router;
