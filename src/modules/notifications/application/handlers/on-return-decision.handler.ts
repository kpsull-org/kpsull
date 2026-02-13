import type { DomainEvent } from '@/shared/domain/domain-event.base';
import type { IEventHandler } from '@/shared/application/ports/domain-event-dispatcher.interface';
import type { IEmailService } from '../ports/email.service.interface';
import { SendEmailNotificationUseCase } from '../use-cases/send-email-notification.use-case';

export interface ReturnDecisionPayload {
  returnId: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  approved: boolean;
  reason?: string;
  returnAddress?: string;
}

export class OnReturnDecisionHandler implements IEventHandler {
  constructor(private readonly emailService: IEmailService) {}

  async handle(event: DomainEvent<ReturnDecisionPayload>): Promise<void> {
    const { customerEmail, orderNumber, approved, reason, returnAddress } = event.payload;
    const useCase = new SendEmailNotificationUseCase(this.emailService);

    await useCase.execute({
      to: customerEmail,
      type: approved ? 'RETURN_APPROVED' : 'RETURN_REJECTED',
      data: { orderNumber, reason, returnAddress },
    });
  }
}
