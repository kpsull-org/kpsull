import type { DomainEvent } from '@/shared/domain/domain-event.base';
import type { IEventHandler } from '@/shared/application/ports/domain-event-dispatcher.interface';

export interface ContentModeratedPayload {
  flaggedContentId: string;
  action: string;
  creatorId: string;
  moderatorId: string;
}

export class OnContentModeratedHandler implements IEventHandler {
  async handle(_event: DomainEvent<ContentModeratedPayload>): Promise<void> {
    // Notification will be sent via email service when implemented
  }
}
