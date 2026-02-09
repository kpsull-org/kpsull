/**
 * Event Handler: OnCreatorSuspended
 * Sends notification when a creator is suspended.
 */

import type { DomainEvent } from '@/shared/domain/domain-event.base';
import type { IEventHandler } from '@/shared/application/ports/domain-event-dispatcher.interface';

export interface CreatorSuspendedPayload {
  creatorId: string;
  reason: string;
  suspendedBy: string;
}

export class OnCreatorSuspendedHandler implements IEventHandler {
  async handle(event: DomainEvent<CreatorSuspendedPayload>): Promise<void> {
    const { creatorId, reason } = event.payload;
    // TODO: Integrate with notification service (email, in-app)
    console.log(
      `[Notification] Creator ${creatorId} suspended. Reason: ${reason}`
    );
  }
}
