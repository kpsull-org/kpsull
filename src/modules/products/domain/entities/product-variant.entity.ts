import { Entity, UniqueId, Result } from '@/shared/domain';
import { Money } from '../value-objects/money.vo';

interface ProductVariantProps {
  productId: string;
  name: string;
  priceOverride?: Money;
  stock: number;
  color?: string;
  colorCode?: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface CreateProductVariantProps {
  productId: string;
  name: string;
  priceOverride?: Money;
  stock: number;
  color?: string;
  colorCode?: string;
}

interface ReconstituteProductVariantProps {
  id: string;
  productId: string;
  name: string;
  priceOverrideAmount?: number;
  priceOverrideCurrency?: string;
  stock: number;
  color?: string;
  colorCode?: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ProductVariant Entity
 *
 * Represents a variant of a product (e.g., size, color).
 * Variants can have their own stock and optional price override.
 */
export class ProductVariant extends Entity<ProductVariantProps> {
  private constructor(props: ProductVariantProps, id?: UniqueId) {
    super(props, id);
  }

  // Get ID as string
  get idString(): string {
    return this._id.toString();
  }

  // Getters
  get productId(): string {
    return this.props.productId;
  }

  get name(): string {
    return this.props.name;
  }

  get priceOverride(): Money | undefined {
    return this.props.priceOverride;
  }

  get stock(): number {
    return this.props.stock;
  }

  get color(): string | undefined {
    return this.props.color;
  }

  get colorCode(): string | undefined {
    return this.props.colorCode;
  }

  get images(): string[] {
    return this.props.images ?? [];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Computed properties
  get isAvailable(): boolean {
    return this.props.stock > 0;
  }

  get hasPriceOverride(): boolean {
    return this.props.priceOverride !== undefined;
  }

  // Methods
  updateStock(newStock: number): Result<void> {
    if (newStock < 0) {
      return Result.fail('Le stock ne peut pas être négatif');
    }

    this.props.stock = newStock;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  updatePrice(price: Money | undefined): void {
    this.props.priceOverride = price;
    this.props.updatedAt = new Date();
  }

  updateName(name: string): Result<void> {
    if (!name.trim()) {
      return Result.fail('Le nom de la variante est requis');
    }

    if (name.length > 100) {
      return Result.fail('Le nom ne peut pas dépasser 100 caractères');
    }

    this.props.name = name.trim();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  updateColor(color: string | undefined, colorCode: string | undefined): void {
    this.props.color = color;
    this.props.colorCode = colorCode;
    this.props.updatedAt = new Date();
  }


  disable(): Result<void> {
    this.props.stock = 0;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  // Factory methods
  static create(props: CreateProductVariantProps): Result<ProductVariant> {
    if (!props.productId?.trim()) {
      return Result.fail('Product ID est requis');
    }

    if (!props.name?.trim()) {
      return Result.fail('Le nom de la variante est requis');
    }

    if (props.name.length > 100) {
      return Result.fail('Le nom ne peut pas dépasser 100 caractères');
    }

    if (props.stock < 0) {
      return Result.fail('Le stock ne peut pas être négatif');
    }

    const now = new Date();

    return Result.ok(
      new ProductVariant({
        productId: props.productId.trim(),
        name: props.name.trim(),
        priceOverride: props.priceOverride,
        stock: props.stock,
        color: props.color,
        colorCode: props.colorCode,
        createdAt: now,
        updatedAt: now,
      })
    );
  }

  static reconstitute(props: ReconstituteProductVariantProps): Result<ProductVariant> {
    let priceOverride: Money | undefined;
    if (props.priceOverrideAmount !== undefined && props.priceOverrideCurrency !== undefined) {
      priceOverride = Money.fromCents(props.priceOverrideAmount, props.priceOverrideCurrency);
    }

    return Result.ok(
      new ProductVariant(
        {
          productId: props.productId,
          name: props.name,
          priceOverride,
          stock: props.stock,
          color: props.color,
          colorCode: props.colorCode,
          images: props.images ?? [],
          createdAt: props.createdAt,
          updatedAt: props.updatedAt,
        },
        UniqueId.fromString(props.id)
      )
    );
  }
}
