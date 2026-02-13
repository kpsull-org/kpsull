import type { DomainEvent } from '@/shared/domain/domain-event.base';
import type { IEventHandler } from '@/shared/application/ports/domain-event-dispatcher.interface';
import type { IEmailService } from '../ports/email.service.interface';
import { SendEmailNotificationUseCase } from '../use-cases/send-email-notification.use-case';

export interface UserRegisteredPayload {
  userId: string;
  email: string;
}

export class OnUserRegisteredHandler implements IEventHandler {
  constructor(private readonly emailService: IEmailService) {}

  async handle(event: DomainEvent<UserRegisteredPayload>): Promise<void> {
    const { email } = event.payload;
    const useCase = new SendEmailNotificationUseCase(this.emailService);
    const result = await useCase.execute({ to: email, type: 'WELCOME' });

    if (result.isFailure) {
      console.error(`[Notification] Failed to send welcome email to ${email}: ${result.error}`);
    }
  }
}
