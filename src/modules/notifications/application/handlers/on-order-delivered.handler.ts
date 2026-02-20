import type { IEmailService } from '../ports/email.service.interface';
import { BaseEmailHandler, type EmailNotification } from './base-email.handler';

export interface OrderDeliveredPayload {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
}

export class OnOrderDeliveredHandler extends BaseEmailHandler<OrderDeliveredPayload> {
  constructor(emailService: IEmailService) {
    super(emailService);
  }

  getNotifications({ customerEmail, orderNumber, orderId }: OrderDeliveredPayload): EmailNotification[] {
    return [{ to: customerEmail, type: 'ORDER_DELIVERED', data: { orderNumber, orderId } }];
  }
}
