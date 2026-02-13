import type { DomainEvent } from '@/shared/domain/domain-event.base';
import type { IEventHandler } from '@/shared/application/ports/domain-event-dispatcher.interface';
import type { IEmailService } from '../ports/email.service.interface';
import { SendEmailNotificationUseCase } from '../use-cases/send-email-notification.use-case';

export interface OrderShippedPayload {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

export class OnOrderShippedHandler implements IEventHandler {
  constructor(private readonly emailService: IEmailService) {}

  async handle(event: DomainEvent<OrderShippedPayload>): Promise<void> {
    const { customerEmail, orderNumber, carrier, trackingNumber, trackingUrl } = event.payload;
    const useCase = new SendEmailNotificationUseCase(this.emailService);

    await useCase.execute({
      to: customerEmail,
      type: 'ORDER_SHIPPED',
      data: { orderNumber, carrier, trackingNumber, trackingUrl },
    });
  }
}
