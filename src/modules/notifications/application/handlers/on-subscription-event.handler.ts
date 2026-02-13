import type { DomainEvent } from '@/shared/domain/domain-event.base';
import type { IEventHandler } from '@/shared/application/ports/domain-event-dispatcher.interface';
import type { IEmailService } from '../ports/email.service.interface';
import { SendEmailNotificationUseCase } from '../use-cases/send-email-notification.use-case';

export interface SubscriptionRenewedPayload {
  creatorEmail: string;
  planName: string;
  amount: number;
  nextBillingDate: string;
}

export class OnSubscriptionRenewedHandler implements IEventHandler {
  constructor(private readonly emailService: IEmailService) {}

  async handle(event: DomainEvent<SubscriptionRenewedPayload>): Promise<void> {
    const { creatorEmail, planName, amount, nextBillingDate } = event.payload;
    const useCase = new SendEmailNotificationUseCase(this.emailService);

    await useCase.execute({
      to: creatorEmail,
      type: 'SUBSCRIPTION_RENEWED',
      data: { planName, amount, nextBillingDate },
    });
  }
}

export interface SubscriptionExpiringPayload {
  creatorEmail: string;
  planName: string;
  expiryDate: string;
}

export class OnSubscriptionExpiringHandler implements IEventHandler {
  constructor(private readonly emailService: IEmailService) {}

  async handle(event: DomainEvent<SubscriptionExpiringPayload>): Promise<void> {
    const { creatorEmail, planName, expiryDate } = event.payload;
    const useCase = new SendEmailNotificationUseCase(this.emailService);

    await useCase.execute({
      to: creatorEmail,
      type: 'SUBSCRIPTION_EXPIRING',
      data: { planName, expiryDate },
    });
  }
}

export interface PaymentFailedPayload {
  creatorEmail: string;
  planName: string;
}

export class OnPaymentFailedHandler implements IEventHandler {
  constructor(private readonly emailService: IEmailService) {}

  async handle(event: DomainEvent<PaymentFailedPayload>): Promise<void> {
    const { creatorEmail, planName } = event.payload;
    const useCase = new SendEmailNotificationUseCase(this.emailService);

    await useCase.execute({
      to: creatorEmail,
      type: 'PAYMENT_FAILED',
      data: { planName },
    });
  }
}
