import { describe, it, expect } from 'vitest';
import { ProductStatus } from '../product-status.vo';

describe('ProductStatus Value Object', () => {
  describe('draft', () => {
    it('should create a DRAFT status', () => {
      // Act
      const status = ProductStatus.draft();

      // Assert
      expect(status.value).toBe('DRAFT');
      expect(status.isDraft).toBe(true);
      expect(status.isPublished).toBe(false);
      expect(status.isArchived).toBe(false);
    });
  });

  describe('published', () => {
    it('should create a PUBLISHED status', () => {
      // Act
      const status = ProductStatus.published();

      // Assert
      expect(status.value).toBe('PUBLISHED');
      expect(status.isDraft).toBe(false);
      expect(status.isPublished).toBe(true);
      expect(status.isArchived).toBe(false);
    });
  });

  describe('archived', () => {
    it('should create an ARCHIVED status', () => {
      // Act
      const status = ProductStatus.archived();

      // Assert
      expect(status.value).toBe('ARCHIVED');
      expect(status.isDraft).toBe(false);
      expect(status.isPublished).toBe(false);
      expect(status.isArchived).toBe(true);
    });
  });

  describe('fromString', () => {
    it('should create DRAFT from string', () => {
      // Act
      const result = ProductStatus.fromString('DRAFT');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.isDraft).toBe(true);
    });

    it('should create PUBLISHED from string', () => {
      // Act
      const result = ProductStatus.fromString('PUBLISHED');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.isPublished).toBe(true);
    });

    it('should create ARCHIVED from string', () => {
      // Act
      const result = ProductStatus.fromString('ARCHIVED');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.isArchived).toBe(true);
    });

    it('should fail for invalid status', () => {
      // Act
      const result = ProductStatus.fromString('INVALID');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Statut invalide');
    });
  });

  describe('equality', () => {
    it('should be equal when values match', () => {
      // Arrange
      const status1 = ProductStatus.draft();
      const status2 = ProductStatus.draft();

      // Assert
      expect(status1.equals(status2)).toBe(true);
    });

    it('should not be equal when values differ', () => {
      // Arrange
      const status1 = ProductStatus.draft();
      const status2 = ProductStatus.published();

      // Assert
      expect(status1.equals(status2)).toBe(false);
    });
  });
});
