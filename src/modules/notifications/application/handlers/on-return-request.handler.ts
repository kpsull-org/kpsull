import type { IEmailService } from '../ports/email.service.interface';
import { BaseEmailHandler, type EmailNotification } from './base-email.handler';

export interface ReturnRequestPayload {
  returnId: string;
  orderId: string;
  orderNumber: string;
  creatorEmail: string;
  reason?: string;
}

export class OnReturnRequestHandler extends BaseEmailHandler<ReturnRequestPayload> {
  constructor(emailService: IEmailService) {
    super(emailService);
  }

  getNotifications({ creatorEmail, orderNumber, reason, returnId }: ReturnRequestPayload): EmailNotification[] {
    return [{ to: creatorEmail, type: 'RETURN_REQUEST_RECEIVED', data: { orderNumber, reason, returnId } }];
  }
}
