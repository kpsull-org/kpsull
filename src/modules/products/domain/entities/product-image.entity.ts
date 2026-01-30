import { Entity, UniqueId, Result } from '@/shared/domain';
import { ImageUrl, ImageUrlType } from '../value-objects/image-url.vo';

interface ProductImageProps {
  productId: string;
  url: ImageUrl;
  alt: string;
  position: number;
  createdAt: Date;
}

interface CreateProductImageProps {
  productId: string;
  url: ImageUrl;
  alt: string;
  position: number;
}

interface ReconstituteProductImageProps {
  id: string;
  productId: string;
  url: string;
  urlType: ImageUrlType;
  alt: string;
  position: number;
  createdAt: Date;
}

/**
 * ProductImage Entity
 *
 * Represents an image associated with a product.
 * Position 0 indicates the main/primary image.
 */
export class ProductImage extends Entity<ProductImageProps> {
  private constructor(props: ProductImageProps, id?: UniqueId) {
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

  get url(): ImageUrl {
    return this.props.url;
  }

  get alt(): string {
    return this.props.alt;
  }

  get position(): number {
    return this.props.position;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Computed properties
  get isMainImage(): boolean {
    return this.props.position === 0;
  }

  // Methods
  updatePosition(newPosition: number): Result<void> {
    if (newPosition < 0) {
      return Result.fail('La position ne peut pas être négative');
    }

    this.props.position = newPosition;
    return Result.ok();
  }

  updateAlt(newAlt: string): void {
    this.props.alt = newAlt.trim();
  }

  // Factory methods
  static create(props: CreateProductImageProps): Result<ProductImage> {
    if (!props.productId?.trim()) {
      return Result.fail('Product ID est requis');
    }

    if (props.position < 0) {
      return Result.fail('La position ne peut pas être négative');
    }

    return Result.ok(
      new ProductImage({
        productId: props.productId.trim(),
        url: props.url,
        alt: props.alt.trim(),
        position: props.position,
        createdAt: new Date(),
      })
    );
  }

  static reconstitute(props: ReconstituteProductImageProps): Result<ProductImage> {
    const imageUrl = ImageUrl.reconstitute(props.url, props.urlType);

    return Result.ok(
      new ProductImage(
        {
          productId: props.productId,
          url: imageUrl,
          alt: props.alt,
          position: props.position,
          createdAt: props.createdAt,
        },
        UniqueId.fromString(props.id)
      )
    );
  }
}
