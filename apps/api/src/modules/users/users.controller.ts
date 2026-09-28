import type { Request, Response } from 'express';
import { usersService } from './users.service.js';
import { logger } from '../../config/logger.js';
import { formatResponse, formatError } from '../../utils/index.js';
import type { UserRole } from '@repo/shared';

export const usersController = {
  list: async (req: Request, res: Response) => {
    try {
      const { role, stationId, isActive } = req.query;
      const filters = {
        role: role as UserRole | undefined,
        stationId: stationId as string | undefined,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      };

      const users = await usersService.getUsers(filters);
      res.json(formatResponse(users));
    } catch (error) {
      logger.error('Users list error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch users'));
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const user = await usersService.getUserById(id);
      if (!user) {
        res.status(404).json(formatError('NOT_FOUND', 'User not found'));
        return;
      }
      res.json(formatResponse(user));
    } catch (error) {
      logger.error('User get error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch user'));
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { name, role, stationId, avatarUrl, isActive } = req.body;

      const updated = await usersService.updateUser(id, {
        name,
        role,
        stationId,
        avatarUrl,
        isActive,
      });

      if (!updated) {
        res.status(404).json(formatError('NOT_FOUND', 'User not found'));
        return;
      }

      res.json(formatResponse(updated, 'User updated successfully'));
    } catch (error) {
      logger.error('User update error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to update user'));
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const success = await usersService.deleteUser(id);
      if (!success) {
        res.status(404).json(formatError('NOT_FOUND', 'User not found'));
        return;
      }
      res.json(formatResponse(null, 'User deleted successfully'));
    } catch (error) {
      logger.error('User delete error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to delete user'));
    }
  },
};
