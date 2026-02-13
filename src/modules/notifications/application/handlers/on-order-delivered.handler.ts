import type { DomainEvent } from '@/shared/domain/domain-event.base';
import type { IEventHandler } from '@/shared/application/ports/domain-event-dispatcher.interface';
import type { IEmailService } from '../ports/email.service.interface';
import { SendEmailNotificationUseCase } from '../use-cases/send-email-notification.use-case';

export interface OrderDeliveredPayload {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
}

export class OnOrderDeliveredHandler implements IEventHandler {
  constructor(private readonly emailService: IEmailService) {}

  async handle(event: DomainEvent<OrderDeliveredPayload>): Promise<void> {
    const { customerEmail, orderNumber, orderId } = event.payload;
    const useCase = new SendEmailNotificationUseCase(this.emailService);

    await useCase.execute({
      to: customerEmail,
      type: 'ORDER_DELIVERED',
      data: { orderNumber, orderId },
    });
  }
}
