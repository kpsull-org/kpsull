import type { IEmailService } from '../ports/email.service.interface';
import { BaseEmailHandler, type EmailNotification } from './base-email.handler';

export interface OrderCancelledPayload {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  reason?: string;
}

export class OnOrderCancelledHandler extends BaseEmailHandler<OrderCancelledPayload> {
  constructor(emailService: IEmailService) {
    super(emailService);
  }

  getNotifications({ customerEmail, orderNumber, reason }: OrderCancelledPayload): EmailNotification[] {
    return [{ to: customerEmail, type: 'ORDER_CANCELLED', data: { orderNumber, reason } }];
  }
}
