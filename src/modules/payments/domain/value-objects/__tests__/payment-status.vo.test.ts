import { describe, it, expect } from 'vitest';
import { PaymentStatus } from '../payment-status.vo';

describe('PaymentStatus Value Object', () => {
  describe('factory methods', () => {
    it('should create PENDING status', () => {
      const status = PaymentStatus.pending();

      expect(status.value).toBe('PENDING');
      expect(status.isPending).toBe(true);
    });

    it('should create PROCESSING status', () => {
      const status = PaymentStatus.processing();

      expect(status.value).toBe('PROCESSING');
      expect(status.isProcessing).toBe(true);
    });

    it('should create SUCCEEDED status', () => {
      const status = PaymentStatus.succeeded();

      expect(status.value).toBe('SUCCEEDED');
      expect(status.isSucceeded).toBe(true);
    });

    it('should create FAILED status', () => {
      const status = PaymentStatus.failed();

      expect(status.value).toBe('FAILED');
      expect(status.isFailed).toBe(true);
    });

    it('should create REFUNDED status', () => {
      const status = PaymentStatus.refunded();

      expect(status.value).toBe('REFUNDED');
      expect(status.isRefunded).toBe(true);
    });
  });

  describe('fromString', () => {
    it('should create from valid status string', () => {
      const result = PaymentStatus.fromString('PENDING');

      expect(result.isSuccess).toBe(true);
      expect(result.value?.value).toBe('PENDING');
    });

    it('should fail for invalid status', () => {
      const result = PaymentStatus.fromString('INVALID');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('invalide');
    });
  });

  describe('state checks', () => {
    it('should identify pending status correctly', () => {
      const status = PaymentStatus.pending();

      expect(status.isPending).toBe(true);
      expect(status.isProcessing).toBe(false);
      expect(status.isSucceeded).toBe(false);
      expect(status.isFailed).toBe(false);
      expect(status.isRefunded).toBe(false);
    });

    it('should identify processing status correctly', () => {
      const status = PaymentStatus.processing();

      expect(status.isPending).toBe(false);
      expect(status.isProcessing).toBe(true);
      expect(status.isSucceeded).toBe(false);
    });
  });

  describe('transition checks', () => {
    it('should allow processing from pending', () => {
      const status = PaymentStatus.pending();

      expect(status.canBeProcessed).toBe(true);
    });

    it('should not allow processing from succeeded', () => {
      const status = PaymentStatus.succeeded();

      expect(status.canBeProcessed).toBe(false);
    });

    it('should allow refund from succeeded', () => {
      const status = PaymentStatus.succeeded();

      expect(status.canBeRefunded).toBe(true);
    });

    it('should not allow refund from pending', () => {
      const status = PaymentStatus.pending();

      expect(status.canBeRefunded).toBe(false);
    });

    it('should not allow refund from failed', () => {
      const status = PaymentStatus.failed();

      expect(status.canBeRefunded).toBe(false);
    });
  });

  describe('isFinal', () => {
    it('should identify succeeded as not final (can be refunded)', () => {
      const status = PaymentStatus.succeeded();

      expect(status.isFinal).toBe(false);
    });

    it('should identify failed as final', () => {
      const status = PaymentStatus.failed();

      expect(status.isFinal).toBe(true);
    });

    it('should identify refunded as final', () => {
      const status = PaymentStatus.refunded();

      expect(status.isFinal).toBe(true);
    });
  });

  describe('equals', () => {
    it('should be equal to same status', () => {
      const status1 = PaymentStatus.pending();
      const status2 = PaymentStatus.pending();

      expect(status1.equals(status2)).toBe(true);
    });

    it('should not be equal to different status', () => {
      const status1 = PaymentStatus.pending();
      const status2 = PaymentStatus.processing();

      expect(status1.equals(status2)).toBe(false);
    });
  });
});
