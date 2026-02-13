import { Entity, UniqueId, Result } from '@/shared/domain';
import { OrderStatus } from '../value-objects/order-status.vo';
import { OrderItem } from './order-item.entity';

interface ShippingAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

interface OrderProps {
  orderNumber: string;
  creatorId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  status: OrderStatus;
  totalAmount: number; // in cents
  stripePaymentIntentId?: string;
  stripeRefundId?: string;
  trackingNumber?: string;
  carrier?: string;
  cancellationReason?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateOrderProps {
  creatorId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
}

/**
 * Order Entity (Aggregate Root)
 *
 * Represents a customer order containing items from a single creator.
 * Orders follow a lifecycle: PENDING -> PAID -> SHIPPED -> DELIVERED
 * Orders can be CANCELLED (before shipping) or REFUNDED (after payment).
 */
export class Order extends Entity<OrderProps> {
  private constructor(props: OrderProps, id?: UniqueId) {
    super(props, id);
  }

  get idString(): string {
    return this._id.toString();
  }

  get orderNumber(): string {
    return this.props.orderNumber;
  }

  get creatorId(): string {
    return this.props.creatorId;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get customerName(): string {
    return this.props.customerName;
  }

  get customerEmail(): string {
    return this.props.customerEmail;
  }

  get items(): OrderItem[] {
    return this.props.items;
  }

  get shippingAddress(): ShippingAddress {
    return this.props.shippingAddress;
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  get totalAmount(): number {
    return this.props.totalAmount;
  }

  get stripePaymentIntentId(): string | undefined {
    return this.props.stripePaymentIntentId;
  }

  get stripeRefundId(): string | undefined {
    return this.props.stripeRefundId;
  }

  get trackingNumber(): string | undefined {
    return this.props.trackingNumber;
  }

  get carrier(): string | undefined {
    return this.props.carrier;
  }

  get cancellationReason(): string | undefined {
    return this.props.cancellationReason;
  }

  get shippedAt(): Date | undefined {
    return this.props.shippedAt;
  }

  get deliveredAt(): Date | undefined {
    return this.props.deliveredAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Mark the order as paid
   */
  markAsPaid(stripePaymentIntentId: string): Result<void> {
    if (!this.status.isPending) {
      return Result.fail('Commande déjà payée ou dans un état incompatible');
    }

    this.props.status = OrderStatus.paid();
    this.props.stripePaymentIntentId = stripePaymentIntentId;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Ship the order with tracking information
   */
  ship(trackingNumber: string, carrier: string): Result<void> {
    if (!this.status.canBeShipped) {
      return Result.fail('La commande doit être payée avant expédition');
    }

    this.props.status = OrderStatus.shipped();
    this.props.trackingNumber = trackingNumber;
    this.props.carrier = carrier;
    this.props.shippedAt = new Date();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Mark the order as delivered
   */
  markAsDelivered(): Result<void> {
    if (!this.status.isShipped) {
      return Result.fail('La commande doit être expédiée avant livraison');
    }

    this.props.status = OrderStatus.delivered();
    this.props.deliveredAt = new Date();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Cancel the order
   */
  cancel(reason: string): Result<void> {
    if (!this.status.canBeCancelled) {
      return Result.fail('La commande ne peut pas être annulée car elle a été expédiée');
    }

    this.props.status = OrderStatus.cancelled();
    this.props.cancellationReason = reason;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Refund the order
   */
  refund(stripeRefundId: string, reason?: string): Result<void> {
    if (!this.status.canBeRefunded) {
      return Result.fail('La commande doit être payée pour être remboursée');
    }

    this.props.status = OrderStatus.refunded();
    this.props.stripeRefundId = stripeRefundId;
    if (reason) {
      this.props.cancellationReason = reason;
    }
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Generate unique order number
   */
  private static generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomUUID().replaceAll('-', '').substring(0, 4).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  /**
   * Calculate total amount from items
   */
  private static calculateTotal(items: OrderItem[]): number {
    return items.reduce((total, item) => total + item.subtotal, 0);
  }

  static create(props: CreateOrderProps): Result<Order> {
    if (!props.creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    if (!props.customerId?.trim()) {
      return Result.fail('Customer ID est requis');
    }

    if (!props.customerName?.trim()) {
      return Result.fail('Le nom du client est requis');
    }

    if (!props.customerEmail?.trim()) {
      return Result.fail("L'email du client est requis");
    }

    if (!props.items || props.items.length === 0) {
      return Result.fail('La commande doit contenir des articles');
    }

    if (!props.shippingAddress?.street?.trim()) {
      return Result.fail("L'adresse de livraison est requise");
    }

    const now = new Date();

    return Result.ok(
      new Order({
        orderNumber: Order.generateOrderNumber(),
        creatorId: props.creatorId,
        customerId: props.customerId,
        customerName: props.customerName,
        customerEmail: props.customerEmail,
        items: props.items,
        shippingAddress: props.shippingAddress,
        status: OrderStatus.pending(),
        totalAmount: Order.calculateTotal(props.items),
        createdAt: now,
        updatedAt: now,
      })
    );
  }

  static reconstitute(
    props: Omit<OrderProps, 'status'> & { id: string; status: string }
  ): Result<Order> {
    const statusResult = OrderStatus.fromString(props.status);
    if (statusResult.isFailure) {
      return Result.fail(statusResult.error!);
    }

    return Result.ok(
      new Order(
        {
          orderNumber: props.orderNumber,
          creatorId: props.creatorId,
          customerId: props.customerId,
          customerName: props.customerName,
          customerEmail: props.customerEmail,
          items: props.items,
          shippingAddress: props.shippingAddress,
          status: statusResult.value,
          totalAmount: props.totalAmount,
          stripePaymentIntentId: props.stripePaymentIntentId,
          stripeRefundId: props.stripeRefundId,
          trackingNumber: props.trackingNumber,
          carrier: props.carrier,
          cancellationReason: props.cancellationReason,
          shippedAt: props.shippedAt,
          deliveredAt: props.deliveredAt,
          createdAt: props.createdAt,
          updatedAt: props.updatedAt,
        },
        UniqueId.fromString(props.id)
      )
    );
  }
}
