import { describe, it, expect } from 'vitest';
import { PageStatus } from '../page-status.vo';

describe('PageStatus Value Object', () => {
  describe('draft', () => {
    it('should create a DRAFT status', () => {
      // Act
      const status = PageStatus.draft();

      // Assert
      expect(status.value).toBe('DRAFT');
      expect(status.isDraft).toBe(true);
      expect(status.isPublished).toBe(false);
    });
  });

  describe('published', () => {
    it('should create a PUBLISHED status', () => {
      // Act
      const status = PageStatus.published();

      // Assert
      expect(status.value).toBe('PUBLISHED');
      expect(status.isDraft).toBe(false);
      expect(status.isPublished).toBe(true);
    });
  });

  describe('fromString', () => {
    it('should create DRAFT from string', () => {
      // Act
      const result = PageStatus.fromString('DRAFT');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.isDraft).toBe(true);
    });

    it('should create PUBLISHED from string', () => {
      // Act
      const result = PageStatus.fromString('PUBLISHED');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.isPublished).toBe(true);
    });

    it('should fail for invalid status', () => {
      // Act
      const result = PageStatus.fromString('INVALID');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Statut de page invalide');
    });

    it('should fail for ARCHIVED status', () => {
      // Act
      const result = PageStatus.fromString('ARCHIVED');

      // Assert
      expect(result.isFailure).toBe(true);
    });
  });

  describe('equality', () => {
    it('should be equal when values match', () => {
      // Arrange
      const status1 = PageStatus.draft();
      const status2 = PageStatus.draft();

      // Assert
      expect(status1.equals(status2)).toBe(true);
    });

    it('should not be equal when values differ', () => {
      // Arrange
      const status1 = PageStatus.draft();
      const status2 = PageStatus.published();

      // Assert
      expect(status1.equals(status2)).toBe(false);
    });
  });
});
