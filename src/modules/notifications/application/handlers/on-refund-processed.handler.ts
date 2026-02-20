import type { IEmailService } from '../ports/email.service.interface';
import { BaseEmailHandler, type EmailNotification } from './base-email.handler';

export interface RefundProcessedPayload {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  amount: number;
}

export class OnRefundProcessedHandler extends BaseEmailHandler<RefundProcessedPayload> {
  constructor(emailService: IEmailService) {
    super(emailService);
  }

  getNotifications({ customerEmail, orderNumber, amount }: RefundProcessedPayload): EmailNotification[] {
    return [{ to: customerEmail, type: 'REFUND_PROCESSED', data: { orderNumber, amount } }];
  }
}
