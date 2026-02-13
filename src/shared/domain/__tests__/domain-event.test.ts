import { describe, it, expect } from 'vitest';
import { BaseDomainEvent } from '../domain-event.base';

class TestEvent extends BaseDomainEvent<{ name: string }> {
  readonly eventType = 'TestEvent';
}

describe('BaseDomainEvent', () => {
  it('should create an event with aggregateId and payload', () => {
    const event = new TestEvent('agg-123', { name: 'test' });

    expect(event.aggregateId).toBe('agg-123');
    expect(event.payload.name).toBe('test');
    expect(event.eventType).toBe('TestEvent');
  });

  it('should set occurredAt to current date', () => {
    const before = new Date();
    const event = new TestEvent('agg-1', { name: 'x' });
    const after = new Date();

    expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
