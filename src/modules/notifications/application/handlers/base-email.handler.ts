import type { DomainEvent } from '@/shared/domain/domain-event.base';
import type { IEventHandler } from '@/shared/application/ports/domain-event-dispatcher.interface';
import type { IEmailService } from '../ports/email.service.interface';
import { SendEmailNotificationUseCase } from '../use-cases/send-email-notification.use-case';
import type { NotificationTypeValue } from '../../domain/value-objects/notification-type.vo';
import type { EmailTemplateData } from '../../infrastructure/emails/email-template.registry';

export interface EmailNotification {
  to: string | string[];
  type: NotificationTypeValue;
  data?: EmailTemplateData;
}

export abstract class BaseEmailHandler<TPayload = unknown> implements IEventHandler {
  constructor(protected readonly emailService: IEmailService) {}

  abstract getNotifications(payload: TPayload): EmailNotification[];

  async handle(event: DomainEvent<TPayload>): Promise<void> {
    const useCase = new SendEmailNotificationUseCase(this.emailService);
    for (const notification of this.getNotifications(event.payload)) {
      await useCase.execute(notification);
    }
  }
}
