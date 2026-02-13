import { ValueObject, Result } from '@/shared/domain';

export type NotificationTypeValue =
  // Client emails
  | 'WELCOME'
  | 'VERIFICATION_CODE'
  | 'PASSWORD_RESET'
  | 'ORDER_CONFIRMED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'REFUND_PROCESSED'
  | 'RETURN_APPROVED'
  | 'RETURN_REJECTED'
  | 'DISPUTE_UPDATE'
  // Creator emails
  | 'CREATOR_WELCOME'
  | 'CREATOR_ACTIVATED'
  | 'ORDER_RECEIVED'
  | 'ORDER_PAID'
  | 'RETURN_REQUEST_RECEIVED'
  | 'DISPUTE_OPENED'
  | 'REVIEW_RECEIVED'
  | 'SUBSCRIPTION_RENEWED'
  | 'SUBSCRIPTION_EXPIRING'
  | 'PAYMENT_FAILED'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_REACTIVATED';

interface NotificationTypeProps {
  value: NotificationTypeValue;
}

export class NotificationType extends ValueObject<NotificationTypeProps> {
  private static readonly VALID_TYPES: NotificationTypeValue[] = [
    'WELCOME', 'VERIFICATION_CODE', 'PASSWORD_RESET',
    'ORDER_CONFIRMED', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'ORDER_CANCELLED',
    'REFUND_PROCESSED', 'RETURN_APPROVED', 'RETURN_REJECTED', 'DISPUTE_UPDATE',
    'CREATOR_WELCOME', 'CREATOR_ACTIVATED',
    'ORDER_RECEIVED', 'ORDER_PAID',
    'RETURN_REQUEST_RECEIVED', 'DISPUTE_OPENED', 'REVIEW_RECEIVED',
    'SUBSCRIPTION_RENEWED', 'SUBSCRIPTION_EXPIRING', 'PAYMENT_FAILED',
    'ACCOUNT_SUSPENDED', 'ACCOUNT_REACTIVATED',
  ];

  private static readonly MANDATORY_TYPES: NotificationTypeValue[] = [
    'WELCOME', 'VERIFICATION_CODE', 'PASSWORD_RESET',
    'ORDER_CONFIRMED', 'ORDER_SHIPPED', 'ORDER_CANCELLED', 'REFUND_PROCESSED',
    'CREATOR_WELCOME', 'CREATOR_ACTIVATED',
    'ORDER_RECEIVED', 'ORDER_PAID',
    'RETURN_REQUEST_RECEIVED', 'DISPUTE_OPENED',
    'SUBSCRIPTION_RENEWED', 'PAYMENT_FAILED',
    'ACCOUNT_SUSPENDED', 'ACCOUNT_REACTIVATED',
  ];

  private constructor(props: NotificationTypeProps) {
    super(props);
  }

  get value(): NotificationTypeValue {
    return this.props.value;
  }

  get isMandatory(): boolean {
    return NotificationType.MANDATORY_TYPES.includes(this.value);
  }

  get isOrderRelated(): boolean {
    return ['ORDER_CONFIRMED', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'ORDER_CANCELLED', 'ORDER_RECEIVED', 'ORDER_PAID'].includes(this.value);
  }

  get isSubscriptionRelated(): boolean {
    return ['SUBSCRIPTION_RENEWED', 'SUBSCRIPTION_EXPIRING', 'PAYMENT_FAILED'].includes(this.value);
  }

  // Static factories
  static welcome(): NotificationType { return new NotificationType({ value: 'WELCOME' }); }
  static orderConfirmed(): NotificationType { return new NotificationType({ value: 'ORDER_CONFIRMED' }); }
  static orderShipped(): NotificationType { return new NotificationType({ value: 'ORDER_SHIPPED' }); }
  static orderDelivered(): NotificationType { return new NotificationType({ value: 'ORDER_DELIVERED' }); }
  static orderCancelled(): NotificationType { return new NotificationType({ value: 'ORDER_CANCELLED' }); }
  static orderReceived(): NotificationType { return new NotificationType({ value: 'ORDER_RECEIVED' }); }
  static orderPaid(): NotificationType { return new NotificationType({ value: 'ORDER_PAID' }); }
  static reviewReceived(): NotificationType { return new NotificationType({ value: 'REVIEW_RECEIVED' }); }
  static subscriptionRenewed(): NotificationType { return new NotificationType({ value: 'SUBSCRIPTION_RENEWED' }); }
  static subscriptionExpiring(): NotificationType { return new NotificationType({ value: 'SUBSCRIPTION_EXPIRING' }); }
  static paymentFailed(): NotificationType { return new NotificationType({ value: 'PAYMENT_FAILED' }); }
  static accountSuspended(): NotificationType { return new NotificationType({ value: 'ACCOUNT_SUSPENDED' }); }
  static accountReactivated(): NotificationType { return new NotificationType({ value: 'ACCOUNT_REACTIVATED' }); }

  static fromString(value: string): Result<NotificationType> {
    if (!NotificationType.VALID_TYPES.includes(value as NotificationTypeValue)) {
      return Result.fail(`Type de notification invalide: ${value}`);
    }
    return Result.ok(new NotificationType({ value: value as NotificationTypeValue }));
  }
}
