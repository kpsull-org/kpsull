import type { IEmailService } from '../ports/email.service.interface';
import { BaseEmailHandler, type EmailNotification } from './base-email.handler';

export interface ReturnDecisionPayload {
  returnId: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  approved: boolean;
  reason?: string;
  returnAddress?: string;
}

export class OnReturnDecisionHandler extends BaseEmailHandler<ReturnDecisionPayload> {
  constructor(emailService: IEmailService) {
    super(emailService);
  }

  getNotifications({ customerEmail, orderNumber, approved, reason, returnAddress }: ReturnDecisionPayload): EmailNotification[] {
    return [{ to: customerEmail, type: approved ? 'RETURN_APPROVED' : 'RETURN_REJECTED', data: { orderNumber, reason, returnAddress } }];
  }
}
