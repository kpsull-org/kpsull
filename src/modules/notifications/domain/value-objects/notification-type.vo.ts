import { ValueObject, Result } from '@/shared/domain';

export type NotificationTypeValue =
  | 'ORDER_RECEIVED'
  | 'ORDER_PAID'
  | 'ORDER_SHIPPED'
  | 'REVIEW_RECEIVED'
  | 'SUBSCRIPTION_RENEWED'
  | 'SUBSCRIPTION_EXPIRING'
  | 'PAYMENT_FAILED';

interface NotificationTypeProps {
  value: NotificationTypeValue;
}

/**
 * NotificationType Value Object
 *
 * Represents the type of a notification in the system.
 */
export class NotificationType extends ValueObject<NotificationTypeProps> {
  private static readonly VALID_TYPES: NotificationTypeValue[] = [
    'ORDER_RECEIVED',
    'ORDER_PAID',
    'ORDER_SHIPPED',
    'REVIEW_RECEIVED',
    'SUBSCRIPTION_RENEWED',
    'SUBSCRIPTION_EXPIRING',
    'PAYMENT_FAILED',
  ];

  private static readonly ORDER_TYPES: NotificationTypeValue[] = [
    'ORDER_RECEIVED',
    'ORDER_PAID',
    'ORDER_SHIPPED',
  ];

  private static readonly SUBSCRIPTION_TYPES: NotificationTypeValue[] = [
    'SUBSCRIPTION_RENEWED',
    'SUBSCRIPTION_EXPIRING',
  ];

  private constructor(props: NotificationTypeProps) {
    super(props);
  }

  get value(): NotificationTypeValue {
    return this.props.value;
  }

  get isOrderReceived(): boolean {
    return this.value === 'ORDER_RECEIVED';
  }

  get isOrderPaid(): boolean {
    return this.value === 'ORDER_PAID';
  }

  get isOrderShipped(): boolean {
    return this.value === 'ORDER_SHIPPED';
  }

  get isReviewReceived(): boolean {
    return this.value === 'REVIEW_RECEIVED';
  }

  get isSubscriptionRenewed(): boolean {
    return this.value === 'SUBSCRIPTION_RENEWED';
  }

  get isSubscriptionExpiring(): boolean {
    return this.value === 'SUBSCRIPTION_EXPIRING';
  }

  get isPaymentFailed(): boolean {
    return this.value === 'PAYMENT_FAILED';
  }

  get isOrderRelated(): boolean {
    return NotificationType.ORDER_TYPES.includes(this.value);
  }

  get isSubscriptionRelated(): boolean {
    return NotificationType.SUBSCRIPTION_TYPES.includes(this.value);
  }

  static orderReceived(): NotificationType {
    return new NotificationType({ value: 'ORDER_RECEIVED' });
  }

  static orderPaid(): NotificationType {
    return new NotificationType({ value: 'ORDER_PAID' });
  }

  static orderShipped(): NotificationType {
    return new NotificationType({ value: 'ORDER_SHIPPED' });
  }

  static reviewReceived(): NotificationType {
    return new NotificationType({ value: 'REVIEW_RECEIVED' });
  }

  static subscriptionRenewed(): NotificationType {
    return new NotificationType({ value: 'SUBSCRIPTION_RENEWED' });
  }

  static subscriptionExpiring(): NotificationType {
    return new NotificationType({ value: 'SUBSCRIPTION_EXPIRING' });
  }

  static paymentFailed(): NotificationType {
    return new NotificationType({ value: 'PAYMENT_FAILED' });
  }

  static fromString(value: string): Result<NotificationType> {
    if (!NotificationType.VALID_TYPES.includes(value as NotificationTypeValue)) {
      return Result.fail(`Type de notification invalide: ${value}`);
    }

    return Result.ok(new NotificationType({ value: value as NotificationTypeValue }));
  }
}
