import { Entity, UniqueId, Result } from '@/shared/domain';

interface CartItemProps {
  productId: string;
  variantId?: string;
  name: string;
  price: number; // in cents
  quantity: number;
  image?: string;
  variantInfo?: {
    type: string;
    value: string;
  };
  creatorSlug: string;
}

interface CreateCartItemProps {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  image?: string;
  variantInfo?: {
    type: string;
    value: string;
  };
  creatorSlug: string;
}

/**
 * CartItem Entity
 *
 * Represents a single item in the shopping cart.
 */
export class CartItem extends Entity<CartItemProps> {
  private constructor(props: CartItemProps, id?: UniqueId) {
    super(props, id);
  }

  get idString(): string {
    return this._id.toString();
  }

  get productId(): string {
    return this.props.productId;
  }

  get variantId(): string | undefined {
    return this.props.variantId;
  }

  get name(): string {
    return this.props.name;
  }

  get price(): number {
    return this.props.price;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get image(): string | undefined {
    return this.props.image;
  }

  get variantInfo(): { type: string; value: string } | undefined {
    return this.props.variantInfo;
  }

  get creatorSlug(): string {
    return this.props.creatorSlug;
  }

  get subtotal(): number {
    return this.price * this.quantity;
  }

  /**
   * Unique key for identifying the item (product + variant combination)
   */
  get key(): string {
    return this.variantId
      ? `${this.productId}:${this.variantId}`
      : this.productId;
  }

  incrementQuantity(): void {
    this.props.quantity += 1;
  }

  setQuantity(quantity: number): Result<void> {
    if (quantity < 0) {
      return Result.fail('La quantité ne peut pas être négative');
    }

    this.props.quantity = quantity;
    return Result.ok();
  }

  static create(props: CreateCartItemProps): Result<CartItem> {
    if (!props.productId?.trim()) {
      return Result.fail('Product ID est requis');
    }

    if (!props.name?.trim()) {
      return Result.fail('Le nom du produit est requis');
    }

    if (props.price < 0) {
      return Result.fail('Le prix ne peut pas être négatif');
    }

    if (!props.creatorSlug?.trim()) {
      return Result.fail('Creator slug est requis');
    }

    return Result.ok(
      new CartItem({
        productId: props.productId,
        variantId: props.variantId,
        name: props.name,
        price: props.price,
        quantity: 1,
        image: props.image,
        variantInfo: props.variantInfo,
        creatorSlug: props.creatorSlug,
      })
    );
  }

  static reconstitute(
    props: CartItemProps & { id: string }
  ): Result<CartItem> {
    return Result.ok(
      new CartItem(
        {
          productId: props.productId,
          variantId: props.variantId,
          name: props.name,
          price: props.price,
          quantity: props.quantity,
          image: props.image,
          variantInfo: props.variantInfo,
          creatorSlug: props.creatorSlug,
        },
        UniqueId.fromString(props.id)
      )
    );
  }
}
