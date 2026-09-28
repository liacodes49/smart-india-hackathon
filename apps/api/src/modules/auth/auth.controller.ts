import type { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { logger } from '../../config/logger.js';
import { formatResponse, formatError } from '../../utils/index.js';

export const authController = {
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      logger.info(`Login attempt for: ${email}`);

      const result = await authService.login({ email, password });
      res.json(formatResponse(result, 'Login successful'));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Login failed';
      logger.warn('Login failed:', { error: msg });
      res.status(401).json(formatError('AUTH_INVALID_CREDENTIALS', msg));
    }
  },

  register: async (req: Request, res: Response) => {
    try {
      const { email, password, name, role } = req.body;
      logger.info(`Registration request for: ${email}`);

      const result = await authService.register({ email, password, name, role });
      res.status(201).json(formatResponse(result, 'Registration successful'));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Registration failed';
      logger.error('Registration error:', { error: msg });
      const status = msg.includes('already exists') ? 409 : 400;
      res.status(status).json(formatError('REGISTRATION_FAILED', msg));
    }
  },

  logout: async (_req: Request, res: Response) => {
    res.json(formatResponse(null, 'Logged out successfully'));
  },

  refresh: async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refresh(refreshToken);
      res.json(formatResponse(result, 'Token refreshed successfully'));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Token refresh failed';
      logger.warn('Token refresh failed:', { error: msg });
      res.status(401).json(formatError('TOKEN_REFRESH_FAILED', msg));
    }
  },

  me: async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json(formatError('UNAUTHORIZED', 'Authentication required'));
        return;
      }

      const profile = await authService.me(user.id);
      if (!profile) {
        res.status(404).json(formatError('NOT_FOUND', 'User profile not found'));
        return;
      }

      res.json(formatResponse(profile));
    } catch (error) {
      logger.error('Fetch profile error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to retrieve profile'));
    }
  },
};
