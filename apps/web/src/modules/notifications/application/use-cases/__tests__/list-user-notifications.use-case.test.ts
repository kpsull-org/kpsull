import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { ListUserNotificationsUseCase } from '../list-user-notifications.use-case';
import type { NotificationRepository } from '../../ports/notification.repository.interface';
import { Notification } from '../../../domain/entities/notification.entity';
import { NotificationType } from '../../../domain/value-objects/notification-type.vo';

describe('ListUserNotifications Use Case', () => {
  let useCase: ListUserNotificationsUseCase;
  let mockRepository: {
    save: Mock;
    findById: Mock;
    findByRecipientId: Mock;
    countUnread: Mock;
    markAsRead: Mock;
    markAllAsRead: Mock;
    delete: Mock;
    deleteOldRead: Mock;
  };

  beforeEach(() => {
    mockRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByRecipientId: vi.fn(),
      countUnread: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      delete: vi.fn(),
      deleteOldRead: vi.fn(),
    };

    useCase = new ListUserNotificationsUseCase(mockRepository as unknown as NotificationRepository);
  });

  describe('execute', () => {
    it('should list notifications for a user', async () => {
      const notifications = createTestNotifications();
      mockRepository.findByRecipientId.mockResolvedValue({
        notifications,
        total: 2,
        unreadCount: 1,
      });

      const result = await useCase.execute({
        userId: 'user-123',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.notifications).toHaveLength(2);
      expect(result.value.total).toBe(2);
      expect(result.value.unreadCount).toBe(1);
      expect(mockRepository.findByRecipientId).toHaveBeenCalledWith(
        'user-123',
        {},
        { skip: 0, take: 20 }
      );
    });

    it('should apply pagination', async () => {
      mockRepository.findByRecipientId.mockResolvedValue({
        notifications: [],
        total: 50,
        unreadCount: 10,
      });

      const result = await useCase.execute({
        userId: 'user-123',
        page: 2,
        limit: 10,
      });

      expect(result.isSuccess).toBe(true);
      expect(mockRepository.findByRecipientId).toHaveBeenCalledWith(
        'user-123',
        {},
        { skip: 10, take: 10 }
      );
    });

    it('should filter by unread only', async () => {
      mockRepository.findByRecipientId.mockResolvedValue({
        notifications: [],
        total: 5,
        unreadCount: 5,
      });

      const result = await useCase.execute({
        userId: 'user-123',
        unreadOnly: true,
      });

      expect(result.isSuccess).toBe(true);
      expect(mockRepository.findByRecipientId).toHaveBeenCalledWith(
        'user-123',
        { unreadOnly: true },
        { skip: 0, take: 20 }
      );
    });

    it('should filter by notification type', async () => {
      mockRepository.findByRecipientId.mockResolvedValue({
        notifications: [],
        total: 3,
        unreadCount: 1,
      });

      const result = await useCase.execute({
        userId: 'user-123',
        type: 'ORDER_RECEIVED',
      });

      expect(result.isSuccess).toBe(true);
      expect(mockRepository.findByRecipientId).toHaveBeenCalledWith(
        'user-123',
        { type: 'ORDER_RECEIVED' },
        { skip: 0, take: 20 }
      );
    });

    it('should combine filters', async () => {
      mockRepository.findByRecipientId.mockResolvedValue({
        notifications: [],
        total: 2,
        unreadCount: 2,
      });

      const result = await useCase.execute({
        userId: 'user-123',
        unreadOnly: true,
        type: 'ORDER_RECEIVED',
        page: 1,
        limit: 5,
      });

      expect(result.isSuccess).toBe(true);
      expect(mockRepository.findByRecipientId).toHaveBeenCalledWith(
        'user-123',
        { unreadOnly: true, type: 'ORDER_RECEIVED' },
        { skip: 0, take: 5 }
      );
    });

    it('should fail when userId is missing', async () => {
      const result = await useCase.execute({
        userId: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('User ID');
      expect(mockRepository.findByRecipientId).not.toHaveBeenCalled();
    });

    it('should use default pagination values', async () => {
      mockRepository.findByRecipientId.mockResolvedValue({
        notifications: [],
        total: 0,
        unreadCount: 0,
      });

      await useCase.execute({
        userId: 'user-123',
      });

      expect(mockRepository.findByRecipientId).toHaveBeenCalledWith(
        'user-123',
        {},
        { skip: 0, take: 20 }
      );
    });

    it('should cap limit at maximum', async () => {
      mockRepository.findByRecipientId.mockResolvedValue({
        notifications: [],
        total: 0,
        unreadCount: 0,
      });

      await useCase.execute({
        userId: 'user-123',
        limit: 200,
      });

      expect(mockRepository.findByRecipientId).toHaveBeenCalledWith(
        'user-123',
        {},
        { skip: 0, take: 100 }
      );
    });

    it('should return mapped notification data', async () => {
      const notifications = createTestNotifications();
      mockRepository.findByRecipientId.mockResolvedValue({
        notifications,
        total: 2,
        unreadCount: 1,
      });

      const result = await useCase.execute({
        userId: 'user-123',
      });

      expect(result.isSuccess).toBe(true);
      const firstNotification = notifications[0]!;
      expect(result.value.notifications[0]).toEqual({
        id: firstNotification.idString,
        type: 'ORDER_RECEIVED',
        title: 'Nouvelle commande',
        message: 'Commande #1',
        metadata: { orderId: 'order-1' },
        isRead: false,
        createdAt: firstNotification.createdAt,
      });
    });
  });
});

function createTestNotifications(): Notification[] {
  const notification1 = Notification.create({
    recipientId: 'user-123',
    type: NotificationType.orderReceived(),
    title: 'Nouvelle commande',
    message: 'Commande #1',
    metadata: { orderId: 'order-1' },
  }).value;

  const notification2 = Notification.create({
    recipientId: 'user-123',
    type: NotificationType.reviewReceived(),
    title: 'Nouvel avis',
    message: 'Avis sur produit',
    metadata: { reviewId: 'review-1' },
  }).value;
  notification2.markAsRead();

  return [notification1, notification2];
}
