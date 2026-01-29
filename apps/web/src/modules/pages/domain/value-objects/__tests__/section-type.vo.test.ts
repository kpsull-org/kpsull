import { describe, it, expect } from 'vitest';
import { SectionType } from '../section-type.vo';

describe('SectionType Value Object', () => {
  describe('factory methods', () => {
    it('should create a HERO type', () => {
      // Act
      const type = SectionType.hero();

      // Assert
      expect(type.value).toBe('HERO');
      expect(type.isHero).toBe(true);
      expect(type.isAbout).toBe(false);
      expect(type.isProducts).toBe(false);
      expect(type.isGallery).toBe(false);
      expect(type.isContact).toBe(false);
      expect(type.isCustom).toBe(false);
    });

    it('should create an ABOUT type', () => {
      // Act
      const type = SectionType.about();

      // Assert
      expect(type.value).toBe('ABOUT');
      expect(type.isAbout).toBe(true);
    });

    it('should create a PRODUCTS type', () => {
      // Act
      const type = SectionType.products();

      // Assert
      expect(type.value).toBe('PRODUCTS');
      expect(type.isProducts).toBe(true);
    });

    it('should create a GALLERY type', () => {
      // Act
      const type = SectionType.gallery();

      // Assert
      expect(type.value).toBe('GALLERY');
      expect(type.isGallery).toBe(true);
    });

    it('should create a CONTACT type', () => {
      // Act
      const type = SectionType.contact();

      // Assert
      expect(type.value).toBe('CONTACT');
      expect(type.isContact).toBe(true);
    });

    it('should create a CUSTOM type', () => {
      // Act
      const type = SectionType.custom();

      // Assert
      expect(type.value).toBe('CUSTOM');
      expect(type.isCustom).toBe(true);
    });
  });

  describe('fromString', () => {
    it.each([
      ['HERO', 'isHero'],
      ['ABOUT', 'isAbout'],
      ['PRODUCTS', 'isProducts'],
      ['GALLERY', 'isGallery'],
      ['CONTACT', 'isContact'],
      ['CUSTOM', 'isCustom'],
    ] as const)('should create %s from string', (value, property) => {
      // Act
      const result = SectionType.fromString(value);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value![property]).toBe(true);
    });

    it('should fail for invalid type', () => {
      // Act
      const result = SectionType.fromString('INVALID');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Type de section invalide');
    });

    it('should fail for empty string', () => {
      // Act
      const result = SectionType.fromString('');

      // Assert
      expect(result.isFailure).toBe(true);
    });
  });

  describe('equality', () => {
    it('should be equal when values match', () => {
      // Arrange
      const type1 = SectionType.hero();
      const type2 = SectionType.hero();

      // Assert
      expect(type1.equals(type2)).toBe(true);
    });

    it('should not be equal when values differ', () => {
      // Arrange
      const type1 = SectionType.hero();
      const type2 = SectionType.about();

      // Assert
      expect(type1.equals(type2)).toBe(false);
    });
  });
});
