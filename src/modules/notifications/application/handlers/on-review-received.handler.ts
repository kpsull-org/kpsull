import type { DomainEvent } from '@/shared/domain/domain-event.base';
import type { IEventHandler } from '@/shared/application/ports/domain-event-dispatcher.interface';
import type { IEmailService } from '../ports/email.service.interface';
import { SendEmailNotificationUseCase } from '../use-cases/send-email-notification.use-case';

export interface ReviewReceivedPayload {
  reviewId: string;
  productName: string;
  creatorEmail: string;
  rating: number;
  comment?: string;
}

export class OnReviewReceivedHandler implements IEventHandler {
  constructor(private readonly emailService: IEmailService) {}

  async handle(event: DomainEvent<ReviewReceivedPayload>): Promise<void> {
    const { creatorEmail, productName, rating, comment } = event.payload;
    const useCase = new SendEmailNotificationUseCase(this.emailService);

    await useCase.execute({
      to: creatorEmail,
      type: 'REVIEW_RECEIVED',
      data: { productName, rating, comment },
    });
  }
}
