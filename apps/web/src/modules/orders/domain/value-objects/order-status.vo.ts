import { ValueObject, Result } from '@/shared/domain';

export type OrderStatusValue =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

interface OrderStatusProps {
  value: OrderStatusValue;
}

/**
 * OrderStatus Value Object
 *
 * Represents the status of an order in its lifecycle.
 */
export class OrderStatus extends ValueObject<OrderStatusProps> {
  private constructor(props: OrderStatusProps) {
    super(props);
  }

  get value(): OrderStatusValue {
    return this.props.value;
  }

  get isPending(): boolean {
    return this.value === 'PENDING';
  }

  get isPaid(): boolean {
    return this.value === 'PAID';
  }

  get isProcessing(): boolean {
    return this.value === 'PROCESSING';
  }

  get isShipped(): boolean {
    return this.value === 'SHIPPED';
  }

  get isDelivered(): boolean {
    return this.value === 'DELIVERED';
  }

  get isCancelled(): boolean {
    return this.value === 'CANCELLED';
  }

  get isRefunded(): boolean {
    return this.value === 'REFUNDED';
  }

  get canBeCancelled(): boolean {
    return this.isPending || this.isPaid;
  }

  get canBeShipped(): boolean {
    return this.isPaid || this.isProcessing;
  }

  get canBeRefunded(): boolean {
    return this.isPaid || this.isShipped || this.isDelivered;
  }

  static pending(): OrderStatus {
    return new OrderStatus({ value: 'PENDING' });
  }

  static paid(): OrderStatus {
    return new OrderStatus({ value: 'PAID' });
  }

  static processing(): OrderStatus {
    return new OrderStatus({ value: 'PROCESSING' });
  }

  static shipped(): OrderStatus {
    return new OrderStatus({ value: 'SHIPPED' });
  }

  static delivered(): OrderStatus {
    return new OrderStatus({ value: 'DELIVERED' });
  }

  static cancelled(): OrderStatus {
    return new OrderStatus({ value: 'CANCELLED' });
  }

  static refunded(): OrderStatus {
    return new OrderStatus({ value: 'REFUNDED' });
  }

  static fromString(value: string): Result<OrderStatus> {
    const validStatuses: OrderStatusValue[] = [
      'PENDING',
      'PAID',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'REFUNDED',
    ];

    if (!validStatuses.includes(value as OrderStatusValue)) {
      return Result.fail(`Statut de commande invalide: ${value}`);
    }

    return Result.ok(new OrderStatus({ value: value as OrderStatusValue }));
  }
}
