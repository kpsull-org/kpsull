/**
 * Domain Event Dispatcher port.
 * Dispatches domain events to registered handlers.
 */

import type { DomainEvent } from '@/shared/domain/domain-event.base';

export interface IEventHandler<T extends DomainEvent = DomainEvent> {
  handle(event: T): Promise<void>;
}

export interface IDomainEventDispatcher {
  dispatch(events: readonly DomainEvent[]): Promise<void>;
  register(eventType: string, handler: IEventHandler): void;
}
