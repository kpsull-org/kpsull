import { Entity } from "./entity.base";
import { UniqueId } from "./unique-id.vo";
import { DomainEvent } from "./domain-event.base";

/**
 * Base class for Aggregate Roots in Domain-Driven Design.
 *
 * An Aggregate Root is the main entry point to an aggregate, which is a cluster
 * of domain objects that can be treated as a single unit. The aggregate root
 * guarantees the consistency of changes being made within the aggregate.
 *
 * It extends Entity and adds the ability to collect and dispatch domain events.
 *
 * @example
 * ```typescript
 * interface OrderProps {
 *   customerId: string;
 *   items: OrderItem[];
 *   status: OrderStatus;
 * }
 *
 * class Order extends AggregateRoot<OrderProps> {
 *   ship(trackingNumber: string): Result<void> {
 *     // business logic
 *     this.addDomainEvent(new OrderShippedEvent(this.id.value, { trackingNumber }));
 *     return Result.ok();
 *   }
 * }
 * ```
 */
export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];

  protected constructor(props: T, id?: UniqueId) {
    super(props, id);
  }

  /**
   * Returns all domain events that have been recorded on this aggregate.
   */
  get domainEvents(): readonly DomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * Adds a domain event to be dispatched later.
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Clears all domain events. Should be called after events have been dispatched.
   */
  public clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
