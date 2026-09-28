// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Incidents Controller
// ═══════════════════════════════════════════════════════════════

import type { Request, Response } from 'express';
import { incidentsService } from './incidents.service.js';
import { logger } from '../../config/logger.js';

export const incidentsController = {
  list: async (req: Request, res: Response) => {
    try {
      const result = await incidentsService.listIncidents(req.query as any);
      res.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: Number(req.query.page ?? 1),
          limit: Number(req.query.limit ?? 20),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Incident list error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to list incidents' },
        timestamp: new Date().toISOString(),
      });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const incident = await incidentsService.getIncidentById(id);
      if (!incident) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Incident '${id}' not found` },
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        data: incident,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Incident get error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch incident' },
        timestamp: new Date().toISOString(),
      });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId ?? (req as any).user?.id ?? '00000000-0000-0000-0000-000000000001';
      const incident = await incidentsService.createIncident(req.body, userId);
      res.status(201).json({
        success: true,
        data: incident,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Incident create error:', error);
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.message || 'Failed to create incident' },
        timestamp: new Date().toISOString(),
      });
    }
  },

  escalateFromAlert: async (req: Request, res: Response) => {
    try {
      const alertId = req.params.alertId as string;
      const userId = (req as any).user?.userId ?? (req as any).user?.id ?? '00000000-0000-0000-0000-000000000001';
      const { incident, isNewlyCreated } = await incidentsService.escalateAlertToIncident(
        alertId,
        userId,
        req.body
      );

      res.status(isNewlyCreated ? 201 : 200).json({
        success: true,
        data: incident,
        isNewlyCreated,
        message: isNewlyCreated
          ? 'Alert escalated to operational incident successfully'
          : 'Existing active incident returned (idempotent)',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Alert escalation error:', error);
      res.status(400).json({
        success: false,
        error: { code: 'ESCALATION_ERROR', message: error.message || 'Failed to escalate alert' },
        timestamp: new Date().toISOString(),
      });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = (req as any).user?.userId ?? (req as any).user?.id;
      const incident = await incidentsService.updateIncident(id, req.body, userId);
      res.json({
        success: true,
        data: incident,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Incident update error:', error);
      res.status(400).json({
        success: false,
        error: { code: 'TRANSITION_ERROR', message: error.message || 'Failed to update incident' },
        timestamp: new Date().toISOString(),
      });
    }
  },

  assign: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = (req as any).user?.userId ?? (req as any).user?.id ?? '00000000-0000-0000-0000-000000000001';
      const { assignedTo } = req.body;
      if (!assignedTo) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'assignedTo user ID is required' },
          timestamp: new Date().toISOString(),
        });
      }

      const incident = await incidentsService.assignIncident(id, assignedTo, userId);
      res.json({
        success: true,
        data: incident,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Incident assign error:', error);
      res.status(400).json({
        success: false,
        error: { code: 'ASSIGNMENT_ERROR', message: error.message || 'Failed to assign incident' },
        timestamp: new Date().toISOString(),
      });
    }
  },

  resolve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = (req as any).user?.userId ?? (req as any).user?.id ?? '00000000-0000-0000-0000-000000000001';
      const { rootCause, resolutionNotes } = req.body;
      if (!rootCause || !resolutionNotes) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'rootCause and resolutionNotes are required to resolve an incident' },
          timestamp: new Date().toISOString(),
        });
      }

      const incident = await incidentsService.resolveIncident(
        id,
        rootCause,
        resolutionNotes,
        userId
      );
      res.json({
        success: true,
        data: incident,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Incident resolve error:', error);
      res.status(400).json({
        success: false,
        error: { code: 'RESOLUTION_ERROR', message: error.message || 'Failed to resolve incident' },
        timestamp: new Date().toISOString(),
      });
    }
  },
};
