import { describe, it, expect } from 'vitest';
import { SectionType } from '../section-type.vo';

describe('SectionType Value Object', () => {
  describe('factory methods', () => {
    it('should create a HERO type', () => {
      const type = SectionType.hero();

      expect(type.value).toBe('HERO');
      expect(type.isHero).toBe(true);
      expect(type.isAbout).toBe(false);
      expect(type.isProductsGrid).toBe(false);
      expect(type.isBentoGrid).toBe(false);
      expect(type.isContact).toBe(false);
      expect(type.isCustom).toBe(false);
    });

    it('should create an ABOUT type', () => {
      const type = SectionType.about();

      expect(type.value).toBe('ABOUT');
      expect(type.isAbout).toBe(true);
    });

    it('should create a PRODUCTS_GRID type', () => {
      const type = SectionType.productsGrid();

      expect(type.value).toBe('PRODUCTS_GRID');
      expect(type.isProductsGrid).toBe(true);
    });

    it('should create a PRODUCTS_FEATURED type', () => {
      const type = SectionType.productsFeatured();

      expect(type.value).toBe('PRODUCTS_FEATURED');
      expect(type.isProductsFeatured).toBe(true);
    });

    it('should create a BENTO_GRID type', () => {
      const type = SectionType.bentoGrid();

      expect(type.value).toBe('BENTO_GRID');
      expect(type.isBentoGrid).toBe(true);
    });

    it('should create a TESTIMONIALS type', () => {
      const type = SectionType.testimonials();

      expect(type.value).toBe('TESTIMONIALS');
      expect(type.isTestimonials).toBe(true);
    });

    it('should create a CONTACT type', () => {
      const type = SectionType.contact();

      expect(type.value).toBe('CONTACT');
      expect(type.isContact).toBe(true);
    });

    it('should create a CUSTOM type', () => {
      const type = SectionType.custom();

      expect(type.value).toBe('CUSTOM');
      expect(type.isCustom).toBe(true);
    });
  });

  describe('fromString', () => {
    it.each([
      ['HERO', 'isHero'],
      ['ABOUT', 'isAbout'],
      ['PRODUCTS_GRID', 'isProductsGrid'],
      ['PRODUCTS_FEATURED', 'isProductsFeatured'],
      ['BENTO_GRID', 'isBentoGrid'],
      ['TESTIMONIALS', 'isTestimonials'],
      ['CONTACT', 'isContact'],
      ['CUSTOM', 'isCustom'],
    ] as const)('should create %s from string', (value, property) => {
      const result = SectionType.fromString(value);

      expect(result.isSuccess).toBe(true);
      expect(result.value![property as keyof SectionType]).toBe(true);
    });

    it('should fail for invalid type', () => {
      const result = SectionType.fromString('INVALID');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Type de section invalide');
    });

    it('should fail for empty string', () => {
      const result = SectionType.fromString('');

      expect(result.isFailure).toBe(true);
    });
  });

  describe('equality', () => {
    it('should be equal when values match', () => {
      const type1 = SectionType.hero();
      const type2 = SectionType.hero();

      expect(type1.equals(type2)).toBe(true);
    });

    it('should not be equal when values differ', () => {
      const type1 = SectionType.hero();
      const type2 = SectionType.about();

      expect(type1.equals(type2)).toBe(false);
    });
  });
});
