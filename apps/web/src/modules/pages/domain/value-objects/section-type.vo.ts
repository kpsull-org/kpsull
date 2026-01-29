import { ValueObject, Result } from '@/shared/domain';

export type SectionTypeValue = 'HERO' | 'ABOUT' | 'PRODUCTS' | 'GALLERY' | 'CONTACT' | 'CUSTOM';

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

  get isProducts(): boolean {
    return this.value === 'PRODUCTS';
  }

  get isGallery(): boolean {
    return this.value === 'GALLERY';
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

  static products(): SectionType {
    return new SectionType({ value: 'PRODUCTS' });
  }

  static gallery(): SectionType {
    return new SectionType({ value: 'GALLERY' });
  }

  static contact(): SectionType {
    return new SectionType({ value: 'CONTACT' });
  }

  static custom(): SectionType {
    return new SectionType({ value: 'CUSTOM' });
  }

  static fromString(value: string): Result<SectionType> {
    const validTypes: SectionTypeValue[] = ['HERO', 'ABOUT', 'PRODUCTS', 'GALLERY', 'CONTACT', 'CUSTOM'];

    if (!validTypes.includes(value as SectionTypeValue)) {
      return Result.fail(`Type de section invalide: ${value}`);
    }

    return Result.ok(new SectionType({ value: value as SectionTypeValue }));
  }
}
