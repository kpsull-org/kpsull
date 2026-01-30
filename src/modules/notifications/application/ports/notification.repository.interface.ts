import { Notification } from '../../domain/entities/notification.entity';
import type { NotificationTypeValue } from '../../domain/value-objects/notification-type.vo';

export interface PaginationOptions {
  skip: number;
  take: number;
}

export interface NotificationFilters {
  unreadOnly?: boolean;
  type?: NotificationTypeValue;
}

export interface NotificationListResult {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export interface NotificationRepository {
  /**
   * Save a notification (create or update)
   */
  save(notification: Notification): Promise<void>;

  /**
   * Find a notification by its ID
   */
  findById(id: string): Promise<Notification | null>;

  /**
   * Find notifications by recipient ID with optional filters and pagination
   */
  findByRecipientId(
    recipientId: string,
    filters?: NotificationFilters,
    pagination?: PaginationOptions
  ): Promise<NotificationListResult>;

  /**
   * Count unread notifications for a recipient
   */
  countUnread(recipientId: string): Promise<number>;

  /**
   * Mark a notification as read
   */
  markAsRead(id: string): Promise<void>;

  /**
   * Mark all notifications as read for a recipient
   */
  markAllAsRead(recipientId: string): Promise<void>;

  /**
   * Delete a notification
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all read notifications older than a given date
   */
  deleteOldRead(beforeDate: Date): Promise<number>;
}
