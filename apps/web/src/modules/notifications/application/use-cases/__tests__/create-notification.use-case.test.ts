import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { CreateNotificationUseCase } from '../create-notification.use-case';
import type { NotificationRepository } from '../../ports/notification.repository.interface';

describe('CreateNotification Use Case', () => {
  let useCase: CreateNotificationUseCase;
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
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findByRecipientId: vi.fn(),
      countUnread: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      delete: vi.fn(),
      deleteOldRead: vi.fn(),
    };

    useCase = new CreateNotificationUseCase(mockRepository as unknown as NotificationRepository);
  });

  describe('execute', () => {
    it('should create a notification successfully', async () => {
      const result = await useCase.execute({
        recipientId: 'user-123',
        type: 'ORDER_RECEIVED',
        title: 'Nouvelle commande',
        message: 'Vous avez recu une nouvelle commande #12345',
        metadata: { orderId: 'order-123' },
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.recipientId).toBe('user-123');
      expect(result.value.type).toBe('ORDER_RECEIVED');
      expect(result.value.title).toBe('Nouvelle commande');
      expect(result.value.message).toBe('Vous avez recu une nouvelle commande #12345');
      expect(result.value.metadata).toEqual({ orderId: 'order-123' });
      expect(result.value.isRead).toBe(false);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should create a notification without metadata', async () => {
      const result = await useCase.execute({
        recipientId: 'user-123',
        type: 'PAYMENT_FAILED',
        title: 'Paiement echoue',
        message: 'Le paiement a echoue',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.metadata).toEqual({});
    });

    it('should fail when recipientId is missing', async () => {
      const result = await useCase.execute({
        recipientId: '',
        type: 'ORDER_RECEIVED',
        title: 'Titre',
        message: 'Message',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Recipient ID');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when type is invalid', async () => {
      const result = await useCase.execute({
        recipientId: 'user-123',
        type: 'INVALID_TYPE',
        title: 'Titre',
        message: 'Message',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Type de notification invalide');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when title is missing', async () => {
      const result = await useCase.execute({
        recipientId: 'user-123',
        type: 'ORDER_RECEIVED',
        title: '',
        message: 'Message',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('titre');
    });

    it('should fail when title is too long', async () => {
      const result = await useCase.execute({
        recipientId: 'user-123',
        type: 'ORDER_RECEIVED',
        title: 'A'.repeat(256),
        message: 'Message',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('255');
    });

    it('should fail when message is missing', async () => {
      const result = await useCase.execute({
        recipientId: 'user-123',
        type: 'ORDER_RECEIVED',
        title: 'Titre',
        message: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('message');
    });

    it('should fail when message is too long', async () => {
      const result = await useCase.execute({
        recipientId: 'user-123',
        type: 'ORDER_RECEIVED',
        title: 'Titre',
        message: 'A'.repeat(2001),
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('2000');
    });

    it.each([
      'ORDER_RECEIVED',
      'ORDER_PAID',
      'ORDER_SHIPPED',
      'REVIEW_RECEIVED',
      'SUBSCRIPTION_RENEWED',
      'SUBSCRIPTION_EXPIRING',
      'PAYMENT_FAILED',
    ])('should accept valid notification type: %s', async (type) => {
      mockRepository.save.mockClear();

      const result = await useCase.execute({
        recipientId: 'user-123',
        type,
        title: 'Titre',
        message: 'Message',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.type).toBe(type);
    });
  });
});
