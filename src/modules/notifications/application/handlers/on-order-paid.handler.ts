import type { DomainEvent } from '@/shared/domain/domain-event.base';
import type { IEventHandler } from '@/shared/application/ports/domain-event-dispatcher.interface';
import type { IEmailService } from '../ports/email.service.interface';
import { SendEmailNotificationUseCase } from '../use-cases/send-email-notification.use-case';

export interface OrderPaidPayload {
  orderId: string;
  orderNumber: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  creatorEmail: string;
  address: string;
}

export class OnOrderPaidHandler implements IEventHandler {
  constructor(private readonly emailService: IEmailService) {}

  async handle(event: DomainEvent<OrderPaidPayload>): Promise<void> {
    const { customerEmail, creatorEmail, orderNumber, amount, customerName, address, orderId } =
      event.payload;
    const useCase = new SendEmailNotificationUseCase(this.emailService);

    // Email client: commande confirmée
    await useCase.execute({
      to: customerEmail,
      type: 'ORDER_CONFIRMED',
      data: { orderNumber, amount, address },
    });

    // Email créateur: nouvelle commande + paiement
    await useCase.execute({
      to: creatorEmail,
      type: 'ORDER_RECEIVED',
      data: { orderNumber, amount, customerName, orderId },
    });
  }
}
