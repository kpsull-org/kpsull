/**
 * Event Handler: OnContentModerated
 * Sends notification when content is moderated.
 */

import type { DomainEvent } from '@/shared/domain/domain-event.base';
import type { IEventHandler } from '@/shared/application/ports/domain-event-dispatcher.interface';

export interface ContentModeratedPayload {
  flaggedContentId: string;
  action: string;
  creatorId: string;
  moderatorId: string;
}

export class OnContentModeratedHandler implements IEventHandler {
  async handle(event: DomainEvent<ContentModeratedPayload>): Promise<void> {
    const { flaggedContentId, action, creatorId } = event.payload;
    // TODO: Integrate with notification service
    console.log(
      `[Notification] Content ${flaggedContentId} moderated (${action}) for creator ${creatorId}`
    );
  }
}
