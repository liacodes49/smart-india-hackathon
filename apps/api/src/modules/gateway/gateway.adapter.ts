// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Industrial Telemetry Gateway Adapters
// ═══════════════════════════════════════════════════════════════
// Strongly typed protocol adapters normalizing REST, MQTT, Modbus,
// and Manual field telemetry payloads into the canonical contract.
// ═══════════════════════════════════════════════════════════════

import {
  GatewayProtocol,
  DataProvenance,
  SensorStatus,
  type GatewayNormalizationResult,
  type SyncBatchReadingItem,
} from '@repo/shared';

export interface IGatewayAdapter {
  readonly protocol: GatewayProtocol;
  normalize(rawPayload: unknown, stationId: string): GatewayNormalizationResult;
}

/**
 * 1. REST Adapter — Standard JSON payloads
 */
export class RestGatewayAdapter implements IGatewayAdapter {
  readonly protocol = GatewayProtocol.REST;

  normalize(raw: unknown, stationId: string): GatewayNormalizationResult {
    const readings: SyncBatchReadingItem[] = [];
    const quarantined: Array<{ raw: unknown; reason: string; code: string }> = [];

    if (!raw || typeof raw !== 'object') {
      return {
        success: false,
        readings: [],
        quarantined: [{ raw, reason: 'Payload must be an object or array', code: 'INVALID_PAYLOAD' }],
      };
    }

    const items: unknown[] = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as any).readings)
        ? (raw as any).readings
        : [raw];

    for (const item of items) {
      if (!item || typeof item !== 'object') {
        quarantined.push({ raw: item, reason: 'Reading item is not an object', code: 'MALFORMED_ITEM' });
        continue;
      }

      const rec = item as Record<string, unknown>;
      const sensorId = String(rec.sensorId ?? rec.id ?? '');
      const value = typeof rec.value === 'number' ? rec.value : Number(rec.value);
      const unit = String(rec.unit ?? '');
      const timestamp = rec.timestamp ? String(rec.timestamp) : new Date().toISOString();

      if (!sensorId) {
        quarantined.push({ raw: item, reason: 'Missing sensorId', code: 'MISSING_SENSOR_ID' });
        continue;
      }
      if (isNaN(value)) {
        quarantined.push({ raw: item, reason: `Value '${rec.value}' is not a valid number`, code: 'INVALID_NUMERIC_VALUE' });
        continue;
      }
      if (!unit) {
        quarantined.push({ raw: item, reason: 'Missing unit of measurement', code: 'MISSING_UNIT' });
        continue;
      }

      readings.push({
        sensorId,
        stationId,
        value,
        unit,
        timestamp,
        status: (rec.status as any) ?? SensorStatus.NORMAL,
        quality: typeof rec.quality === 'number' ? rec.quality : 100,
        provenance: DataProvenance.SENSOR,
      });
    }

    return {
      success: readings.length > 0,
      readings,
      quarantined,
    };
  }
}

/**
 * 2. MQTT Adapter — Industrial IoT tag and metric arrays
 * Supports standard formats: { topic, d: { tags: [{ id, val, unit, ts }] } }
 * or { metrics: { [key]: { value, unit, timestamp } } }
 */
export class MqttGatewayAdapter implements IGatewayAdapter {
  readonly protocol = GatewayProtocol.MQTT;

  normalize(raw: unknown, stationId: string): GatewayNormalizationResult {
    const readings: SyncBatchReadingItem[] = [];
    const quarantined: Array<{ raw: unknown; reason: string; code: string }> = [];

    if (!raw || typeof raw !== 'object') {
      return {
        success: false,
        readings: [],
        quarantined: [{ raw, reason: 'MQTT payload must be a JSON object', code: 'INVALID_MQTT_PAYLOAD' }],
      };
    }

    const payloadObj = raw as Record<string, any>;

    // Case A: SCADA/IoT d.tags array format
    if (payloadObj.d && Array.isArray(payloadObj.d.tags)) {
      for (const tag of payloadObj.d.tags) {
        const sensorId = String(tag.id ?? tag.tag ?? tag.sensorId ?? '');
        const value = typeof tag.val === 'number' ? tag.val : Number(tag.val ?? tag.value);
        const unit = String(tag.unit ?? tag.u ?? '');
        const timestamp = tag.ts
          ? (typeof tag.ts === 'number' ? new Date(tag.ts).toISOString() : String(tag.ts))
          : new Date().toISOString();

        if (!sensorId) {
          quarantined.push({ raw: tag, reason: 'Missing tag/sensor identifier', code: 'MISSING_TAG_ID' });
          continue;
        }
        if (isNaN(value)) {
          quarantined.push({ raw: tag, reason: 'Invalid tag numeric value', code: 'INVALID_TAG_VAL' });
          continue;
        }
        if (!unit) {
          quarantined.push({ raw: tag, reason: 'Missing unit of measurement', code: 'MISSING_UNIT' });
          continue;
        }

        readings.push({
          sensorId,
          stationId,
          value,
          unit,
          timestamp,
          status: SensorStatus.NORMAL,
          quality: 100,
          provenance: DataProvenance.SENSOR,
        });
      }
    }
    // Case B: Key-value metrics map: { metrics: { 'sensor-id': { value, unit } } }
    else if (payloadObj.metrics && typeof payloadObj.metrics === 'object') {
      for (const [key, metric] of Object.entries(payloadObj.metrics)) {
        if (!metric || typeof metric !== 'object') {
          quarantined.push({ raw: { [key]: metric }, reason: 'Metric entry is not an object', code: 'INVALID_METRIC' });
          continue;
        }
        const m = metric as Record<string, any>;
        const value = typeof m.value === 'number' ? m.value : Number(m.value);
        const unit = String(m.unit ?? '');
        const timestamp = m.timestamp ? String(m.timestamp) : new Date().toISOString();

        if (isNaN(value)) {
          quarantined.push({ raw: { [key]: metric }, reason: 'Invalid metric value', code: 'INVALID_METRIC_VAL' });
          continue;
        }
        if (!unit) {
          quarantined.push({ raw: { [key]: metric }, reason: 'Missing unit for metric', code: 'MISSING_UNIT' });
          continue;
        }

        readings.push({
          sensorId: key,
          stationId,
          value,
          unit,
          timestamp,
          status: (m.status as any) ?? SensorStatus.NORMAL,
          quality: 100,
          provenance: DataProvenance.SENSOR,
        });
      }
    } else {
      quarantined.push({
        raw,
        reason: "Unrecognized MQTT schema: expected 'd.tags' array or 'metrics' object",
        code: 'UNSUPPORTED_MQTT_FORMAT',
      });
    }

    return {
      success: readings.length > 0,
      readings,
      quarantined,
    };
  }
}

/**
 * 3. Modbus Adapter — Register-based mapping
 * Supports register payloads: { slaveId: number, registers: [{ address, value, sensorId, unit, timestamp }] }
 */
export class ModbusGatewayAdapter implements IGatewayAdapter {
  readonly protocol = GatewayProtocol.MODBUS;

  normalize(raw: unknown, stationId: string): GatewayNormalizationResult {
    const readings: SyncBatchReadingItem[] = [];
    const quarantined: Array<{ raw: unknown; reason: string; code: string }> = [];

    if (!raw || typeof raw !== 'object') {
      return {
        success: false,
        readings: [],
        quarantined: [{ raw, reason: 'Modbus payload must be a JSON object', code: 'INVALID_MODBUS_PAYLOAD' }],
      };
    }

    const payloadObj = raw as Record<string, any>;
    const registers = Array.isArray(payloadObj.registers) ? payloadObj.registers : [];

    if (registers.length === 0) {
      return {
        success: false,
        readings: [],
        quarantined: [{ raw, reason: 'No registers array found in Modbus payload', code: 'EMPTY_REGISTERS' }],
      };
    }

    for (const reg of registers) {
      if (!reg || typeof reg !== 'object') {
        quarantined.push({ raw: reg, reason: 'Register item is not an object', code: 'INVALID_REGISTER_ITEM' });
        continue;
      }

      // Sensor ID can be specified directly or derived from slave:address
      const sensorId = reg.sensorId
        ? String(reg.sensorId)
        : `modbus-slave-${payloadObj.slaveId ?? 1}-reg-${reg.address ?? 0}`;
      const value = typeof reg.value === 'number' ? reg.value : Number(reg.value);
      const unit = String(reg.unit ?? 'raw');
      const timestamp = reg.timestamp ? String(reg.timestamp) : new Date().toISOString();

      if (isNaN(value)) {
        quarantined.push({ raw: reg, reason: `Register value '${reg.value}' is not a valid number`, code: 'INVALID_REGISTER_VALUE' });
        continue;
      }
      if (!reg.sensorId && !reg.unit) {
        quarantined.push({ raw: reg, reason: 'Unmapped Modbus register: missing sensorId and unit', code: 'UNMAPPED_REGISTER' });
        continue;
      }

      readings.push({
        sensorId,
        stationId,
        value,
        unit,
        timestamp,
        status: SensorStatus.NORMAL,
        quality: 100,
        provenance: DataProvenance.SENSOR,
      });
    }

    return {
      success: readings.length > 0,
      readings,
      quarantined,
    };
  }
}

/**
 * 4. Manual Adapter — Operator field log entry
 * Supports: { operatorId, readings: [{ sensorId, value, unit, loggedAt, notes }] }
 */
export class ManualGatewayAdapter implements IGatewayAdapter {
  readonly protocol = GatewayProtocol.MANUAL;

  normalize(raw: unknown, stationId: string): GatewayNormalizationResult {
    const readings: SyncBatchReadingItem[] = [];
    const quarantined: Array<{ raw: unknown; reason: string; code: string }> = [];

    if (!raw || typeof raw !== 'object') {
      return {
        success: false,
        readings: [],
        quarantined: [{ raw, reason: 'Manual log payload must be an object', code: 'INVALID_MANUAL_PAYLOAD' }],
      };
    }

    const payloadObj = raw as Record<string, any>;
    const items = Array.isArray(payloadObj.readings)
      ? payloadObj.readings
      : Array.isArray(raw)
        ? raw
        : [raw];

    for (const item of items) {
      if (!item || typeof item !== 'object') {
        quarantined.push({ raw: item, reason: 'Log item is not an object', code: 'INVALID_LOG_ITEM' });
        continue;
      }
      const rec = item as Record<string, any>;
      const sensorId = String(rec.sensorId ?? '');
      const value = typeof rec.value === 'number' ? rec.value : Number(rec.value);
      const unit = String(rec.unit ?? '');
      const timestamp = rec.loggedAt || rec.timestamp ? String(rec.loggedAt || rec.timestamp) : new Date().toISOString();

      if (!sensorId) {
        quarantined.push({ raw: item, reason: 'Missing sensorId in manual log', code: 'MISSING_SENSOR_ID' });
        continue;
      }
      if (isNaN(value)) {
        quarantined.push({ raw: item, reason: 'Manual log value is not numeric', code: 'INVALID_NUMERIC_VALUE' });
        continue;
      }
      if (!unit) {
        quarantined.push({ raw: item, reason: 'Missing unit of measurement', code: 'MISSING_UNIT' });
        continue;
      }

      readings.push({
        sensorId,
        stationId,
        value,
        unit,
        timestamp,
        status: (rec.status as any) ?? SensorStatus.NORMAL,
        quality: 90, // Manual readings tagged with 90% quality
        provenance: DataProvenance.MANUAL,
      });
    }

    return {
      success: readings.length > 0,
      readings,
      quarantined,
    };
  }
}
