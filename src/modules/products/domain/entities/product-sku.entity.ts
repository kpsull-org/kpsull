import { Entity, UniqueId, Result } from '@/shared/domain';

interface ProductSkuProps {
  productId: string;
  variantId: string;
  size?: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateProductSkuData {
  productId: string;
  variantId: string;
  size?: string;
  stock: number;
}

interface ReconstituteProductSkuData {
  id: string;
  productId: string;
  variantId: string;
  size?: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductSku extends Entity<ProductSkuProps> {
  private constructor(props: ProductSkuProps, id?: UniqueId) {
    super(props, id);
  }

  get idString(): string {
    return this._id.toString();
  }

  get productId(): string {
    return this.props.productId;
  }

  get variantId(): string {
    return this.props.variantId;
  }

  get size(): string | undefined {
    return this.props.size;
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

  updateStock(stock: number): Result<void> {
    if (stock < 0) {
      return Result.fail('Le stock ne peut pas être négatif');
    }
    this.props.stock = stock;
    this.props.updatedAt = new Date();
    return Result.ok();
  }

  static create(data: CreateProductSkuData): Result<ProductSku> {
    if (data.stock < 0) {
      return Result.fail('Le stock ne peut pas être négatif');
    }
    const now = new Date();
    return Result.ok(
      new ProductSku({
        productId: data.productId,
        variantId: data.variantId,
        size: data.size,
        stock: data.stock,
        createdAt: now,
        updatedAt: now,
      })
    );
  }

  static reconstitute(data: ReconstituteProductSkuData): Result<ProductSku> {
    return Result.ok(
      new ProductSku(
        {
          productId: data.productId,
          variantId: data.variantId,
          size: data.size,
          stock: data.stock,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        },
        UniqueId.fromString(data.id)
      )
    );
  }
}
