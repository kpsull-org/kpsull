import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { MarkAsReadUseCase } from '../mark-as-read.use-case';
import type { NotificationRepository } from '../../ports/notification.repository.interface';
import { Notification } from '../../../domain/entities/notification.entity';
import { NotificationType } from '../../../domain/value-objects/notification-type.vo';

describe('MarkAsRead Use Case', () => {
  let useCase: MarkAsReadUseCase;
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
      markAsRead: vi.fn().mockResolvedValue(undefined),
      markAllAsRead: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
      deleteOldRead: vi.fn(),
    };

    useCase = new MarkAsReadUseCase(mockRepository as unknown as NotificationRepository);
  });

  describe('execute - single notification', () => {
    it('should mark a single notification as read', async () => {
      const notification = createTestNotification();
      mockRepository.findById.mockResolvedValue(notification);

      const result = await useCase.execute({
        userId: 'user-123',
        notificationId: 'notification-123',
      });

      expect(result.isSuccess).toBe(true);
      expect(mockRepository.findById).toHaveBeenCalledWith('notification-123');
      expect(mockRepository.markAsRead).toHaveBeenCalledWith('notification-123');
    });

    it('should fail when notification is not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute({
        userId: 'user-123',
        notificationId: 'non-existent',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Notification non trouvee');
      expect(mockRepository.markAsRead).not.toHaveBeenCalled();
    });

    it('should fail when notification belongs to another user', async () => {
      const notification = Notification.create({
        recipientId: 'other-user',
        type: NotificationType.orderReceived(),
        title: 'Titre',
        message: 'Message',
      }).value;

      mockRepository.findById.mockResolvedValue(notification);

      const result = await useCase.execute({
        userId: 'user-123',
        notificationId: 'notification-123',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('autorise');
      expect(mockRepository.markAsRead).not.toHaveBeenCalled();
    });

    it('should fail when notificationId is missing', async () => {
      const result = await useCase.execute({
        userId: 'user-123',
        notificationId: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Notification ID');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should fail when userId is missing', async () => {
      const result = await useCase.execute({
        userId: '',
        notificationId: 'notification-123',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('User ID');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('execute - mark all as read', () => {
    it('should mark all notifications as read when markAll is true', async () => {
      const result = await useCase.execute({
        userId: 'user-123',
        markAll: true,
      });

      expect(result.isSuccess).toBe(true);
      expect(mockRepository.markAllAsRead).toHaveBeenCalledWith('user-123');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should fail when userId is missing for markAll', async () => {
      const result = await useCase.execute({
        userId: '',
        markAll: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('User ID');
      expect(mockRepository.markAllAsRead).not.toHaveBeenCalled();
    });

    it('should prioritize markAll over notificationId', async () => {
      const result = await useCase.execute({
        userId: 'user-123',
        notificationId: 'notification-123',
        markAll: true,
      });

      expect(result.isSuccess).toBe(true);
      expect(mockRepository.markAllAsRead).toHaveBeenCalledWith('user-123');
      expect(mockRepository.findById).not.toHaveBeenCalled();
      expect(mockRepository.markAsRead).not.toHaveBeenCalled();
    });
  });
});

function createTestNotification(): Notification {
  return Notification.create({
    recipientId: 'user-123',
    type: NotificationType.orderReceived(),
    title: 'Nouvelle commande',
    message: 'Vous avez recu une commande',
    metadata: { orderId: 'order-123' },
  }).value;
}
