import { describe, it, expect } from 'vitest';
import { DisputeStatus } from '../dispute-status.vo';

describe('DisputeStatus Value Object', () => {
  describe('factory methods', () => {
    it('should create OPEN status', () => {
      // Act
      const status = DisputeStatus.open();

      // Assert
      expect(status.value).toBe('OPEN');
      expect(status.isOpen).toBe(true);
      expect(status.isUnderReview).toBe(false);
      expect(status.isResolved).toBe(false);
      expect(status.isClosed).toBe(false);
    });

    it('should create UNDER_REVIEW status', () => {
      // Act
      const status = DisputeStatus.underReview();

      // Assert
      expect(status.value).toBe('UNDER_REVIEW');
      expect(status.isUnderReview).toBe(true);
    });

    it('should create RESOLVED status', () => {
      // Act
      const status = DisputeStatus.resolved();

      // Assert
      expect(status.value).toBe('RESOLVED');
      expect(status.isResolved).toBe(true);
    });

    it('should create CLOSED status', () => {
      // Act
      const status = DisputeStatus.closed();

      // Assert
      expect(status.value).toBe('CLOSED');
      expect(status.isClosed).toBe(true);
    });
  });

  describe('fromString', () => {
    it('should create status from valid string', () => {
      // Act
      const result = DisputeStatus.fromString('UNDER_REVIEW');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('UNDER_REVIEW');
    });

    it('should fail for invalid status', () => {
      // Act
      const result = DisputeStatus.fromString('INVALID');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('invalide');
    });
  });

  describe('label', () => {
    it('should return French label for OPEN', () => {
      // Act
      const status = DisputeStatus.open();

      // Assert
      expect(status.label).toBe('Ouvert');
    });

    it('should return French label for UNDER_REVIEW', () => {
      // Act
      const status = DisputeStatus.underReview();

      // Assert
      expect(status.label).toBe('En cours de traitement');
    });
  });

  describe('state transitions', () => {
    it('should allow starting review from OPEN', () => {
      // Arrange
      const status = DisputeStatus.open();

      // Assert
      expect(status.canStartReview).toBe(true);
    });

    it('should not allow starting review from UNDER_REVIEW', () => {
      // Arrange
      const status = DisputeStatus.underReview();

      // Assert
      expect(status.canStartReview).toBe(false);
    });

    it('should allow resolving from OPEN or UNDER_REVIEW', () => {
      // Assert
      expect(DisputeStatus.open().canResolve).toBe(true);
      expect(DisputeStatus.underReview().canResolve).toBe(true);
      expect(DisputeStatus.resolved().canResolve).toBe(false);
      expect(DisputeStatus.closed().canResolve).toBe(false);
    });

    it('should allow closing from OPEN or UNDER_REVIEW', () => {
      // Assert
      expect(DisputeStatus.open().canClose).toBe(true);
      expect(DisputeStatus.underReview().canClose).toBe(true);
      expect(DisputeStatus.resolved().canClose).toBe(false);
      expect(DisputeStatus.closed().canClose).toBe(false);
    });
  });

  describe('isActive', () => {
    it('should return true for OPEN and UNDER_REVIEW', () => {
      // Assert
      expect(DisputeStatus.open().isActive).toBe(true);
      expect(DisputeStatus.underReview().isActive).toBe(true);
    });

    it('should return false for RESOLVED and CLOSED', () => {
      // Assert
      expect(DisputeStatus.resolved().isActive).toBe(false);
      expect(DisputeStatus.closed().isActive).toBe(false);
    });
  });

  describe('equality', () => {
    it('should be equal when values match', () => {
      // Arrange
      const status1 = DisputeStatus.open();
      const status2 = DisputeStatus.open();

      // Assert
      expect(status1.equals(status2)).toBe(true);
    });

    it('should not be equal when values differ', () => {
      // Arrange
      const status1 = DisputeStatus.open();
      const status2 = DisputeStatus.closed();

      // Assert
      expect(status1.equals(status2)).toBe(false);
    });
  });
});
