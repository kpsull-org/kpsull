import { describe, it, expect } from 'vitest';
import { NotificationType, NotificationTypeValue } from '../notification-type.vo';

describe('NotificationType Value Object', () => {
  describe('factory methods', () => {
    it('should create ORDER_RECEIVED notification type', () => {
      const type = NotificationType.orderReceived();

      expect(type.value).toBe('ORDER_RECEIVED');
      expect(type.isOrderReceived).toBe(true);
      expect(type.isOrderRelated).toBe(true);
    });

    it('should create ORDER_PAID notification type', () => {
      const type = NotificationType.orderPaid();

      expect(type.value).toBe('ORDER_PAID');
      expect(type.isOrderPaid).toBe(true);
      expect(type.isOrderRelated).toBe(true);
    });

    it('should create ORDER_SHIPPED notification type', () => {
      const type = NotificationType.orderShipped();

      expect(type.value).toBe('ORDER_SHIPPED');
      expect(type.isOrderShipped).toBe(true);
      expect(type.isOrderRelated).toBe(true);
    });

    it('should create REVIEW_RECEIVED notification type', () => {
      const type = NotificationType.reviewReceived();

      expect(type.value).toBe('REVIEW_RECEIVED');
      expect(type.isReviewReceived).toBe(true);
      expect(type.isOrderRelated).toBe(false);
    });

    it('should create SUBSCRIPTION_RENEWED notification type', () => {
      const type = NotificationType.subscriptionRenewed();

      expect(type.value).toBe('SUBSCRIPTION_RENEWED');
      expect(type.isSubscriptionRenewed).toBe(true);
      expect(type.isSubscriptionRelated).toBe(true);
    });

    it('should create SUBSCRIPTION_EXPIRING notification type', () => {
      const type = NotificationType.subscriptionExpiring();

      expect(type.value).toBe('SUBSCRIPTION_EXPIRING');
      expect(type.isSubscriptionExpiring).toBe(true);
      expect(type.isSubscriptionRelated).toBe(true);
    });

    it('should create PAYMENT_FAILED notification type', () => {
      const type = NotificationType.paymentFailed();

      expect(type.value).toBe('PAYMENT_FAILED');
      expect(type.isPaymentFailed).toBe(true);
      expect(type.isSubscriptionRelated).toBe(false);
    });
  });

  describe('fromString', () => {
    it.each([
      'ORDER_RECEIVED',
      'ORDER_PAID',
      'ORDER_SHIPPED',
      'REVIEW_RECEIVED',
      'SUBSCRIPTION_RENEWED',
      'SUBSCRIPTION_EXPIRING',
      'PAYMENT_FAILED',
    ] as NotificationTypeValue[])('should create notification type from valid string: %s', (typeValue) => {
      const result = NotificationType.fromString(typeValue);

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe(typeValue);
    });

    it('should fail for invalid notification type', () => {
      const result = NotificationType.fromString('INVALID_TYPE');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Type de notification invalide');
    });

    it('should fail for empty string', () => {
      const result = NotificationType.fromString('');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Type de notification invalide');
    });
  });

  describe('isOrderRelated', () => {
    it('should return true for order-related types', () => {
      expect(NotificationType.orderReceived().isOrderRelated).toBe(true);
      expect(NotificationType.orderPaid().isOrderRelated).toBe(true);
      expect(NotificationType.orderShipped().isOrderRelated).toBe(true);
    });

    it('should return false for non-order types', () => {
      expect(NotificationType.reviewReceived().isOrderRelated).toBe(false);
      expect(NotificationType.subscriptionRenewed().isOrderRelated).toBe(false);
      expect(NotificationType.paymentFailed().isOrderRelated).toBe(false);
    });
  });

  describe('isSubscriptionRelated', () => {
    it('should return true for subscription-related types', () => {
      expect(NotificationType.subscriptionRenewed().isSubscriptionRelated).toBe(true);
      expect(NotificationType.subscriptionExpiring().isSubscriptionRelated).toBe(true);
    });

    it('should return false for non-subscription types', () => {
      expect(NotificationType.orderReceived().isSubscriptionRelated).toBe(false);
      expect(NotificationType.reviewReceived().isSubscriptionRelated).toBe(false);
      expect(NotificationType.paymentFailed().isSubscriptionRelated).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for same notification types', () => {
      const type1 = NotificationType.orderReceived();
      const type2 = NotificationType.orderReceived();

      expect(type1.equals(type2)).toBe(true);
    });

    it('should return false for different notification types', () => {
      const type1 = NotificationType.orderReceived();
      const type2 = NotificationType.orderPaid();

      expect(type1.equals(type2)).toBe(false);
    });

    it('should return false when comparing with undefined', () => {
      const type = NotificationType.orderReceived();

      expect(type.equals(undefined)).toBe(false);
    });
  });
});
