import type { Request, Response } from 'express';
import { logger } from '../../config/logger.js';

export const authController = {
  login: async (req: Request, res: Response) => {
    try {
      // TODO: Implement login with Supabase Auth
      const { email, password: _password } = req.body;
      logger.info(`Login attempt for: ${email}`);

      res.json({
        success: true,
        data: {
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          user: { id: '1', email, name: 'Dev User', role: 'SUPER_ADMIN' },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'AUTH_ERROR', message: 'Login failed' },
        timestamp: new Date().toISOString(),
      });
    }
  },

  register: async (req: Request, res: Response) => {
    try {
      // TODO: Implement registration with Supabase Auth
      const { email, name } = req.body;
      logger.info(`Registration for: ${email}`);

      res.status(201).json({
        success: true,
        data: { id: '1', email, name, role: 'VIEWER' },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'AUTH_ERROR', message: 'Registration failed' },
        timestamp: new Date().toISOString(),
      });
    }
  },

  logout: async (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: null,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString(),
    });
  },

  refresh: async (_req: Request, res: Response) => {
    try {
      // TODO: Implement token refresh
      res.json({
        success: true,
        data: { token: 'new-mock-jwt-token', refreshToken: 'new-mock-refresh-token' },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'AUTH_ERROR', message: 'Token refresh failed' },
        timestamp: new Date().toISOString(),
      });
    }
  },

  me: async (req: Request, res: Response) => {
    const user = (req as any).user;
    res.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  },
};
