import type { IEmailService } from '../ports/email.service.interface';
import { BaseEmailHandler, type EmailNotification } from './base-email.handler';

export interface SubscriptionRenewedPayload {
  creatorEmail: string;
  planName: string;
  amount: number;
  nextBillingDate: string;
}

export class OnSubscriptionRenewedHandler extends BaseEmailHandler<SubscriptionRenewedPayload> {
  constructor(emailService: IEmailService) {
    super(emailService);
  }

  getNotifications({ creatorEmail, planName, amount, nextBillingDate }: SubscriptionRenewedPayload): EmailNotification[] {
    return [{ to: creatorEmail, type: 'SUBSCRIPTION_RENEWED', data: { planName, amount, nextBillingDate } }];
  }
}

export interface SubscriptionExpiringPayload {
  creatorEmail: string;
  planName: string;
  expiryDate: string;
}

export class OnSubscriptionExpiringHandler extends BaseEmailHandler<SubscriptionExpiringPayload> {
  constructor(emailService: IEmailService) {
    super(emailService);
  }

  getNotifications({ creatorEmail, planName, expiryDate }: SubscriptionExpiringPayload): EmailNotification[] {
    return [{ to: creatorEmail, type: 'SUBSCRIPTION_EXPIRING', data: { planName, expiryDate } }];
  }
}

export interface PaymentFailedPayload {
  creatorEmail: string;
  planName: string;
}

export class OnPaymentFailedHandler extends BaseEmailHandler<PaymentFailedPayload> {
  constructor(emailService: IEmailService) {
    super(emailService);
  }

  getNotifications({ creatorEmail, planName }: PaymentFailedPayload): EmailNotification[] {
    return [{ to: creatorEmail, type: 'PAYMENT_FAILED', data: { planName } }];
  }
}
