import type { DomainEvent } from '@/shared/domain/domain-event.base';
import type { IEventHandler } from '@/shared/application/ports/domain-event-dispatcher.interface';
import type { IEmailService } from '../ports/email.service.interface';
import { SendEmailNotificationUseCase } from '../use-cases/send-email-notification.use-case';

export interface RefundProcessedPayload {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  amount: number;
}

export class OnRefundProcessedHandler implements IEventHandler {
  constructor(private readonly emailService: IEmailService) {}

  async handle(event: DomainEvent<RefundProcessedPayload>): Promise<void> {
    const { customerEmail, orderNumber, amount } = event.payload;
    const useCase = new SendEmailNotificationUseCase(this.emailService);

    await useCase.execute({
      to: customerEmail,
      type: 'REFUND_PROCESSED',
      data: { orderNumber, amount },
    });
  }
}
