import { Entity, UniqueId, Result } from '@/shared/domain';

interface WishlistItemProps {
  userId: string;
  productId: string;
  productName: string;
  productPrice: number; // in cents
  productImage?: string;
  creatorId: string;
  creatorName: string;
  addedAt: Date;
}

interface CreateWishlistItemProps {
  userId: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string;
  creatorId: string;
  creatorName: string;
}

interface ReconstituteWishlistItemProps extends CreateWishlistItemProps {
  id: string;
  addedAt: Date;
}

/**
 * WishlistItem Entity
 *
 * Represents a product saved to a user's wishlist.
 * Contains a snapshot of product/creator info at the time of addition.
 */
export class WishlistItem extends Entity<WishlistItemProps> {
  private constructor(props: WishlistItemProps, id?: UniqueId) {
    super(props, id);
  }

  get idString(): string {
    return this._id.toString();
  }

  get userId(): string {
    return this.props.userId;
  }

  get productId(): string {
    return this.props.productId;
  }

  get productName(): string {
    return this.props.productName;
  }

  get productPrice(): number {
    return this.props.productPrice;
  }

  get productImage(): string | undefined {
    return this.props.productImage;
  }

  get creatorId(): string {
    return this.props.creatorId;
  }

  get creatorName(): string {
    return this.props.creatorName;
  }

  get addedAt(): Date {
    return this.props.addedAt;
  }

  /**
   * Unique key for identifying the wishlist item (user + product combination)
   */
  get uniqueKey(): string {
    return `${this.userId}:${this.productId}`;
  }

  static create(props: CreateWishlistItemProps): Result<WishlistItem> {
    if (!props.userId?.trim()) {
      return Result.fail('User ID est requis');
    }

    if (!props.productId?.trim()) {
      return Result.fail('Product ID est requis');
    }

    if (!props.productName?.trim()) {
      return Result.fail('Le nom du produit est requis');
    }

    if (props.productPrice < 0) {
      return Result.fail('Le prix ne peut pas etre negatif');
    }

    if (!props.creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    if (!props.creatorName?.trim()) {
      return Result.fail('Le nom du createur est requis');
    }

    return Result.ok(
      new WishlistItem({
        userId: props.userId.trim(),
        productId: props.productId.trim(),
        productName: props.productName.trim(),
        productPrice: props.productPrice,
        productImage: props.productImage,
        creatorId: props.creatorId.trim(),
        creatorName: props.creatorName.trim(),
        addedAt: new Date(),
      })
    );
  }

  static reconstitute(props: ReconstituteWishlistItemProps): Result<WishlistItem> {
    return Result.ok(
      new WishlistItem(
        {
          userId: props.userId,
          productId: props.productId,
          productName: props.productName,
          productPrice: props.productPrice,
          productImage: props.productImage,
          creatorId: props.creatorId,
          creatorName: props.creatorName,
          addedAt: props.addedAt,
        },
        UniqueId.fromString(props.id)
      )
    );
  }
}
