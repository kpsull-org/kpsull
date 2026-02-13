import { Result } from '@/shared/domain';
import { NotificationType } from '../../domain/value-objects/notification-type.vo';
import type { NotificationTypeValue } from '../../domain/value-objects/notification-type.vo';
import type { INotificationPreferenceRepository } from '../ports/notification-preference.repository.interface';

interface UpdateNotificationPreferenceInput {
  userId: string;
  type: NotificationTypeValue;
  email: boolean;
  inApp: boolean;
}

export class UpdateNotificationPreferenceUseCase {
  constructor(private readonly preferenceRepository: INotificationPreferenceRepository) {}

  async execute(input: UpdateNotificationPreferenceInput): Promise<Result<void>> {
    const notifType = NotificationType.fromString(input.type);
    if (notifType.isFailure) {
      return Result.fail(notifType.error!);
    }

    if (notifType.value.isMandatory) {
      return Result.fail('Les notifications obligatoires ne peuvent pas etre desactivees');
    }

    await this.preferenceRepository.upsert(
      input.userId,
      input.type,
      input.email,
      input.inApp
    );

    return Result.ok();
  }
}
