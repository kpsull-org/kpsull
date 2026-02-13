import type { DomainEvent } from '@/shared/domain/domain-event.base';
import type { IEventHandler } from '@/shared/application/ports/domain-event-dispatcher.interface';
import type { IEmailService } from '../ports/email.service.interface';
import { SendEmailNotificationUseCase } from '../use-cases/send-email-notification.use-case';

export interface ReturnRequestPayload {
  returnId: string;
  orderId: string;
  orderNumber: string;
  creatorEmail: string;
  reason?: string;
}

export class OnReturnRequestHandler implements IEventHandler {
  constructor(private readonly emailService: IEmailService) {}

  async handle(event: DomainEvent<ReturnRequestPayload>): Promise<void> {
    const { creatorEmail, orderNumber, reason, returnId } = event.payload;
    const useCase = new SendEmailNotificationUseCase(this.emailService);

    await useCase.execute({
      to: creatorEmail,
      type: 'RETURN_REQUEST_RECEIVED',
      data: { orderNumber, reason, returnId },
    });
  }
}
