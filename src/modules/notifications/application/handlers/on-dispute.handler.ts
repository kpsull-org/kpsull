import type { DomainEvent } from '@/shared/domain/domain-event.base';
import type { IEventHandler } from '@/shared/application/ports/domain-event-dispatcher.interface';
import type { IEmailService } from '../ports/email.service.interface';
import { SendEmailNotificationUseCase } from '../use-cases/send-email-notification.use-case';

export interface DisputeOpenedPayload {
  disputeId: string;
  orderId: string;
  orderNumber: string;
  creatorEmail: string;
  reason?: string;
}

export class OnDisputeOpenedHandler implements IEventHandler {
  constructor(private readonly emailService: IEmailService) {}

  async handle(event: DomainEvent<DisputeOpenedPayload>): Promise<void> {
    const { creatorEmail, orderNumber, reason, disputeId } = event.payload;
    const useCase = new SendEmailNotificationUseCase(this.emailService);

    await useCase.execute({
      to: creatorEmail,
      type: 'DISPUTE_OPENED',
      data: { orderNumber, reason, disputeId },
    });
  }
}

export interface DisputeUpdatePayload {
  disputeId: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  status: string;
  message?: string;
}

export class OnDisputeUpdateHandler implements IEventHandler {
  constructor(private readonly emailService: IEmailService) {}

  async handle(event: DomainEvent<DisputeUpdatePayload>): Promise<void> {
    const { customerEmail, orderNumber, status, message } = event.payload;
    const useCase = new SendEmailNotificationUseCase(this.emailService);

    await useCase.execute({
      to: customerEmail,
      type: 'DISPUTE_UPDATE',
      data: { orderNumber, status, message },
    });
  }
}
