import { Entity, UniqueId, Result } from '@/shared/domain';

interface OrderItemProps {
  productId: string;
  variantId?: string;
  productName: string;
  variantInfo?: string;
  price: number; // in cents
  quantity: number;
  image?: string;
}

interface CreateOrderItemProps {
  productId: string;
  variantId?: string;
  productName: string;
  variantInfo?: string;
  price: number;
  quantity: number;
  image?: string;
}

/**
 * OrderItem Entity
 *
 * Represents a single item in an order.
 */
export class OrderItem extends Entity<OrderItemProps> {
  private constructor(props: OrderItemProps, id?: UniqueId) {
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

  get productName(): string {
    return this.props.productName;
  }

  get variantInfo(): string | undefined {
    return this.props.variantInfo;
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

  get subtotal(): number {
    return this.price * this.quantity;
  }

  static create(props: CreateOrderItemProps): Result<OrderItem> {
    if (!props.productId?.trim()) {
      return Result.fail('Product ID est requis');
    }

    if (!props.productName?.trim()) {
      return Result.fail('Le nom du produit est requis');
    }

    if (props.price < 0) {
      return Result.fail('Le prix ne peut pas être négatif');
    }

    if (props.quantity < 1) {
      return Result.fail('La quantité doit être au moins 1');
    }

    return Result.ok(
      new OrderItem({
        productId: props.productId,
        variantId: props.variantId,
        productName: props.productName,
        variantInfo: props.variantInfo,
        price: props.price,
        quantity: props.quantity,
        image: props.image,
      })
    );
  }

  static reconstitute(
    props: OrderItemProps & { id: string }
  ): Result<OrderItem> {
    return Result.ok(
      new OrderItem(
        {
          productId: props.productId,
          variantId: props.variantId,
          productName: props.productName,
          variantInfo: props.variantInfo,
          price: props.price,
          quantity: props.quantity,
          image: props.image,
        },
        UniqueId.fromString(props.id)
      )
    );
  }
}
