// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Maintenance Service
// ═══════════════════════════════════════════════════════════════
// Human-in-the-loop maintenance workflow service.
// Prediction -> Recommendation (RECOMMENDED) -> Operator Review -> Schedule -> Execute
// Enforces that predictions NEVER silently schedule or execute maintenance.
// ═══════════════════════════════════════════════════════════════

import {
  EventType,
  createDomainEvent,
  MaintenanceType,
  MaintenancePriority,
  MaintenanceStatus,
  AlertStatus,
} from '@repo/shared';
import type {
  CreateMaintenanceInput,
  UpdateMaintenanceInput,
  MaintenanceQueryInput,
} from '@repo/schemas';
import { eventBus } from '../../lib/event-bus.js';
import {
  MaintenanceRepository,
  maintenanceRepository,
  type MaintenanceRecordSelect,
} from './maintenance.repository.js';
import { assetsRepository } from '../assets/assets.repository.js';
import { stationsRepository } from '../stations/stations.repository.js';


export interface CreateRecommendationParams {
  stationId: string;
  assetId: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  suggestedAction?: string;
  notes?: string;
}

export class MaintenanceService {
  constructor(
    private readonly repo: MaintenanceRepository = maintenanceRepository
  ) {}

  /**
   * Create an automated maintenance recommendation triggered by equipment health
   * or anomaly detection. Preserves human authority by setting status to RECOMMENDED.
   */
  async createRecommendation(
    params: CreateRecommendationParams
  ): Promise<MaintenanceRecordSelect> {
    // Check for existing active recommendation to prevent alert/recommendation storming
    const existing = await this.repo.findActiveRecommendation(params.assetId);
    if (existing) {
      // Update existing recommendation notes if priority has elevated
      if (
        params.priority === MaintenancePriority.CRITICAL &&
        existing.priority !== MaintenancePriority.CRITICAL
      ) {
        const updated = await this.repo.update(existing.id, {
          priority: MaintenancePriority.CRITICAL,
          notes: `${existing.notes || ''}\n[Elevated to CRITICAL]: ${params.notes || ''}`,
        });
        return updated!;
      }
      return existing;
    }

    const record = await this.repo.create({
      stationId: params.stationId,
      assetId: params.assetId,
      title: params.title,
      description: params.description,
      type: MaintenanceType.PREDICTIVE,
      priority: params.priority,
      status: MaintenanceStatus.RECOMMENDED,
      notes: params.notes,
    });

    eventBus.publish(
      createDomainEvent({
        eventType: EventType.MAINTENANCE_RECOMMENDED,
        source: 'maintenance-service',
        stationId: params.stationId,
        entityId: record.id,
        payload: {
          assetId: params.assetId,
          priority: params.priority,
          title: params.title,
        },
      })
    );

    return record;
  }

  /**
   * Human operator approves a recommendation, transitioning it to PENDING work order
   */
  async approveRecommendation(
    id: string,
    operatorId: string,
    scheduledDate?: Date,
    assignedTo?: string
  ): Promise<MaintenanceRecordSelect> {
    const record = await this.repo.findById(id);
    if (!record) {
      throw new Error(`Maintenance record not found: ${id}`);
    }

    if (record.status !== MaintenanceStatus.RECOMMENDED) {
      throw new Error(
        `Cannot approve record in status '${record.status}' (expected RECOMMENDED)`
      );
    }

    const updated = await this.repo.update(id, {
      status: MaintenanceStatus.PENDING,
      scheduledDate: scheduledDate ?? new Date(Date.now() + 48 * 60 * 60 * 1000), // Default 48h out
      assignedTo,
      notes: `${record.notes || ''}\n[Approved by Operator ${operatorId} at ${new Date().toISOString()}]`,
    });

    eventBus.publish(
      createDomainEvent({
        eventType: EventType.MAINTENANCE_SCHEDULED,
        source: 'maintenance-service',
        stationId: record.stationId,
        entityId: record.id,
        payload: {
          scheduledDate: updated?.scheduledDate,
          assignedTo: updated?.assignedTo,
        },
      })
    );

    return updated!;
  }

  /**
   * Manual creation of a maintenance work order
   */
  async create(input: CreateMaintenanceInput): Promise<MaintenanceRecordSelect> {
    const asset = await assetsRepository.findById(input.assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${input.assetId}`);
    }

    const station = await stationsRepository.findById(input.stationId);
    const resolvedStationId = station ? station.id : input.stationId;

    const record = await this.repo.create({
      stationId: resolvedStationId,
      assetId: input.assetId,
      title: input.title,
      description: input.description,
      type: input.type as MaintenanceType,
      priority: input.priority as MaintenancePriority,
      status: MaintenanceStatus.PENDING,
      assignedTo: input.assignedTo,
      scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : undefined,
      notes: input.notes,
    });

    eventBus.publish(
      createDomainEvent({
        eventType: EventType.MAINTENANCE_SCHEDULED,
        source: 'maintenance-service',
        stationId: resolvedStationId,
        entityId: record.id,
        payload: record,
      })
    );


    return record;
  }

  async update(
    id: string,
    input: UpdateMaintenanceInput
  ): Promise<MaintenanceRecordSelect> {
    const record = await this.repo.findById(id);
    if (!record) {
      throw new Error(`Maintenance record not found: ${id}`);
    }

    const updateData: Partial<typeof record> = {};
    if (input.title) updateData.title = input.title;
    if (input.description) updateData.description = input.description;
    if (input.type) updateData.type = input.type as MaintenanceType;
    if (input.priority) updateData.priority = input.priority as MaintenancePriority;
    if (input.status) updateData.status = input.status as MaintenanceStatus;
    if (input.assignedTo) updateData.assignedTo = input.assignedTo;
    if (input.scheduledDate)
      updateData.scheduledDate = new Date(input.scheduledDate);
    if (input.completedDate)
      updateData.completedDate = new Date(input.completedDate);
    if (input.notes) updateData.notes = input.notes;

    const updated = await this.repo.update(id, updateData);

    if (input.status === MaintenanceStatus.COMPLETED) {
      eventBus.publish(
        createDomainEvent({
          eventType: EventType.MAINTENANCE_COMPLETED,
          source: 'maintenance-service',
          stationId: record.stationId,
          entityId: id,
          payload: updated,
        })
      );

      // Cross-module synchronization: Auto-resolve active alerts linked to this asset
      if (record.assetId) {
        try {
          const { alertsRepository } = await import('../alerts/alerts.repository.js');
          const { alertsService } = await import('../alerts/alerts.service.js');
          const activeAlerts = await alertsRepository.findAll({
            assetId: record.assetId,
            stationId: record.stationId,
            limit: 50,
          });
          const pending = activeAlerts.data.filter(
            (a) =>
              a.status === AlertStatus.ACTIVE ||
              a.status === AlertStatus.ACKNOWLEDGED ||
              a.status === AlertStatus.ESCALATED
          );
          for (const alert of pending) {
            await alertsService.resolveAlert(
              alert.id,
              input.assignedTo || 'Station Engineer',
              `Auto-resolved on completion of maintenance order "${record.title}" (${id})`
            );
          }
        } catch (err) {
          console.error('[MaintenanceService] Error auto-resolving linked alerts:', err);
        }
      }
    } else {
      eventBus.publish(
        createDomainEvent({
          eventType: EventType.MAINTENANCE_UPDATED,
          source: 'maintenance-service',
          stationId: record.stationId,
          entityId: id,
          payload: updated,
        })
      );
    }

    return updated!;
  }

  async getById(id: string): Promise<MaintenanceRecordSelect | null> {
    return this.repo.findById(id);
  }

  async list(
    query?: MaintenanceQueryInput
  ): Promise<{ data: MaintenanceRecordSelect[]; total: number }> {
    let resolvedStationId = query?.stationId;
    if (resolvedStationId) {
      const station = await stationsRepository.findById(resolvedStationId);
      if (station) resolvedStationId = station.id;
    }

    return this.repo.findAll({
      stationId: resolvedStationId,
      assetId: query?.assetId,
      type: query?.type as MaintenanceType | undefined,
      priority: query?.priority as MaintenancePriority | undefined,
      status: query?.status as MaintenanceStatus | undefined,
      page: query?.page,
      limit: query?.limit,
    });
  }
}


export const maintenanceService = new MaintenanceService();
