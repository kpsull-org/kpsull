import { Entity, UniqueId, Result } from '@/shared/domain';
import { CartItem } from './cart-item.entity';

interface CartProps {
  userId?: string;
  items: CartItem[];
  updatedAt: Date;
}

interface CreateCartProps {
  userId?: string;
}

/**
 * Cart Entity (Aggregate Root)
 *
 * Represents a shopping cart containing items.
 * Can be associated with a user or used as a guest cart.
 */
export class Cart extends Entity<CartProps> {
  private constructor(props: CartProps, id?: UniqueId) {
    super(props, id);
  }

  get idString(): string {
    return this._id.toString();
  }

  get userId(): string | undefined {
    return this.props.userId;
  }

  get items(): readonly CartItem[] {
    return this.props.items;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get isEmpty(): boolean {
    return this.props.items.length === 0;
  }

  get itemCount(): number {
    return this.props.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get total(): number {
    return this.props.items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  /**
   * Add an item to the cart.
   * If the item (same product + variant) already exists, increment quantity.
   */
  addItem(item: CartItem): Result<void> {
    const existingIndex = this.props.items.findIndex(
      (i) => i.key === item.key
    );

    if (existingIndex >= 0) {
      this.props.items[existingIndex]?.incrementQuantity();
    } else {
      this.props.items.push(item);
    }

    this.props.updatedAt = new Date();
    return Result.ok();
  }

  /**
   * Remove an item from the cart.
   */
  removeItem(productId: string, variantId?: string): Result<void> {
    const key = variantId ? `${productId}:${variantId}` : productId;
    const index = this.props.items.findIndex((i) => i.key === key);

    if (index < 0) {
      return Result.fail('Article non trouvé dans le panier');
    }

    this.props.items.splice(index, 1);
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Update the quantity of an item.
   * Removes the item if quantity is 0.
   */
  updateQuantity(productId: string, quantity: number, variantId?: string): Result<void> {
    if (quantity < 0) {
      return Result.fail('La quantité ne peut pas être négative');
    }

    if (quantity === 0) {
      return this.removeItem(productId, variantId);
    }

    const key = variantId ? `${productId}:${variantId}` : productId;
    const item = this.props.items.find((i) => i.key === key);

    if (!item) {
      return Result.fail('Article non trouvé dans le panier');
    }

    item.setQuantity(quantity);
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Clear all items from the cart.
   */
  clear(): void {
    this.props.items = [];
    this.props.updatedAt = new Date();
  }

  /**
   * Merge another cart into this one.
   * Useful for syncing guest cart with user cart on login.
   */
  merge(other: Cart): void {
    for (const item of other.items) {
      this.addItem(item);
    }
  }

  /**
   * Associate the cart with a user.
   */
  assignToUser(userId: string): void {
    this.props.userId = userId;
    this.props.updatedAt = new Date();
  }

  static create(props: CreateCartProps): Result<Cart> {
    return Result.ok(
      new Cart({
        userId: props.userId,
        items: [],
        updatedAt: new Date(),
      })
    );
  }

  static reconstitute(
    props: {
      id: string;
      userId?: string;
      items: CartItem[];
      updatedAt: Date;
    }
  ): Result<Cart> {
    return Result.ok(
      new Cart(
        {
          userId: props.userId,
          items: props.items,
          updatedAt: props.updatedAt,
        },
        UniqueId.fromString(props.id)
      )
    );
  }
}
