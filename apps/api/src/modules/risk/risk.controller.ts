// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Risk Controller
// ═══════════════════════════════════════════════════════════════

import type { Request, Response } from 'express';
import { riskService } from './risk.service.js';
import { stationsRepository } from '../stations/stations.repository.js';
import { logger } from '../../config/logger.js';
import { formatResponse, formatError } from '../../utils/index.js';

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? '';
  return param ?? '';
}

export const riskController = {
  getStationRisk: async (req: Request, res: Response) => {
    try {
      const stationId = getParam(req.params.stationId);
      const { energyWeight, equipmentWeight, weatherWeight, supplyWeight } =
        req.query;

      const weightsOverride =
        energyWeight || equipmentWeight || weatherWeight || supplyWeight
          ? {
              energyWeight: energyWeight ? Number(energyWeight) : 0.35,
              equipmentWeight: equipmentWeight ? Number(equipmentWeight) : 0.25,
              weatherWeight: weatherWeight ? Number(weatherWeight) : 0.25,
              supplyWeight: supplyWeight ? Number(supplyWeight) : 0.15,
            }
          : undefined;

      const assessment = await riskService.assessStationRisk(
        stationId,
        weightsOverride
      );
      res.json(formatResponse(assessment));
    } catch (error) {
      logger.error('Station risk assessment error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to assess station risk'));
    }
  },

  getOverview: async (_req: Request, res: Response) => {
    try {
      const stations = await stationsRepository.findAll();
      const assessments = await Promise.all(
        stations.map(async (s) => {
          try {
            return await riskService.assessStationRisk(s.id);
          } catch {
            return null;
          }
        })
      );

      res.json(formatResponse(assessments.filter(Boolean)));
    } catch (error) {
      logger.error('Risk overview error:', error);
      res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to fetch risk overview'));
    }
  },
};
