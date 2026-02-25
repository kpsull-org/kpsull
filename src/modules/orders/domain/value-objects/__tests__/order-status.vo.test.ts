import { describe, it, expect } from 'vitest';
import { OrderStatus } from '../order-status.vo';

describe('OrderStatus', () => {
  describe('factory methods', () => {
    it('should create PENDING status', () => {
      expect(OrderStatus.pending().value).toBe('PENDING');
    });

    it('should create PAID status', () => {
      expect(OrderStatus.paid().value).toBe('PAID');
    });

    it('should create SHIPPED status', () => {
      expect(OrderStatus.shipped().value).toBe('SHIPPED');
    });

    it('should create DELIVERED status', () => {
      expect(OrderStatus.delivered().value).toBe('DELIVERED');
    });

    it('should create VALIDATION_PENDING status', () => {
      expect(OrderStatus.validationPending().value).toBe('VALIDATION_PENDING');
    });

    it('should create COMPLETED status', () => {
      expect(OrderStatus.completed().value).toBe('COMPLETED');
    });

    it('should create DISPUTE_OPENED status', () => {
      expect(OrderStatus.disputeOpened().value).toBe('DISPUTE_OPENED');
    });

    it('should create CANCELED status', () => {
      expect(OrderStatus.cancelled().value).toBe('CANCELED');
    });

    it('should create REFUNDED status', () => {
      expect(OrderStatus.refunded().value).toBe('REFUNDED');
    });
  });

  describe('boolean getters', () => {
    it('isPending should be true for PENDING', () => {
      expect(OrderStatus.pending().isPending).toBe(true);
    });

    it('isPending should be false for non-PENDING', () => {
      expect(OrderStatus.paid().isPending).toBe(false);
    });

    it('isPaid should be true for PAID', () => {
      expect(OrderStatus.paid().isPaid).toBe(true);
    });

    it('isPaid should be false for non-PAID', () => {
      expect(OrderStatus.pending().isPaid).toBe(false);
    });

    it('isShipped should be true for SHIPPED', () => {
      expect(OrderStatus.shipped().isShipped).toBe(true);
    });

    it('isShipped should be false for non-SHIPPED', () => {
      expect(OrderStatus.pending().isShipped).toBe(false);
    });

    it('isDelivered should be true for DELIVERED', () => {
      expect(OrderStatus.delivered().isDelivered).toBe(true);
    });

    it('isDelivered should be false for non-DELIVERED', () => {
      expect(OrderStatus.pending().isDelivered).toBe(false);
    });

    it('isValidationPending should be true for VALIDATION_PENDING', () => {
      expect(OrderStatus.validationPending().isValidationPending).toBe(true);
    });

    it('isValidationPending should be false for non-VALIDATION_PENDING', () => {
      expect(OrderStatus.pending().isValidationPending).toBe(false);
    });

    it('isCompleted should be true for COMPLETED', () => {
      expect(OrderStatus.completed().isCompleted).toBe(true);
    });

    it('isCompleted should be false for non-COMPLETED', () => {
      expect(OrderStatus.pending().isCompleted).toBe(false);
    });

    it('isDisputeOpened should be true for DISPUTE_OPENED', () => {
      expect(OrderStatus.disputeOpened().isDisputeOpened).toBe(true);
    });

    it('isDisputeOpened should be false for non-DISPUTE_OPENED', () => {
      expect(OrderStatus.pending().isDisputeOpened).toBe(false);
    });

    it('isCanceled should be true for CANCELED', () => {
      expect(OrderStatus.cancelled().isCanceled).toBe(true);
    });

    it('isCanceled should be false for non-CANCELED', () => {
      expect(OrderStatus.pending().isCanceled).toBe(false);
    });

    it('isRefunded should be true for REFUNDED', () => {
      expect(OrderStatus.refunded().isRefunded).toBe(true);
    });

    it('isRefunded should be false for non-REFUNDED', () => {
      expect(OrderStatus.pending().isRefunded).toBe(false);
    });
  });

  describe('computed business rules', () => {
    it('canBeCancelled should be true for PENDING', () => {
      expect(OrderStatus.pending().canBeCancelled).toBe(true);
    });

    it('canBeCancelled should be true for PAID', () => {
      expect(OrderStatus.paid().canBeCancelled).toBe(true);
    });

    it('canBeCancelled should be false for SHIPPED', () => {
      expect(OrderStatus.shipped().canBeCancelled).toBe(false);
    });

    it('canBeShipped should be true only for PAID', () => {
      expect(OrderStatus.paid().canBeShipped).toBe(true);
      expect(OrderStatus.pending().canBeShipped).toBe(false);
      expect(OrderStatus.shipped().canBeShipped).toBe(false);
    });

    it('canBeRefunded should be true for PAID', () => {
      expect(OrderStatus.paid().canBeRefunded).toBe(true);
    });

    it('canBeRefunded should be true for SHIPPED', () => {
      expect(OrderStatus.shipped().canBeRefunded).toBe(true);
    });

    it('canBeRefunded should be true for DELIVERED', () => {
      expect(OrderStatus.delivered().canBeRefunded).toBe(true);
    });

    it('canBeRefunded should be false for PENDING', () => {
      expect(OrderStatus.pending().canBeRefunded).toBe(false);
    });

    it('canBeRefunded should be false for COMPLETED', () => {
      expect(OrderStatus.completed().canBeRefunded).toBe(false);
    });
  });

  describe('fromString', () => {
    it.each([
      'PENDING',
      'PAID',
      'SHIPPED',
      'DELIVERED',
      'VALIDATION_PENDING',
      'COMPLETED',
      'DISPUTE_OPENED',
      'CANCELED',
      'REFUNDED',
      'RETURN_SHIPPED',
      'RETURN_RECEIVED',
    ])('should create from valid %s string', (status) => {
      const result = OrderStatus.fromString(status);
      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe(status);
    });

    it('should fail for invalid status string', () => {
      const result = OrderStatus.fromString('INVALID_STATUS');
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('invalide');
    });

    it('should fail for empty string', () => {
      const result = OrderStatus.fromString('');
      expect(result.isFailure).toBe(true);
    });
  });

  describe('equality', () => {
    it('should be equal to another status with same value', () => {
      expect(OrderStatus.pending().equals(OrderStatus.pending())).toBe(true);
    });

    it('should not be equal to a status with different value', () => {
      expect(OrderStatus.pending().equals(OrderStatus.paid())).toBe(false);
    });
  });
});
