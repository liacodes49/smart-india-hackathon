import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DomainEventBus } from '../../src/lib/event-bus.js';
import { createDomainEvent, EventType } from '@repo/shared';

describe('DomainEventBus', () => {
  let bus: DomainEventBus;

  beforeEach(() => {
    bus = new DomainEventBus();
  });

  it('should deliver events to subscribed topic handlers', async () => {
    const handler = vi.fn();
    bus.subscribe(EventType.STATION_CREATED, handler);

    const event = createDomainEvent({
      eventType: EventType.STATION_CREATED,
      source: 'test',
      entityId: 'station-1',
      payload: { name: 'Maitri' },
    });

    await bus.publish(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('should deliver all events to global subscribers', async () => {
    const globalHandler = vi.fn();
    bus.subscribeAll(globalHandler);

    const event1 = createDomainEvent({
      eventType: EventType.STATION_CREATED,
      source: 'test',
      entityId: 'station-1',
      payload: {},
    });
    const event2 = createDomainEvent({
      eventType: EventType.ALERT_RAISED,
      source: 'test',
      entityId: 'alert-1',
      payload: {},
    });

    await bus.publish(event1);
    await bus.publish(event2);

    expect(globalHandler).toHaveBeenCalledTimes(2);
  });

  it('should unsubscribe when calling the returned cleanup function', async () => {
    const handler = vi.fn();
    const unsubscribe = bus.subscribe(EventType.STATION_CREATED, handler);

    unsubscribe();

    const event = createDomainEvent({
      eventType: EventType.STATION_CREATED,
      source: 'test',
      entityId: 'station-1',
      payload: {},
    });

    await bus.publish(event);
    expect(handler).not.toHaveBeenCalled();
  });

  it('should isolate errors in one subscriber from affecting others', async () => {
    const faultyHandler = vi.fn().mockRejectedValue(new Error('Handler explosion'));
    const healthyHandler = vi.fn();

    bus.subscribe(EventType.STATION_CREATED, faultyHandler);
    bus.subscribe(EventType.STATION_CREATED, healthyHandler);

    const event = createDomainEvent({
      eventType: EventType.STATION_CREATED,
      source: 'test',
      entityId: 'station-1',
      payload: {},
    });

    await bus.publish(event);

    expect(faultyHandler).toHaveBeenCalledTimes(1);
    expect(healthyHandler).toHaveBeenCalledTimes(1);
  });
});
