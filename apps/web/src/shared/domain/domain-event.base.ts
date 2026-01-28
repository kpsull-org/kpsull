/**
 * Interface for Domain Events in Domain-Driven Design.
 *
 * Domain Events represent something that happened in the domain that
 * domain experts care about. They are immutable and represent facts
 * about the past.
 *
 * @example
 * ```typescript
 * class UserCreatedEvent implements DomainEvent {
 *   readonly eventType = "UserCreated";
 *   readonly occurredAt = new Date();
 *
 *   constructor(
 *     readonly aggregateId: string,
 *     readonly payload: { email: string; name: string }
 *   ) {}
 * }
 * ```
 */
export interface DomainEvent<TPayload = unknown> {
  /**
   * Type/name of the event (e.g., "UserCreated", "OrderShipped")
   */
  readonly eventType: string;

  /**
   * The ID of the aggregate that this event belongs to
   */
  readonly aggregateId: string;

  /**
   * When the event occurred
   */
  readonly occurredAt: Date;

  /**
   * The event payload containing the event-specific data
   */
  readonly payload: TPayload;
}

/**
 * Abstract base class for Domain Events with common functionality.
 */
export abstract class BaseDomainEvent<TPayload = unknown>
  implements DomainEvent<TPayload>
{
  abstract readonly eventType: string;
  readonly occurredAt: Date;

  constructor(
    readonly aggregateId: string,
    readonly payload: TPayload
  ) {
    this.occurredAt = new Date();
  }
}
