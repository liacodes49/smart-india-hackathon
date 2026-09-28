import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryService } from '../../src/modules/inventory/inventory.service.js';
import { inventoryRepository } from '../../src/modules/inventory/inventory.repository.js';
import { alertsService } from '../../src/modules/alerts/alerts.service.js';
import { eventBus } from '../../src/lib/event-bus.js';
import { EventType, AlertSeverity } from '@repo/shared';

describe('InventoryService', () => {
  let service: InventoryService;

  const mockItem = {
    id: 'inv-diesel-1',
    stationId: 'maitri',
    name: 'Arctic Diesel Grade A',
    code: 'FUEL-DSL-01',
    category: 'FUEL' as const,
    currentStock: 5000,
    unit: 'L',
    minimumThreshold: 2000,
    reorderQuantity: 20000,
    location: 'Fuel Farm Tank 1',
    expirationDate: null,
    resupplyDate: null,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InventoryService();
  });

  describe('consumeResource', () => {
    it('should safely consume resources and record audit log when stock is sufficient', async () => {
      vi.spyOn(inventoryRepository, 'findById').mockResolvedValue(mockItem);
      const updatedItem = { ...mockItem, currentStock: 4600 };
      vi.spyOn(inventoryRepository, 'adjustStock').mockResolvedValue(updatedItem);
      const mockConsumptionRecord = {
        id: 'cons-1',
        inventoryItemId: 'inv-diesel-1',
        stationId: 'maitri',
        assetId: null,
        quantity: 400,
        unit: 'L',
        loggedBy: 'engineer-1',
        notes: 'Genset daily run',
        loggedAt: new Date(),
        createdAt: new Date(),
      };
      vi.spyOn(inventoryRepository, 'recordConsumption').mockResolvedValue(mockConsumptionRecord);
      const publishSpy = vi.spyOn(eventBus, 'publish').mockResolvedValue();

      const result = await service.consumeResource('inv-diesel-1', {
        quantity: 400,
        loggedBy: 'engineer-1',
        notes: 'Genset daily run',
      });

      expect(result.item.currentStock).toBe(4600);
      expect(result.consumption.id).toBe('cons-1');
      expect(inventoryRepository.adjustStock).toHaveBeenCalledWith('inv-diesel-1', -400);
      expect(publishSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.RESOURCE_CONSUMPTION_RECORDED,
          entityId: 'cons-1',
          stationId: 'maitri',
        })
      );
    });

    it('should strictly reject consumption that would cause negative stock', async () => {
      vi.spyOn(inventoryRepository, 'findById').mockResolvedValue(mockItem);
      const adjustSpy = vi.spyOn(inventoryRepository, 'adjustStock');

      // Available stock is 5000, requested consumption is 6000
      await expect(
        service.consumeResource('inv-diesel-1', {
          quantity: 6000,
          loggedBy: 'engineer-1',
        })
      ).rejects.toThrow(/insufficient stock/i);

      expect(adjustSpy).not.toHaveBeenCalled();
    });

    it('should trigger alert and emit INVENTORY_THRESHOLD_CROSSED when stock falls below threshold', async () => {
      vi.spyOn(inventoryRepository, 'findById').mockResolvedValue(mockItem);
      // Consuming 4500 drops stock to 500, which is below minimumThreshold (2000)
      const lowStockItem = { ...mockItem, currentStock: 500 };
      vi.spyOn(inventoryRepository, 'adjustStock').mockResolvedValue(lowStockItem);
      vi.spyOn(inventoryRepository, 'recordConsumption').mockResolvedValue({
        id: 'cons-2',
        inventoryItemId: 'inv-diesel-1',
        stationId: 'maitri',
        assetId: null,
        quantity: 4500,
        unit: 'L',
        loggedBy: 'engineer-1',
        notes: 'Refueling reserve',
        loggedAt: new Date(),
        createdAt: new Date(),
      });
      const alertSpy = vi.spyOn(alertsService, 'createAlert').mockResolvedValue({
        id: 'alert-low-stock-1',
      } as any);
      const publishSpy = vi.spyOn(eventBus, 'publish').mockResolvedValue();

      await service.consumeResource('inv-diesel-1', {
        quantity: 4500,
        loggedBy: 'engineer-1',
      });

      expect(alertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          stationId: 'maitri',
          severity: AlertSeverity.WARNING,
        }),
        undefined
      );

      expect(publishSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.INVENTORY_THRESHOLD_CROSSED,
          entityId: 'inv-diesel-1',
        })
      );
    });
  });
});
