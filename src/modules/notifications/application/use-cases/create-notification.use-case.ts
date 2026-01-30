import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application';
import { Notification } from '../../domain/entities/notification.entity';
import { NotificationType } from '../../domain/value-objects/notification-type.vo';
import type { NotificationRepository } from '../ports/notification.repository.interface';

export interface CreateNotificationInput {
  recipientId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface CreateNotificationOutput {
  id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

export class CreateNotificationUseCase
  implements UseCase<CreateNotificationInput, CreateNotificationOutput>
{
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute(input: CreateNotificationInput): Promise<Result<CreateNotificationOutput>> {
    // Validate notification type
    const typeResult = NotificationType.fromString(input.type);
    if (typeResult.isFailure) {
      return Result.fail(typeResult.error!);
    }

    // Create notification entity
    const notificationResult = Notification.create({
      recipientId: input.recipientId,
      type: typeResult.value,
      title: input.title,
      message: input.message,
      metadata: input.metadata,
    });

    if (notificationResult.isFailure) {
      return Result.fail(notificationResult.error!);
    }

    const notification = notificationResult.value;

    // Save notification
    await this.notificationRepository.save(notification);

    return Result.ok({
      id: notification.idString,
      recipientId: notification.recipientId,
      type: notification.type.value,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    });
  }
}
