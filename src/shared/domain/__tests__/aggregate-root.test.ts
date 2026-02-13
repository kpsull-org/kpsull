import { describe, it, expect } from 'vitest';
import { AggregateRoot } from '../aggregate-root.base';
import { UniqueId } from '../unique-id.vo';
import type { DomainEvent } from '../domain-event.base';

interface TestProps {
  name: string;
}

class TestAggregate extends AggregateRoot<TestProps> {
  constructor(props: TestProps, id?: UniqueId) {
    super(props, id);
  }

  get name(): string {
    return this.props.name;
  }

  emitEvent(event: DomainEvent): void {
    this.addDomainEvent(event);
  }
}

const makeEvent = (type: string): DomainEvent => ({
  eventType: type,
  aggregateId: 'agg-1',
  occurredAt: new Date(),
  payload: {},
});

describe('AggregateRoot', () => {
  it('should start with no domain events', () => {
    const agg = new TestAggregate({ name: 'test' });

    expect(agg.domainEvents).toHaveLength(0);
  });

  it('should collect domain events', () => {
    const agg = new TestAggregate({ name: 'test' });
    const event = makeEvent('TestCreated');

    agg.emitEvent(event);

    expect(agg.domainEvents).toHaveLength(1);
    expect(agg.domainEvents[0]!.eventType).toBe('TestCreated');
  });

  it('should collect multiple events', () => {
    const agg = new TestAggregate({ name: 'test' });

    agg.emitEvent(makeEvent('Event1'));
    agg.emitEvent(makeEvent('Event2'));

    expect(agg.domainEvents).toHaveLength(2);
  });

  it('should clear domain events', () => {
    const agg = new TestAggregate({ name: 'test' });
    agg.emitEvent(makeEvent('Event1'));

    agg.clearDomainEvents();

    expect(agg.domainEvents).toHaveLength(0);
  });

  it('should return a copy of domain events (immutable)', () => {
    const agg = new TestAggregate({ name: 'test' });
    agg.emitEvent(makeEvent('Event1'));

    const events = agg.domainEvents;
    agg.emitEvent(makeEvent('Event2'));

    expect(events).toHaveLength(1);
    expect(agg.domainEvents).toHaveLength(2);
  });

  it('should extend Entity behavior', () => {
    const id = UniqueId.fromString('agg-42');
    const agg = new TestAggregate({ name: 'test' }, id);

    expect(agg.id.equals(id)).toBe(true);
    expect(agg.name).toBe('test');
  });
});
