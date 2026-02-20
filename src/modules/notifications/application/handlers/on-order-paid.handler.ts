import type { IEmailService } from '../ports/email.service.interface';
import { BaseEmailHandler, type EmailNotification } from './base-email.handler';

export interface OrderPaidPayload {
  orderId: string;
  orderNumber: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  creatorEmail: string;
  address: string;
}

export class OnOrderPaidHandler extends BaseEmailHandler<OrderPaidPayload> {
  constructor(emailService: IEmailService) {
    super(emailService);
  }

  getNotifications({ customerEmail, creatorEmail, orderNumber, amount, customerName, address, orderId }: OrderPaidPayload): EmailNotification[] {
    return [
      { to: customerEmail, type: 'ORDER_CONFIRMED', data: { orderNumber, amount, address } },
      { to: creatorEmail, type: 'ORDER_RECEIVED', data: { orderNumber, amount, customerName, orderId } },
    ];
  }
}
