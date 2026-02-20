import type { IEmailService } from '../ports/email.service.interface';
import { BaseEmailHandler, type EmailNotification } from './base-email.handler';

export interface DisputeOpenedPayload {
  disputeId: string;
  orderId: string;
  orderNumber: string;
  creatorEmail: string;
  reason?: string;
}

export class OnDisputeOpenedHandler extends BaseEmailHandler<DisputeOpenedPayload> {
  constructor(emailService: IEmailService) {
    super(emailService);
  }

  getNotifications({ creatorEmail, orderNumber, reason, disputeId }: DisputeOpenedPayload): EmailNotification[] {
    return [{ to: creatorEmail, type: 'DISPUTE_OPENED', data: { orderNumber, reason, disputeId } }];
  }
}

export interface DisputeUpdatePayload {
  disputeId: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  status: string;
  message?: string;
}

export class OnDisputeUpdateHandler extends BaseEmailHandler<DisputeUpdatePayload> {
  constructor(emailService: IEmailService) {
    super(emailService);
  }

  getNotifications({ customerEmail, orderNumber, status, message }: DisputeUpdatePayload): EmailNotification[] {
    return [{ to: customerEmail, type: 'DISPUTE_UPDATE', data: { orderNumber, status, message } }];
  }
}
