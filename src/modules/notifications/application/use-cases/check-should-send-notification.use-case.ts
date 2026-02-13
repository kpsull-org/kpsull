import { NotificationType } from '../../domain/value-objects/notification-type.vo';
import type { NotificationTypeValue } from '../../domain/value-objects/notification-type.vo';
import type { INotificationPreferenceRepository } from '../ports/notification-preference.repository.interface';

interface CheckResult {
  shouldSendEmail: boolean;
  shouldSendInApp: boolean;
}

export class CheckShouldSendNotificationUseCase {
  constructor(private readonly preferenceRepository: INotificationPreferenceRepository) {}

  async execute(userId: string, type: NotificationTypeValue): Promise<CheckResult> {
    const notifType = NotificationType.fromString(type);

    // Mandatory notifications are always sent
    if (notifType.isSuccess && notifType.value.isMandatory) {
      return { shouldSendEmail: true, shouldSendInApp: true };
    }

    const preference = await this.preferenceRepository.findByUserIdAndType(userId, type);

    // Default: send everything if no preference is saved
    if (!preference) {
      return { shouldSendEmail: true, shouldSendInApp: true };
    }

    return {
      shouldSendEmail: preference.email,
      shouldSendInApp: preference.inApp,
    };
  }
}
