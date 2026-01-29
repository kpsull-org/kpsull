import { ValueObject, Result } from '@/shared/domain';

export type OrderStatusValue =
  | 'PENDING'
  | 'PAID'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'VALIDATION_PENDING'
  | 'COMPLETED'
  | 'DISPUTE_OPENED'
  | 'RETURN_SHIPPED'
  | 'RETURN_RECEIVED'
  | 'REFUNDED'
  | 'CANCELED';

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

  get isShipped(): boolean {
    return this.value === 'SHIPPED';
  }

  get isDelivered(): boolean {
    return this.value === 'DELIVERED';
  }

  get isValidationPending(): boolean {
    return this.value === 'VALIDATION_PENDING';
  }

  get isCompleted(): boolean {
    return this.value === 'COMPLETED';
  }

  get isDisputeOpened(): boolean {
    return this.value === 'DISPUTE_OPENED';
  }

  get isCanceled(): boolean {
    return this.value === 'CANCELED';
  }

  get isRefunded(): boolean {
    return this.value === 'REFUNDED';
  }

  get canBeCancelled(): boolean {
    return this.isPending || this.isPaid;
  }

  get canBeShipped(): boolean {
    return this.isPaid;
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

  static shipped(): OrderStatus {
    return new OrderStatus({ value: 'SHIPPED' });
  }

  static delivered(): OrderStatus {
    return new OrderStatus({ value: 'DELIVERED' });
  }

  static validationPending(): OrderStatus {
    return new OrderStatus({ value: 'VALIDATION_PENDING' });
  }

  static completed(): OrderStatus {
    return new OrderStatus({ value: 'COMPLETED' });
  }

  static disputeOpened(): OrderStatus {
    return new OrderStatus({ value: 'DISPUTE_OPENED' });
  }

  static cancelled(): OrderStatus {
    return new OrderStatus({ value: 'CANCELED' });
  }

  static refunded(): OrderStatus {
    return new OrderStatus({ value: 'REFUNDED' });
  }

  static fromString(value: string): Result<OrderStatus> {
    const validStatuses: OrderStatusValue[] = [
      'PENDING',
      'PAID',
      'SHIPPED',
      'DELIVERED',
      'VALIDATION_PENDING',
      'COMPLETED',
      'DISPUTE_OPENED',
      'RETURN_SHIPPED',
      'RETURN_RECEIVED',
      'REFUNDED',
      'CANCELED',
    ];

    if (!validStatuses.includes(value as OrderStatusValue)) {
      return Result.fail(`Statut de commande invalide: ${value}`);
    }

    return Result.ok(new OrderStatus({ value: value as OrderStatusValue }));
  }
}
