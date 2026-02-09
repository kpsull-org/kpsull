import { describe, it, expect, vi } from 'vitest';
import { InMemoryDomainEventDispatcher } from '../domain-event-dispatcher';
import type { DomainEvent } from '@/shared/domain/domain-event.base';
import type { IEventHandler } from '@/shared/application/ports/domain-event-dispatcher.interface';

function createEvent(eventType: string, aggregateId: string = 'agg-1'): DomainEvent {
  return {
    eventType,
    aggregateId,
    occurredAt: new Date(),
    payload: {},
  };
}

describe('InMemoryDomainEventDispatcher', () => {
  it('should dispatch events to registered handlers', async () => {
    const dispatcher = new InMemoryDomainEventDispatcher();
    const handler: IEventHandler = { handle: vi.fn() };

    dispatcher.register('UserCreated', handler);
    await dispatcher.dispatch([createEvent('UserCreated')]);

    expect(handler.handle).toHaveBeenCalledOnce();
  });

  it('should dispatch to multiple handlers for the same event type', async () => {
    const dispatcher = new InMemoryDomainEventDispatcher();
    const handler1: IEventHandler = { handle: vi.fn() };
    const handler2: IEventHandler = { handle: vi.fn() };

    dispatcher.register('OrderPlaced', handler1);
    dispatcher.register('OrderPlaced', handler2);
    await dispatcher.dispatch([createEvent('OrderPlaced')]);

    expect(handler1.handle).toHaveBeenCalledOnce();
    expect(handler2.handle).toHaveBeenCalledOnce();
  });

  it('should not fail when no handlers are registered for an event', async () => {
    const dispatcher = new InMemoryDomainEventDispatcher();

    await expect(
      dispatcher.dispatch([createEvent('UnhandledEvent')])
    ).resolves.toBeUndefined();
  });

  it('should dispatch multiple events in order', async () => {
    const dispatcher = new InMemoryDomainEventDispatcher();
    const calls: string[] = [];

    dispatcher.register('EventA', {
      handle: async () => { calls.push('A'); },
    });
    dispatcher.register('EventB', {
      handle: async () => { calls.push('B'); },
    });

    await dispatcher.dispatch([createEvent('EventA'), createEvent('EventB')]);

    expect(calls).toEqual(['A', 'B']);
  });

  it('should only dispatch to matching event type handlers', async () => {
    const dispatcher = new InMemoryDomainEventDispatcher();
    const handlerA: IEventHandler = { handle: vi.fn() };
    const handlerB: IEventHandler = { handle: vi.fn() };

    dispatcher.register('EventA', handlerA);
    dispatcher.register('EventB', handlerB);
    await dispatcher.dispatch([createEvent('EventA')]);

    expect(handlerA.handle).toHaveBeenCalledOnce();
    expect(handlerB.handle).not.toHaveBeenCalled();
  });
});
