// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Assets Service
// ═══════════════════════════════════════════════════════════════
// Business logic for physical assets, hierarchy verification,
// and lifecycle domain events.
// ═══════════════════════════════════════════════════════════════

import { assetsRepository, FindAssetsFilter, AssetSelect } from './assets.repository.js';
import { eventBus } from '../../lib/event-bus.js';
import { createDomainEvent, EventType } from '@repo/shared';
import type { CreateAssetInput, UpdateAssetInput } from '@repo/schemas';

export class AssetsService {
  async getAssets(filters?: FindAssetsFilter) {
    return assetsRepository.findAll(filters);
  }

  async getAssetById(id: string): Promise<AssetSelect | null> {
    return assetsRepository.findById(id);
  }

  async createAsset(input: CreateAssetInput, userId?: string): Promise<AssetSelect> {
    // 1. Validate physical hierarchy
    const validation = await assetsRepository.validateHierarchy(
      input.stationId,
      input.buildingId,
      input.roomId
    );
    if (!validation.valid) {
      throw new Error(`Hierarchy validation failed: ${validation.error}`);
    }

    // 2. Check code uniqueness
    const existing = await assetsRepository.findByCode(input.code);
    if (existing) {
      throw new Error(`Asset with code '${input.code}' already exists`);
    }

    // 3. Persist
    const created = await assetsRepository.create({
      stationId: input.stationId,
      buildingId: input.buildingId ?? null,
      roomId: input.roomId ?? null,
      name: input.name,
      code: input.code,
      category: input.category as any,
      criticality: (input.criticality as any) ?? 'MEDIUM',
      manufacturer: input.manufacturer ?? null,
      model: input.model ?? null,
      serialNumber: input.serialNumber ?? null,
      installDate: input.installDate ? new Date(input.installDate) : null,
      status: (input.status as any) ?? 'NORMAL',
      metadata: input.metadata ?? null,
    });

    // 4. Emit domain event
    await eventBus.publish(
      createDomainEvent({
        eventType: EventType.ASSET_CREATED,
        source: 'assets-service',
        entityId: created.id,
        stationId: created.stationId,
        payload: {
          assetId: created.id,
          code: created.code,
          name: created.name,
          category: created.category,
          criticality: created.criticality,
          status: created.status,
          stationId: created.stationId,
          buildingId: created.buildingId,
          roomId: created.roomId,
          createdBy: userId,
        },
      })
    );

    return created;
  }

  async updateAsset(id: string, input: UpdateAssetInput, userId?: string): Promise<AssetSelect | null> {
    const existing = await assetsRepository.findById(id);
    if (!existing) return null;

    // Check hierarchy if station, building, or room changed
    const targetStationId = input.stationId ?? existing.stationId;
    const targetBuildingId = input.buildingId !== undefined ? input.buildingId : existing.buildingId;
    const targetRoomId = input.roomId !== undefined ? input.roomId : existing.roomId;

    if (input.stationId || input.buildingId !== undefined || input.roomId !== undefined) {
      const validation = await assetsRepository.validateHierarchy(
        targetStationId,
        targetBuildingId,
        targetRoomId
      );
      if (!validation.valid) {
        throw new Error(`Hierarchy validation failed: ${validation.error}`);
      }
    }

    const updated = await assetsRepository.update(id, {
      ...input,
      category: input.category as any,
      criticality: input.criticality as any,
      status: input.status as any,
      installDate: input.installDate ? new Date(input.installDate) : undefined,
    });

    if (!updated) return null;

    if (input.status && input.status !== existing.status) {
      await eventBus.publish(
        createDomainEvent({
          eventType: EventType.ASSET_STATUS_CHANGED,
          source: 'assets-service',
          entityId: updated.id,
          stationId: updated.stationId,
          payload: {
            assetId: updated.id,
            oldStatus: existing.status,
            newStatus: updated.status,
            updatedBy: userId,
          },
        })
      );
    } else {
      await eventBus.publish(
        createDomainEvent({
          eventType: EventType.ASSET_UPDATED,
          source: 'assets-service',
          entityId: updated.id,
          stationId: updated.stationId,
          payload: {
            assetId: updated.id,
            changes: input,
            updatedBy: userId,
          },
        })
      );
    }

    return updated;
  }

  async deleteAsset(id: string): Promise<boolean> {
    return assetsRepository.delete(id);
  }
}

export const assetsService = new AssetsService();
