import { Entity, UniqueId, Result } from '@/shared/domain';
import { PaymentStatus } from '../value-objects/payment-status.vo';
import { PaymentMethod } from '../value-objects/payment-method.vo';

interface PaymentProps {
  orderId: string;
  customerId: string;
  creatorId: string;
  amount: number; // in cents
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  stripePaymentIntentId: string | null;
  stripeRefundId: string | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreatePaymentProps {
  orderId: string;
  customerId: string;
  creatorId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
}

interface ReconstitutePaymentProps {
  id: string;
  orderId: string;
  customerId: string;
  creatorId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  stripePaymentIntentId: string | null;
  stripeRefundId: string | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment Entity
 *
 * Represents a payment for an order, tracking Stripe integration and status.
 */
export class Payment extends Entity<PaymentProps> {
  private constructor(props: PaymentProps, id?: UniqueId) {
    super(props, id);
  }

  get idString(): string {
    return this._id.toString();
  }

  get orderId(): string {
    return this.props.orderId;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get creatorId(): string {
    return this.props.creatorId;
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  get status(): PaymentStatus {
    return this.props.status;
  }

  get paymentMethod(): PaymentMethod {
    return this.props.paymentMethod;
  }

  get stripePaymentIntentId(): string | null {
    return this.props.stripePaymentIntentId;
  }

  get stripeRefundId(): string | null {
    return this.props.stripeRefundId;
  }

  get failureReason(): string | null {
    return this.props.failureReason;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Get amount in decimal format (e.g., 29.99)
   */
  get displayAmount(): number {
    return this.amount / 100;
  }

  /**
   * Get formatted amount with currency symbol
   */
  get formattedAmount(): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: this.currency,
    }).format(this.displayAmount);
  }

  /**
   * Mark payment as processing with Stripe payment intent
   */
  markAsProcessing(stripePaymentIntentId: string): Result<void> {
    if (!this.status.canBeProcessed) {
      return Result.fail(
        `Impossible de traiter le paiement dans l'état actuel: ${this.status.value}`
      );
    }

    this.props.status = PaymentStatus.processing();
    this.props.stripePaymentIntentId = stripePaymentIntentId;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Mark payment as succeeded
   */
  markAsSucceeded(stripePaymentIntentId?: string): Result<void> {
    if (this.status.isSucceeded || this.status.isFailed || this.status.isRefunded) {
      return Result.fail('Le paiement est déjà dans un état final');
    }

    this.props.status = PaymentStatus.succeeded();
    if (stripePaymentIntentId) {
      this.props.stripePaymentIntentId = stripePaymentIntentId;
    }
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Mark payment as failed with reason
   */
  markAsFailed(reason: string): Result<void> {
    if (this.status.isFailed || this.status.isSucceeded || this.status.isRefunded) {
      return Result.fail('Le paiement est déjà dans un état final');
    }

    this.props.status = PaymentStatus.failed();
    this.props.failureReason = reason;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Refund a succeeded payment
   */
  refund(stripeRefundId: string): Result<void> {
    if (!this.status.canBeRefunded) {
      return Result.fail('Seul un paiement réussi peut être remboursé');
    }

    this.props.status = PaymentStatus.refunded();
    this.props.stripeRefundId = stripeRefundId;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  static create(props: CreatePaymentProps): Result<Payment> {
    if (!props.orderId?.trim()) {
      return Result.fail('Order ID est requis');
    }

    if (!props.customerId?.trim()) {
      return Result.fail('Customer ID est requis');
    }

    if (!props.creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    if (!props.amount || props.amount <= 0) {
      return Result.fail('Le montant doit être supérieur à 0');
    }

    const now = new Date();

    return Result.ok(
      new Payment({
        orderId: props.orderId,
        customerId: props.customerId,
        creatorId: props.creatorId,
        amount: props.amount,
        currency: props.currency || 'EUR',
        status: PaymentStatus.pending(),
        paymentMethod: props.paymentMethod,
        stripePaymentIntentId: null,
        stripeRefundId: null,
        failureReason: null,
        createdAt: now,
        updatedAt: now,
      })
    );
  }

  static reconstitute(props: ReconstitutePaymentProps): Result<Payment> {
    const statusResult = PaymentStatus.fromString(props.status);
    if (statusResult.isFailure) {
      return Result.fail(statusResult.error!);
    }

    const methodResult = PaymentMethod.fromString(props.paymentMethod);
    if (methodResult.isFailure) {
      return Result.fail(methodResult.error!);
    }

    return Result.ok(
      new Payment(
        {
          orderId: props.orderId,
          customerId: props.customerId,
          creatorId: props.creatorId,
          amount: props.amount,
          currency: props.currency,
          status: statusResult.value,
          paymentMethod: methodResult.value,
          stripePaymentIntentId: props.stripePaymentIntentId,
          stripeRefundId: props.stripeRefundId,
          failureReason: props.failureReason,
          createdAt: props.createdAt,
          updatedAt: props.updatedAt,
        },
        UniqueId.fromString(props.id)
      )
    );
  }
}
