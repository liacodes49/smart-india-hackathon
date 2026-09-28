import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AlertsService } from '../../src/modules/alerts/alerts.service.js';
import { alertsRepository } from '../../src/modules/alerts/alerts.repository.js';
import { eventBus } from '../../src/lib/event-bus.js';
import { EventType, AlertSeverity } from '@repo/shared';

describe('AlertsService', () => {
  let service: AlertsService;

  const mockSensor = {
    id: 'sensor-temp-1',
    stationId: 'maitri',
    assetId: 'asset-genset-1',
    name: 'Genset Coolant Temp',
    type: 'TEMPERATURE' as const,
    unit: '°C',
    status: 'NORMAL' as const,
    warningThreshold: 85,
    criticalThreshold: 95,
    minThreshold: -10,
    maxThreshold: null,
    lastReading: 70,
    lastReadingAt: new Date(),
    isActive: true,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AlertsService();
  });

  describe('evaluateReading', () => {
    it('should not create an alert when reading is within normal limits', async () => {
      vi.spyOn(alertsRepository, 'findActiveBySensor').mockResolvedValue(null);
      const createSpy = vi.spyOn(alertsRepository, 'create');
      const publishSpy = vi.spyOn(eventBus, 'publish').mockResolvedValue();

      const result = await service.evaluateReading(
        {
          sensorId: 'sensor-temp-1',
          stationId: 'maitri',
          value: 75,
          unit: '°C',
          timestamp: new Date(),
        },
        mockSensor
      );

      expect(result.breached).toBe(false);
      expect(result.alert).toBeUndefined();
      expect(createSpy).not.toHaveBeenCalled();
      expect(publishSpy).not.toHaveBeenCalled();
    });

    it('should create a WARNING alert when reading crosses warningThreshold', async () => {
      vi.spyOn(alertsRepository, 'findActiveBySensor').mockResolvedValue(null);
      const mockCreatedAlert = {
        id: 'alert-warn-1',
        stationId: 'maitri',
        sensorId: 'sensor-temp-1',
        assetId: 'asset-genset-1',
        severity: AlertSeverity.WARNING,
        status: 'ACTIVE' as const,
        category: 'ENVIRONMENTAL' as const,
        title: 'Genset Coolant Temp WARNING alert',
        message: 'Genset Coolant Temp reading of 88 °C exceeded warning limit (88 °C >= 85 °C).',
        acknowledgedBy: null,
        acknowledgedAt: null,
        resolvedBy: null,
        resolvedAt: null,
        resolutionNotes: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(alertsRepository, 'create').mockResolvedValue(mockCreatedAlert);
      const publishSpy = vi.spyOn(eventBus, 'publish').mockResolvedValue();

      const result = await service.evaluateReading(
        {
          sensorId: 'sensor-temp-1',
          stationId: 'maitri',
          value: 88,
          unit: '°C',
          timestamp: new Date(),
        },
        mockSensor
      );

      expect(result.breached).toBe(true);
      expect(result.severity).toBe(AlertSeverity.WARNING);
      expect(result.alert?.id).toBe('alert-warn-1');
      expect(alertsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: AlertSeverity.WARNING,
          status: 'ACTIVE',
          stationId: 'maitri',
        })
      );
      expect(publishSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.ALERT_TRIGGERED,
          entityId: 'alert-warn-1',
        })
      );
    });

    it('should deduplicate active alerts and prevent alert storming on repeated breached readings', async () => {
      const activeAlert = {
        id: 'active-alert-1',
        stationId: 'maitri',
        sensorId: 'sensor-temp-1',
        assetId: 'asset-genset-1',
        severity: AlertSeverity.WARNING,
        status: 'ACTIVE' as const,
        category: 'ENVIRONMENTAL' as const,
        title: 'Genset Coolant Temp WARNING alert',
        message: 'Existing warning',
        acknowledgedBy: null,
        acknowledgedAt: null,
        resolvedBy: null,
        resolvedAt: null,
        resolutionNotes: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(alertsRepository, 'findActiveBySensor').mockResolvedValue(activeAlert);
      const createSpy = vi.spyOn(alertsRepository, 'create');
      const updateSpy = vi.spyOn(alertsRepository, 'update').mockResolvedValue(activeAlert);
      const publishSpy = vi.spyOn(eventBus, 'publish');

      const result = await service.evaluateReading(
        {
          sensorId: 'sensor-temp-1',
          stationId: 'maitri',
          value: 89,
          unit: '°C',
          timestamp: new Date(),
        },
        mockSensor
      );

      // Should reuse existing alert and NOT create a new alert
      expect(result.breached).toBe(true);
      expect(result.isNew).toBe(false);
      expect(result.alert?.id).toBe('active-alert-1');
      expect(createSpy).not.toHaveBeenCalled();
      expect(updateSpy).toHaveBeenCalledTimes(1);
      expect(publishSpy).not.toHaveBeenCalled();
    });

    it('should escalate WARNING alert to CRITICAL when reading reaches criticalThreshold', async () => {
      const activeWarningAlert = {
        id: 'active-alert-1',
        stationId: 'maitri',
        sensorId: 'sensor-temp-1',
        assetId: 'asset-genset-1',
        severity: AlertSeverity.WARNING,
        status: 'ACTIVE' as const,
        category: 'ENVIRONMENTAL' as const,
        title: 'Genset Coolant Temp WARNING alert',
        message: 'Existing warning',
        acknowledgedBy: null,
        acknowledgedAt: null,
        resolvedBy: null,
        resolvedAt: null,
        resolutionNotes: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const escalatedAlert = { ...activeWarningAlert, severity: AlertSeverity.CRITICAL };

      vi.spyOn(alertsRepository, 'findActiveBySensor').mockResolvedValue(activeWarningAlert);
      vi.spyOn(alertsRepository, 'update').mockResolvedValue(escalatedAlert);
      const publishSpy = vi.spyOn(eventBus, 'publish').mockResolvedValue();

      const result = await service.evaluateReading(
        {
          sensorId: 'sensor-temp-1',
          stationId: 'maitri',
          value: 98,
          unit: '°C',
          timestamp: new Date(),
        },
        mockSensor
      );

      expect(result.breached).toBe(true);
      expect(result.severity).toBe(AlertSeverity.CRITICAL);
      expect(alertsRepository.update).toHaveBeenCalledWith(
        'active-alert-1',
        expect.objectContaining({
          severity: AlertSeverity.CRITICAL,
        })
      );
      expect(publishSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.ALERT_ESCALATED,
          entityId: 'active-alert-1',
        })
      );
    });

    it('should automatically resolve active alert when reading returns to normal parameters', async () => {
      const activeAlert = {
        id: 'active-alert-1',
        stationId: 'maitri',
        sensorId: 'sensor-temp-1',
        assetId: 'asset-genset-1',
        severity: AlertSeverity.CRITICAL,
        status: 'ACTIVE' as const,
        category: 'ENVIRONMENTAL' as const,
        title: 'Coolant overheat',
        message: 'Coolant overheat',
        acknowledgedBy: null,
        acknowledgedAt: null,
        resolvedBy: null,
        resolvedAt: null,
        resolutionNotes: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(alertsRepository, 'findActiveBySensor').mockResolvedValue(activeAlert);
      const resolveSpy = vi.spyOn(alertsRepository, 'resolve').mockResolvedValue({
        ...activeAlert,
        status: 'RESOLVED',
        resolvedAt: new Date(),
      });
      const publishSpy = vi.spyOn(eventBus, 'publish').mockResolvedValue();

      const result = await service.evaluateReading(
        {
          sensorId: 'sensor-temp-1',
          stationId: 'maitri',
          value: 70,
          unit: '°C',
          timestamp: new Date(),
        },
        mockSensor
      );

      expect(result.breached).toBe(false);
      expect(result.recovered).toBe(true);
      expect(resolveSpy).toHaveBeenCalledWith(
        'active-alert-1',
        undefined,
        expect.stringContaining('Auto-recovered')
      );
      expect(publishSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.ALERT_RESOLVED,
          entityId: 'active-alert-1',
        })
      );
    });
  });

  describe('Lifecycle Management', () => {
    it('should acknowledge an active alert and emit ALERT_ACKNOWLEDGED', async () => {
      const activeAlert = {
        id: 'alert-1',
        stationId: 'maitri',
        sensorId: 'sensor-temp-1',
        assetId: 'asset-genset-1',
        severity: AlertSeverity.CRITICAL,
        status: 'ACTIVE' as const,
        category: 'ENVIRONMENTAL' as const,
        title: 'Coolant overheat',
        message: 'Coolant overheat',
        acknowledgedBy: null,
        acknowledgedAt: null,
        resolvedBy: null,
        resolvedAt: null,
        resolutionNotes: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(alertsRepository, 'acknowledge').mockResolvedValue({
        ...activeAlert,
        status: 'ACKNOWLEDGED',
        acknowledgedBy: 'station-chief-1',
        acknowledgedAt: new Date(),
      });
      const publishSpy = vi.spyOn(eventBus, 'publish').mockResolvedValue();

      const result = await service.acknowledgeAlert('alert-1', {
        acknowledgedBy: 'station-chief-1',
        notes: 'Investigating coolant loop',
      });

      expect(result?.status).toBe('ACKNOWLEDGED');
      expect(alertsRepository.acknowledge).toHaveBeenCalledWith(
        'alert-1',
        'station-chief-1',
        'Investigating coolant loop'
      );
      expect(publishSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.ALERT_ACKNOWLEDGED,
          entityId: 'alert-1',
        })
      );
    });

    it('should resolve an alert and emit ALERT_RESOLVED', async () => {
      const activeAlert = {
        id: 'alert-1',
        stationId: 'maitri',
        sensorId: 'sensor-temp-1',
        assetId: 'asset-genset-1',
        severity: AlertSeverity.CRITICAL,
        status: 'ACTIVE' as const,
        category: 'ENVIRONMENTAL' as const,
        title: 'Coolant overheat',
        message: 'Coolant overheat',
        acknowledgedBy: null,
        acknowledgedAt: null,
        resolvedBy: null,
        resolvedAt: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(alertsRepository, 'resolve').mockResolvedValue({
        ...activeAlert,
        status: 'RESOLVED',
        resolvedBy: 'tech-1',
        resolvedAt: new Date(),
      });
      const publishSpy = vi.spyOn(eventBus, 'publish').mockResolvedValue();

      const result = await service.resolveAlert('alert-1', 'tech-1', 'Coolant topped off');

      expect(result?.status).toBe('RESOLVED');
      expect(publishSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.ALERT_RESOLVED,
          entityId: 'alert-1',
        })
      );
    });
  });
});
