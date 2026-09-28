// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Inventory Service
// ═══════════════════════════════════════════════════════════════
// Business logic for polar supplies, atomic stock consumption,
// threshold crossing detection, and automated operational alerting.
// ═══════════════════════════════════════════════════════════════

import {
  inventoryRepository,
  FindInventoryFilter,
  InventoryItemSelect,
  ResourceConsumptionSelect,
} from './inventory.repository.js';
import { alertsService } from '../alerts/alerts.service.js';
import { eventBus } from '../../lib/event-bus.js';
import { createDomainEvent, EventType, AlertSeverity } from '@repo/shared';
import type {
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  ConsumeResourceInput,
} from '@repo/schemas';

export class InventoryService {
  async getInventory(filters?: FindInventoryFilter) {
    return inventoryRepository.findAll(filters);
  }

  async getInventoryItemById(id: string): Promise<InventoryItemSelect | null> {
    return inventoryRepository.findById(id);
  }

  async createInventoryItem(
    input: CreateInventoryItemInput,
    userId?: string
  ): Promise<InventoryItemSelect> {
    const existing = await inventoryRepository.findByCode(input.code);
    if (existing) {
      throw new Error(`Inventory item with code '${input.code}' already exists`);
    }

    const created = await inventoryRepository.create({
      stationId: input.stationId,
      name: input.name,
      code: input.code,
      category: input.category as any,
      currentStock: input.currentStock,
      minimumThreshold: input.minimumThreshold,
      unit: input.unit,
      location: input.location ?? null,
      expirationDate: input.expirationDate ? new Date(input.expirationDate) : null,
      resupplyDate: input.resupplyDate ? new Date(input.resupplyDate) : null,
      metadata: input.metadata ?? null,
    });

    await eventBus.publish(
      createDomainEvent({
        eventType: EventType.INVENTORY_ITEM_CREATED,
        source: 'inventory-service',
        entityId: created.id,
        stationId: created.stationId,
        payload: {
          itemId: created.id,
          name: created.name,
          code: created.code,
          category: created.category,
          currentStock: created.currentStock,
          minimumThreshold: created.minimumThreshold,
          unit: created.unit,
          createdBy: userId,
        },
      })
    );

    return created;
  }

  async updateInventoryItem(
    id: string,
    input: UpdateInventoryItemInput,
    userId?: string
  ): Promise<InventoryItemSelect | null> {
    const existing = await inventoryRepository.findById(id);
    if (!existing) return null;

    const updated = await inventoryRepository.update(id, {
      ...input,
      category: input.category as any,
      expirationDate: input.expirationDate ? new Date(input.expirationDate) : undefined,
      resupplyDate: input.resupplyDate ? new Date(input.resupplyDate) : undefined,
    });

    if (!updated) return null;

    if (input.currentStock !== undefined && input.currentStock !== existing.currentStock) {
      await eventBus.publish(
        createDomainEvent({
          eventType: EventType.INVENTORY_LEVEL_CHANGED,
          source: 'inventory-service',
          entityId: updated.id,
          stationId: updated.stationId,
          payload: {
            itemId: updated.id,
            oldStock: existing.currentStock,
            newStock: updated.currentStock,
            unit: updated.unit,
            updatedBy: userId,
          },
        })
      );
    }

    return updated;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    return inventoryRepository.delete(id);
  }

  /**
   * Atomic resource consumption with strict negative stock rejection
   * and threshold breach alerting.
   */
  async consumeResource(
    itemId: string,
    input: ConsumeResourceInput,
    userId?: string
  ): Promise<{ item: InventoryItemSelect; consumption: ResourceConsumptionSelect }> {
    const item = await inventoryRepository.findById(itemId);
    if (!item) {
      throw new Error(`Inventory item '${itemId}' not found`);
    }

    if (item.currentStock < input.quantity) {
      throw new Error(
        `Insufficient stock: Cannot consume ${input.quantity} ${item.unit}. Available stock is ${item.currentStock} ${item.unit}.`
      );
    }

    // Atomic decrement
    const updated = await inventoryRepository.adjustStock(itemId, -input.quantity);
    if (!updated) {
      throw new Error('Concurrent stock modification: Please retry.');
    }

    // Record consumption transaction
    const consumption = await inventoryRepository.recordConsumption({
      inventoryItemId: item.id,
      stationId: item.stationId,
      assetId: input.assetId ?? null,
      quantity: input.quantity,
      unit: item.unit,
      loggedAt: new Date(),
      loggedBy: userId ?? input.loggedBy ?? null,
      notes: input.notes ?? null,
    });

    // Emit consumption event
    await eventBus.publish(
      createDomainEvent({
        eventType: EventType.RESOURCE_CONSUMPTION_RECORDED,
        source: 'inventory-service',
        entityId: consumption.id,
        stationId: item.stationId,
        payload: {
          consumptionId: consumption.id,
          itemId: item.id,
          quantity: input.quantity,
          unit: item.unit,
          assetId: input.assetId,
          remainingStock: updated.currentStock,
        },
      })
    );

    // Emit inventory level change
    await eventBus.publish(
      createDomainEvent({
        eventType: EventType.INVENTORY_LEVEL_CHANGED,
        source: 'inventory-service',
        entityId: item.id,
        stationId: item.stationId,
        payload: {
          itemId: item.id,
          name: item.name,
          oldStock: item.currentStock,
          newStock: updated.currentStock,
          unit: item.unit,
        },
      })
    );

    // Check low-stock threshold crossing
    if (updated.currentStock < item.minimumThreshold) {
      const severity = updated.currentStock === 0 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING;

      await eventBus.publish(
        createDomainEvent({
          eventType: EventType.INVENTORY_THRESHOLD_CROSSED,
          source: 'inventory-service',
          entityId: item.id,
          stationId: item.stationId,
          payload: {
            itemId: item.id,
            name: item.name,
            code: item.code,
            category: item.category,
            currentStock: updated.currentStock,
            minimumThreshold: item.minimumThreshold,
            unit: item.unit,
          },
        })
      );

      // Automatically raise operational alert in Alert Engine
      await alertsService.createAlert(
        {
          stationId: item.stationId,
          title: `Low Stock Alert: ${item.name}`,
          message: `Inventory reserve for ${item.name} (${item.code}) is below critical reserve: ${updated.currentStock} ${item.unit} remaining (threshold: ${item.minimumThreshold} ${item.unit}).`,
          severity,
          category: 'EQUIPMENT' as any,
        },
        userId
      );
    }

    return { item: updated, consumption };
  }

  async getLowStockItems(stationIdOrCode: string): Promise<InventoryItemSelect[]> {
    return inventoryRepository.findLowStock(stationIdOrCode);
  }

  async getConsumptionHistory(itemId: string): Promise<ResourceConsumptionSelect[]> {
    return inventoryRepository.getConsumptionHistory(itemId);
  }
}

export const inventoryService = new InventoryService();
