import { Result } from '@/shared/domain';
import type { NotificationTypeValue } from '../../domain/value-objects/notification-type.vo';
import type { IEmailService, SendEmailResult } from '../ports/email.service.interface';
import type { INotificationPreferenceRepository } from '../ports/notification-preference.repository.interface';
import { CheckShouldSendNotificationUseCase } from './check-should-send-notification.use-case';
import { getEmailTemplate, type EmailTemplateData } from '../../infrastructure/emails/email-template.registry';

interface SendEmailNotificationInput {
  to: string | string[];
  type: NotificationTypeValue;
  data?: EmailTemplateData;
  /** User ID of the recipient, used to check notification preferences */
  recipientUserId?: string;
}

export class SendEmailNotificationUseCase {
  constructor(
    private readonly emailService: IEmailService,
    private readonly preferenceRepository?: INotificationPreferenceRepository,
  ) {}

  async execute(input: SendEmailNotificationInput): Promise<Result<SendEmailResult>> {
    // Check notification preferences if a recipientUserId is provided
    if (input.recipientUserId && this.preferenceRepository) {
      const checker = new CheckShouldSendNotificationUseCase(this.preferenceRepository);
      const { shouldSendEmail } = await checker.execute(input.recipientUserId, input.type);
      if (!shouldSendEmail) {
        return Result.ok<SendEmailResult>({ id: 'skipped-by-preference' });
      }
    }

    const template = getEmailTemplate(input.type);
    if (!template) {
      return Result.fail<SendEmailResult>(`Template introuvable pour le type: ${input.type}`);
    }

    const data = input.data ?? {};

    return this.emailService.send({
      to: input.to,
      subject: template.subject(data),
      html: template.html(data),
      text: template.text(data),
      tags: [{ name: 'type', value: input.type }],
    });
  }
}
