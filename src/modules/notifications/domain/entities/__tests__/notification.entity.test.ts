import { describe, it, expect } from 'vitest';
import { Notification } from '../notification.entity';
import { NotificationType } from '../../value-objects/notification-type.vo';

describe('Notification Entity', () => {
  describe('create', () => {
    it('should create a notification successfully', () => {
      const result = Notification.create({
        recipientId: 'user-123',
        type: NotificationType.orderReceived(),
        title: 'Nouvelle commande',
        message: 'Vous avez recu une nouvelle commande #12345',
        metadata: { orderId: 'order-123' },
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.recipientId).toBe('user-123');
      expect(result.value.type.value).toBe('ORDER_RECEIVED');
      expect(result.value.title).toBe('Nouvelle commande');
      expect(result.value.message).toBe('Vous avez recu une nouvelle commande #12345');
      expect(result.value.metadata).toEqual({ orderId: 'order-123' });
      expect(result.value.readAt).toBeNull();
      expect(result.value.isRead).toBe(false);
    });

    it('should create a notification without metadata', () => {
      const result = Notification.create({
        recipientId: 'user-123',
        type: NotificationType.paymentFailed(),
        title: 'Paiement echoue',
        message: 'Le paiement a echoue',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.metadata).toEqual({});
    });

    it('should fail when recipientId is missing', () => {
      const result = Notification.create({
        recipientId: '',
        type: NotificationType.orderReceived(),
        title: 'Titre',
        message: 'Message',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Recipient ID');
    });

    it('should fail when title is missing', () => {
      const result = Notification.create({
        recipientId: 'user-123',
        type: NotificationType.orderReceived(),
        title: '',
        message: 'Message',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('titre');
    });

    it('should fail when title is too long', () => {
      const result = Notification.create({
        recipientId: 'user-123',
        type: NotificationType.orderReceived(),
        title: 'A'.repeat(256),
        message: 'Message',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('255');
    });

    it('should fail when message is missing', () => {
      const result = Notification.create({
        recipientId: 'user-123',
        type: NotificationType.orderReceived(),
        title: 'Titre',
        message: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('message');
    });

    it('should fail when message is too long', () => {
      const result = Notification.create({
        recipientId: 'user-123',
        type: NotificationType.orderReceived(),
        title: 'Titre',
        message: 'A'.repeat(2001),
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('2000');
    });

    it('should set createdAt on creation', () => {
      const before = new Date();

      const result = Notification.create({
        recipientId: 'user-123',
        type: NotificationType.orderReceived(),
        title: 'Titre',
        message: 'Message',
      });

      const after = new Date();

      expect(result.isSuccess).toBe(true);
      expect(result.value.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.value.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', () => {
      const notification = createTestNotification();

      expect(notification.isRead).toBe(false);
      expect(notification.readAt).toBeNull();

      notification.markAsRead();

      expect(notification.isRead).toBe(true);
      expect(notification.readAt).toBeInstanceOf(Date);
    });

    it('should set readAt to current time', () => {
      const notification = createTestNotification();
      const before = new Date();

      notification.markAsRead();

      const after = new Date();

      expect(notification.readAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(notification.readAt!.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should not change readAt if already read', () => {
      const notification = createTestNotification();

      notification.markAsRead();
      const firstReadAt = notification.readAt;

      notification.markAsRead();

      expect(notification.readAt).toBe(firstReadAt);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute notification from persistence', () => {
      const createdAt = new Date('2024-01-01');
      const readAt = new Date('2024-01-02');

      const result = Notification.reconstitute({
        id: 'notification-123',
        recipientId: 'user-123',
        type: 'ORDER_RECEIVED',
        title: 'Nouvelle commande',
        message: 'Vous avez recu une commande',
        metadata: { orderId: 'order-123' },
        readAt,
        createdAt,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.idString).toBe('notification-123');
      expect(result.value.recipientId).toBe('user-123');
      expect(result.value.type.value).toBe('ORDER_RECEIVED');
      expect(result.value.title).toBe('Nouvelle commande');
      expect(result.value.message).toBe('Vous avez recu une commande');
      expect(result.value.metadata).toEqual({ orderId: 'order-123' });
      expect(result.value.readAt).toEqual(readAt);
      expect(result.value.createdAt).toEqual(createdAt);
      expect(result.value.isRead).toBe(true);
    });

    it('should reconstitute unread notification', () => {
      const createdAt = new Date('2024-01-01');

      const result = Notification.reconstitute({
        id: 'notification-123',
        recipientId: 'user-123',
        type: 'PAYMENT_FAILED',
        title: 'Paiement echoue',
        message: 'Votre paiement a echoue',
        metadata: {},
        readAt: null,
        createdAt,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.readAt).toBeNull();
      expect(result.value.isRead).toBe(false);
    });

    it('should fail for invalid notification type', () => {
      const result = Notification.reconstitute({
        id: 'notification-123',
        recipientId: 'user-123',
        type: 'INVALID_TYPE',
        title: 'Titre',
        message: 'Message',
        metadata: {},
        readAt: null,
        createdAt: new Date(),
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Type de notification invalide');
    });
  });

  describe('getters', () => {
    it('should return all properties correctly', () => {
      const notification = createTestNotification();

      expect(notification.recipientId).toBe('user-123');
      expect(notification.type.value).toBe('ORDER_RECEIVED');
      expect(notification.title).toBe('Nouvelle commande');
      expect(notification.message).toBe('Vous avez recu une commande');
      expect(notification.metadata).toEqual({ orderId: 'order-123' });
      expect(notification.readAt).toBeNull();
      expect(notification.isRead).toBe(false);
      expect(notification.idString).toBeDefined();
    });
  });

  describe('different notification types with metadata', () => {
    it('should create order notification with orderId metadata', () => {
      const result = Notification.create({
        recipientId: 'creator-123',
        type: NotificationType.orderReceived(),
        title: 'Nouvelle commande',
        message: 'Commande #12345',
        metadata: { orderId: 'order-123', productId: 'product-456' },
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.metadata.orderId).toBe('order-123');
      expect(result.value.metadata.productId).toBe('product-456');
    });

    it('should create review notification with review metadata', () => {
      const result = Notification.create({
        recipientId: 'creator-123',
        type: NotificationType.reviewReceived(),
        title: 'Nouvel avis',
        message: 'Un client a laisse un avis',
        metadata: { reviewId: 'review-123', productId: 'product-456', rating: 5 },
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.metadata.reviewId).toBe('review-123');
      expect(result.value.metadata.rating).toBe(5);
    });

    it('should create subscription notification with subscription metadata', () => {
      const result = Notification.create({
        recipientId: 'creator-123',
        type: NotificationType.subscriptionExpiring(),
        title: 'Abonnement expire bientot',
        message: 'Votre abonnement expire dans 7 jours',
        metadata: { subscriptionId: 'sub-123', daysRemaining: 7 },
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.metadata.subscriptionId).toBe('sub-123');
      expect(result.value.metadata.daysRemaining).toBe(7);
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
