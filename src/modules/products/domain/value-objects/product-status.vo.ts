import { ValueObject, Result } from '@/shared/domain';

export type ProductStatusValue = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

interface ProductStatusProps {
  value: ProductStatusValue;
}

/**
 * ProductStatus Value Object
 *
 * Represents the publication status of a product.
 */
export class ProductStatus extends ValueObject<ProductStatusProps> {
  private constructor(props: ProductStatusProps) {
    super(props);
  }

  get value(): ProductStatusValue {
    return this.props.value;
  }

  get isDraft(): boolean {
    return this.value === 'DRAFT';
  }

  get isPublished(): boolean {
    return this.value === 'PUBLISHED';
  }

  get isArchived(): boolean {
    return this.value === 'ARCHIVED';
  }

  static draft(): ProductStatus {
    return new ProductStatus({ value: 'DRAFT' });
  }

  static published(): ProductStatus {
    return new ProductStatus({ value: 'PUBLISHED' });
  }

  static archived(): ProductStatus {
    return new ProductStatus({ value: 'ARCHIVED' });
  }

  static fromString(value: string): Result<ProductStatus> {
    const validStatuses: ProductStatusValue[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

    if (!validStatuses.includes(value as ProductStatusValue)) {
      return Result.fail(`Statut invalide: ${value}`);
    }

    return Result.ok(new ProductStatus({ value: value as ProductStatusValue }));
  }
}
