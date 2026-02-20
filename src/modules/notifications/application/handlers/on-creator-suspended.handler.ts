import type { IEmailService } from '../ports/email.service.interface';
import { BaseEmailHandler, type EmailNotification } from './base-email.handler';

export interface CreatorSuspendedPayload {
  creatorId: string;
  email: string;
  reason: string;
  suspendedBy: string;
}

export class OnCreatorSuspendedHandler extends BaseEmailHandler<CreatorSuspendedPayload> {
  constructor(emailService: IEmailService) {
    super(emailService);
  }

  getNotifications({ email, reason }: CreatorSuspendedPayload): EmailNotification[] {
    return [{ to: email, type: 'ACCOUNT_SUSPENDED', data: { reason } }];
  }
}
