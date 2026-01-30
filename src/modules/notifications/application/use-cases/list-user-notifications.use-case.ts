import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application';
import type { NotificationTypeValue } from '../../domain/value-objects/notification-type.vo';
import type { NotificationRepository } from '../ports/notification.repository.interface';

export interface ListUserNotificationsInput {
  userId: string;
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationTypeValue;
}

export interface NotificationListItem {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

export interface ListUserNotificationsOutput {
  notifications: NotificationListItem[];
  total: number;
  unreadCount: number;
}

export class ListUserNotificationsUseCase
  implements UseCase<ListUserNotificationsInput, ListUserNotificationsOutput>
{
  private static readonly DEFAULT_PAGE = 1;
  private static readonly DEFAULT_LIMIT = 20;
  private static readonly MAX_LIMIT = 100;

  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute(input: ListUserNotificationsInput): Promise<Result<ListUserNotificationsOutput>> {
    if (!input.userId?.trim()) {
      return Result.fail('User ID est requis');
    }

    const page = input.page ?? ListUserNotificationsUseCase.DEFAULT_PAGE;
    const limit = Math.min(
      input.limit ?? ListUserNotificationsUseCase.DEFAULT_LIMIT,
      ListUserNotificationsUseCase.MAX_LIMIT
    );

    const skip = (page - 1) * limit;

    const filters: { unreadOnly?: boolean; type?: NotificationTypeValue } = {};
    if (input.unreadOnly) {
      filters.unreadOnly = true;
    }
    if (input.type) {
      filters.type = input.type;
    }

    const result = await this.notificationRepository.findByRecipientId(
      input.userId,
      filters,
      { skip, take: limit }
    );

    const notifications: NotificationListItem[] = result.notifications.map((notification) => ({
      id: notification.idString,
      type: notification.type.value,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    }));

    return Result.ok({
      notifications,
      total: result.total,
      unreadCount: result.unreadCount,
    });
  }
}
