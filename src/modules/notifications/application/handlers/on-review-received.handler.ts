import type { IEmailService } from '../ports/email.service.interface';
import { BaseEmailHandler, type EmailNotification } from './base-email.handler';

export interface ReviewReceivedPayload {
  reviewId: string;
  productName: string;
  creatorEmail: string;
  rating: number;
  comment?: string;
}

export class OnReviewReceivedHandler extends BaseEmailHandler<ReviewReceivedPayload> {
  constructor(emailService: IEmailService) {
    super(emailService);
  }

  getNotifications({ creatorEmail, productName, rating, comment }: ReviewReceivedPayload): EmailNotification[] {
    return [{ to: creatorEmail, type: 'REVIEW_RECEIVED', data: { productName, rating, comment } }];
  }
}
