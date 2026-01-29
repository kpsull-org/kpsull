import { ValueObject, Result } from '@/shared/domain';

export type SectionTypeValue =
  | 'HERO'
  | 'ABOUT'
  | 'BENTO_GRID'
  | 'PRODUCTS_FEATURED'
  | 'PRODUCTS_GRID'
  | 'TESTIMONIALS'
  | 'CONTACT'
  | 'CUSTOM';

interface SectionTypeProps {
  value: SectionTypeValue;
}

/**
 * SectionType Value Object
 *
 * Represents the type of a page section.
 */
export class SectionType extends ValueObject<SectionTypeProps> {
  private constructor(props: SectionTypeProps) {
    super(props);
  }

  get value(): SectionTypeValue {
    return this.props.value;
  }

  get isHero(): boolean {
    return this.value === 'HERO';
  }

  get isAbout(): boolean {
    return this.value === 'ABOUT';
  }

  get isProductsGrid(): boolean {
    return this.value === 'PRODUCTS_GRID';
  }

  get isProductsFeatured(): boolean {
    return this.value === 'PRODUCTS_FEATURED';
  }

  get isBentoGrid(): boolean {
    return this.value === 'BENTO_GRID';
  }

  get isTestimonials(): boolean {
    return this.value === 'TESTIMONIALS';
  }

  get isContact(): boolean {
    return this.value === 'CONTACT';
  }

  get isCustom(): boolean {
    return this.value === 'CUSTOM';
  }

  static hero(): SectionType {
    return new SectionType({ value: 'HERO' });
  }

  static about(): SectionType {
    return new SectionType({ value: 'ABOUT' });
  }

  static productsGrid(): SectionType {
    return new SectionType({ value: 'PRODUCTS_GRID' });
  }

  static productsFeatured(): SectionType {
    return new SectionType({ value: 'PRODUCTS_FEATURED' });
  }

  static bentoGrid(): SectionType {
    return new SectionType({ value: 'BENTO_GRID' });
  }

  static testimonials(): SectionType {
    return new SectionType({ value: 'TESTIMONIALS' });
  }

  static contact(): SectionType {
    return new SectionType({ value: 'CONTACT' });
  }

  static custom(): SectionType {
    return new SectionType({ value: 'CUSTOM' });
  }

  static fromString(value: string): Result<SectionType> {
    const validTypes: SectionTypeValue[] = [
      'HERO',
      'ABOUT',
      'BENTO_GRID',
      'PRODUCTS_FEATURED',
      'PRODUCTS_GRID',
      'TESTIMONIALS',
      'CONTACT',
      'CUSTOM',
    ];

    if (!validTypes.includes(value as SectionTypeValue)) {
      return Result.fail(`Type de section invalide: ${value}`);
    }

    return Result.ok(new SectionType({ value: value as SectionTypeValue }));
  }
}
