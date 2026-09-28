// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — In-Memory Domain Event Bus
// ═══════════════════════════════════════════════════════════════
// Asynchronous decoupled inter-module event bus supporting typed
// subscriptions, wildcard listeners, error isolation, and logging.
// ═══════════════════════════════════════════════════════════════

import { DomainEvent, EventType } from '@repo/shared';
import { logger } from '../config/logger.js';

export type EventHandler<T = unknown> = (event: DomainEvent<T>) => Promise<void> | void;

export interface EventBusSubscription {
  id: string;
  eventType: string;
  handler: EventHandler;
}

export class DomainEventBus {
  private handlers = new Map<string, Set<EventHandler<any>>>();
  private globalHandlers = new Set<EventHandler<any>>();

  /**
   * Publish a domain event to all registered topic and wildcard subscribers.
   * Execution is non-blocking to the caller and handles failures gracefully.
   */
  async publish<T = unknown>(event: DomainEvent<T>): Promise<void> {
    const eventTypeStr = String(event.eventType);

    logger.debug(`[EventBus] Publishing event: ${eventTypeStr} (${event.eventId})`, {
      source: event.source,
      entityId: event.entityId,
      stationId: event.stationId,
      correlationId: event.correlationId,
    });

    const specificHandlers = this.handlers.get(eventTypeStr) ?? new Set();
    const allHandlers = [...specificHandlers, ...this.globalHandlers];

    if (allHandlers.length === 0) {
      logger.debug(`[EventBus] No handlers registered for ${eventTypeStr}`);
      return;
    }

    // Execute handlers with error isolation so one failing handler does not disrupt others
    const promises = allHandlers.map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        logger.error(`[EventBus] Error in event handler for ${eventTypeStr}:`, {
          eventId: event.eventId,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Subscribe to a specific domain event type.
   * Returns an unsubscribe function.
   */
  subscribe<T = unknown>(
    eventType: EventType | string,
    handler: EventHandler<T>
  ): () => void {
    const key = String(eventType);
    if (!this.handlers.has(key)) {
      this.handlers.set(key, new Set());
    }

    const set = this.handlers.get(key)!;
    set.add(handler as EventHandler<any>);

    logger.debug(`[EventBus] Subscribed handler to ${key}. Total listeners: ${set.size}`);

    return () => {
      set.delete(handler as EventHandler<any>);
      if (set.size === 0) {
        this.handlers.delete(key);
      }
    };
  }

  /**
   * Subscribe to all published events (useful for audit logging, realtime websocket broadcast, etc.).
   * Returns an unsubscribe function.
   */
  subscribeAll(handler: EventHandler<any>): () => void {
    this.globalHandlers.add(handler);
    logger.debug(`[EventBus] Added global event listener. Total global listeners: ${this.globalHandlers.size}`);

    return () => {
      this.globalHandlers.delete(handler);
    };
  }

  /**
   * Clear all subscriptions (primarily used for unit testing teardown)
   */
  clear(): void {
    this.handlers.clear();
    this.globalHandlers.clear();
  }
}

// Singleton event bus instance for the application lifecycle
export const eventBus = new DomainEventBus();
