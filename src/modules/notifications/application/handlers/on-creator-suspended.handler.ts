import type { DomainEvent } from '@/shared/domain/domain-event.base';
import type { IEventHandler } from '@/shared/application/ports/domain-event-dispatcher.interface';
import type { IEmailService } from '../ports/email.service.interface';
import { SendEmailNotificationUseCase } from '../use-cases/send-email-notification.use-case';

export interface CreatorSuspendedPayload {
  creatorId: string;
  email: string;
  reason: string;
  suspendedBy: string;
}

export class OnCreatorSuspendedHandler implements IEventHandler {
  constructor(private readonly emailService: IEmailService) {}

  async handle(event: DomainEvent<CreatorSuspendedPayload>): Promise<void> {
    const { email, reason } = event.payload;
    const useCase = new SendEmailNotificationUseCase(this.emailService);
    const result = await useCase.execute({
      to: email,
      type: 'ACCOUNT_SUSPENDED',
      data: { reason },
    });

    if (result.isFailure) {
      console.error(`[Notification] Failed to send suspension email: ${result.error}`);
    }
  }
}
