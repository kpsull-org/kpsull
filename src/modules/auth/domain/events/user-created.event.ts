import { DomainEvent } from '@/shared/domain/domain-event.base';
import { RoleType } from '../value-objects/role.vo';

/**
 * Payload for UserCreated event
 */
export interface UserCreatedPayload {
  userId: string;
  email: string;
  role: RoleType;
}

/**
 * Domain event emitted when a new user is created
 *
 * This event can be used to trigger side effects such as:
 * - Sending a welcome email
 * - Notifying admins of new users
 * - Initializing user-related resources
 *
 * @example
 * ```typescript
 * const event = new UserCreatedEvent({
 *   userId: 'user-123',
 *   email: 'user@example.com',
 *   role: RoleType.CLIENT,
 * });
 *
 * console.log(event.eventType); // 'UserCreated'
 * console.log(event.payload.email); // 'user@example.com'
 * ```
 */
export class UserCreatedEvent implements DomainEvent<UserCreatedPayload> {
  readonly eventType = 'UserCreated';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: UserCreatedPayload;

  constructor(payload: UserCreatedPayload) {
    this.aggregateId = payload.userId;
    this.payload = payload;
    this.occurredAt = new Date();
  }
}
