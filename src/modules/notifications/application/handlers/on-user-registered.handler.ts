import type { DomainEvent } from '@/shared/domain/domain-event.base';
import type { IEmailService } from '../ports/email.service.interface';
import { BaseEmailHandler, type EmailNotification } from './base-email.handler';
import { SendEmailNotificationUseCase } from '../use-cases/send-email-notification.use-case';

export interface UserRegisteredPayload {
  userId: string;
  email: string;
}

export class OnUserRegisteredHandler extends BaseEmailHandler<UserRegisteredPayload> {
  constructor(emailService: IEmailService) {
    super(emailService);
  }

  getNotifications({ email }: UserRegisteredPayload): EmailNotification[] {
    return [{ to: email, type: 'WELCOME' }];
  }

  override async handle(event: DomainEvent<UserRegisteredPayload>): Promise<void> {
    const useCase = new SendEmailNotificationUseCase(this.emailService);
    const result = await useCase.execute({ to: event.payload.email, type: 'WELCOME' });
    if (result.isFailure) {
      console.error(`[Notification] Failed to send welcome email to ${event.payload.email}: ${result.error}`);
    }
  }
}
