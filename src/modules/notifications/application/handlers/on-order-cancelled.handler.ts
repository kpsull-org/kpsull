import type { DomainEvent } from '@/shared/domain/domain-event.base';
import type { IEventHandler } from '@/shared/application/ports/domain-event-dispatcher.interface';
import type { IEmailService } from '../ports/email.service.interface';
import { SendEmailNotificationUseCase } from '../use-cases/send-email-notification.use-case';

export interface OrderCancelledPayload {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  reason?: string;
}

export class OnOrderCancelledHandler implements IEventHandler {
  constructor(private readonly emailService: IEmailService) {}

  async handle(event: DomainEvent<OrderCancelledPayload>): Promise<void> {
    const { customerEmail, orderNumber, reason } = event.payload;
    const useCase = new SendEmailNotificationUseCase(this.emailService);

    await useCase.execute({
      to: customerEmail,
      type: 'ORDER_CANCELLED',
      data: { orderNumber, reason },
    });
  }
}
