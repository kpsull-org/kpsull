/**
 * Event Handler: OnUserRegistered
 * Sends welcome notification when a user registers.
 */

import type { DomainEvent } from '@/shared/domain/domain-event.base';
import type { IEventHandler } from '@/shared/application/ports/domain-event-dispatcher.interface';

export interface UserRegisteredPayload {
  userId: string;
  email: string;
}

export class OnUserRegisteredHandler implements IEventHandler {
  async handle(event: DomainEvent<UserRegisteredPayload>): Promise<void> {
    const { userId, email } = event.payload;
    // TODO: Integrate with email service (welcome email)
    console.log(`[Notification] Welcome email sent to ${email} (${userId})`);
  }
}
