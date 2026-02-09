/**
 * In-memory Domain Event Dispatcher.
 * Dispatches events to registered handlers synchronously.
 */

import type { DomainEvent } from '@/shared/domain/domain-event.base';
import type {
  IDomainEventDispatcher,
  IEventHandler,
} from '@/shared/application/ports/domain-event-dispatcher.interface';

export class InMemoryDomainEventDispatcher implements IDomainEventDispatcher {
  private handlers = new Map<string, IEventHandler[]>();

  register(eventType: string, handler: IEventHandler): void {
    const existing = this.handlers.get(eventType) ?? [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
  }

  async dispatch(events: readonly DomainEvent[]): Promise<void> {
    for (const event of events) {
      const eventHandlers = this.handlers.get(event.eventType) ?? [];
      for (const handler of eventHandlers) {
        await handler.handle(event);
      }
    }
  }
}
