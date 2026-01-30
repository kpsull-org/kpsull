import { Entity, UniqueId, Result } from '@/shared/domain';
import { Money } from '../value-objects/money.vo';

interface ProductVariantProps {
  productId: string;
  name: string;
  sku?: string;
  priceOverride?: Money;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateProductVariantProps {
  productId: string;
  name: string;
  sku?: string;
  priceOverride?: Money;
  stock: number;
}

interface ReconstituteProductVariantProps {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  priceOverrideAmount?: number;
  priceOverrideCurrency?: string;
  stock: number;
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

  get sku(): string | undefined {
    return this.props.sku;
  }

  get priceOverride(): Money | undefined {
    return this.props.priceOverride;
  }

  get stock(): number {
    return this.props.stock;
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

  updateSku(sku: string | undefined): void {
    this.props.sku = sku;
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
        sku: props.sku,
        priceOverride: props.priceOverride,
        stock: props.stock,
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
          sku: props.sku,
          priceOverride,
          stock: props.stock,
          createdAt: props.createdAt,
          updatedAt: props.updatedAt,
        },
        UniqueId.fromString(props.id)
      )
    );
  }
}
