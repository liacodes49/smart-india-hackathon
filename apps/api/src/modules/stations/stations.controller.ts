import type { Request, Response } from 'express';
import { stationsService } from './stations.service.js';
import { logger } from '../../config/logger.js';
import { formatResponse, formatError } from '../../utils/index.js';

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? '';
  return param ?? '';
}

export const stationsController = {
  // ── Station Handlers ───────────────────────────────────────

  list: async (_req: Request, res: Response) => {
    try {
      const stations = await stationsService.getAllStations();
      res.json(formatResponse(stations));
    } catch (error) {
      logger.error('Stations list error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch stations'));
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const station = await stationsService.getStationById(id);
      if (!station) {
        res.status(404).json(formatError('NOT_FOUND', `Station '${id}' not found`));
        return;
      }
      res.json(formatResponse(station));
    } catch (error) {
      logger.error('Station get error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch station'));
    }
  },

  getHierarchy: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const hierarchy = await stationsService.getStationHierarchy(id);
      if (!hierarchy) {
        res.status(404).json(formatError('NOT_FOUND', `Station '${id}' not found`));
        return;
      }
      res.json(formatResponse(hierarchy));
    } catch (error) {
      logger.error('Station hierarchy error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch station hierarchy'));
    }
  },

  getOverview: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const overview = await stationsService.getStationOverview(id);
      if (!overview) {
        res.status(404).json(formatError('NOT_FOUND', `Station '${id}' not found`));
        return;
      }
      res.json(formatResponse(overview));
    } catch (error) {
      logger.error('Station overview error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch overview'));
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const station = await stationsService.createStation(req.body, userId);
      res.status(201).json(formatResponse(station, 'Station created successfully'));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to create station';
      logger.error('Station create error:', { error: msg });
      const status = msg.includes('already exists') ? 409 : 400;
      res.status(status).json(formatError('CREATE_STATION_FAILED', msg));
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const userId = req.user?.id;
      const updated = await stationsService.updateStation(id, req.body, userId);
      if (!updated) {
        res.status(404).json(formatError('NOT_FOUND', `Station '${id}' not found`));
        return;
      }
      res.json(formatResponse(updated, 'Station updated successfully'));
    } catch (error) {
      logger.error('Station update error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to update station'));
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const success = await stationsService.deleteStation(id);
      if (!success) {
        res.status(404).json(formatError('NOT_FOUND', `Station '${id}' not found`));
        return;
      }
      res.json(formatResponse(null, `Station '${id}' deleted successfully`));
    } catch (error) {
      logger.error('Station delete error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to delete station'));
    }
  },

  // ── Buildings Handlers ─────────────────────────────────────

  getBuildings: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const buildings = await stationsService.getBuildings(id);
      res.json(formatResponse(buildings));
    } catch (error) {
      logger.error('Station buildings error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch buildings'));
    }
  },

  createBuilding: async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);
      const station = await stationsService.getStationById(id);
      if (!station) {
        res.status(404).json(formatError('NOT_FOUND', `Station '${id}' not found`));
        return;
      }

      const building = await stationsService.createBuilding({
        ...req.body,
        stationId: station.id,
      });

      res.status(201).json(formatResponse(building, 'Building created successfully'));
    } catch (error) {
      logger.error('Building create error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to create building'));
    }
  },

  // ── Rooms Handlers ─────────────────────────────────────────

  getRooms: async (req: Request, res: Response) => {
    try {
      const buildingId = getParam(req.params.buildingId);
      const rooms = await stationsService.getRooms(buildingId);
      res.json(formatResponse(rooms));
    } catch (error) {
      logger.error('Rooms list error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch rooms'));
    }
  },

  createRoom: async (req: Request, res: Response) => {
    try {
      const buildingId = getParam(req.params.buildingId);
      const room = await stationsService.createRoom({
        ...req.body,
        buildingId,
      });

      res.status(201).json(formatResponse(room, 'Room created successfully'));
    } catch (error) {
      logger.error('Room create error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to create room'));
    }
  },
};
