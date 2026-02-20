import type { IEmailService } from '../ports/email.service.interface';
import { BaseEmailHandler, type EmailNotification } from './base-email.handler';

export interface OrderShippedPayload {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

export class OnOrderShippedHandler extends BaseEmailHandler<OrderShippedPayload> {
  constructor(emailService: IEmailService) {
    super(emailService);
  }

  getNotifications({ customerEmail, orderNumber, carrier, trackingNumber, trackingUrl }: OrderShippedPayload): EmailNotification[] {
    return [{ to: customerEmail, type: 'ORDER_SHIPPED', data: { orderNumber, carrier, trackingNumber, trackingUrl } }];
  }
}
