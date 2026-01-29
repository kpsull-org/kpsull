import { Entity, UniqueId, Result } from '@/shared/domain';
import { ReturnStatus } from '../value-objects/return-status.vo';
import { ReturnReason } from '../value-objects/return-reason.vo';

interface ReturnRequestProps {
  orderId: string;
  customerId: string;
  reason: ReturnReason;
  additionalNotes?: string;
  status: ReturnStatus;
  rejectionReason?: string;
  trackingNumber?: string;
  carrier?: string;
  deliveredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateReturnRequestProps {
  orderId: string;
  customerId: string;
  reason: ReturnReason;
  additionalNotes?: string;
  deliveredAt: Date;
}

interface ReconstituteReturnRequestProps {
  id: string;
  orderId: string;
  customerId: string;
  reason: string;
  additionalNotes?: string;
  status: string;
  rejectionReason?: string;
  trackingNumber?: string;
  carrier?: string;
  deliveredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ReturnRequest Entity
 *
 * Represents a customer's request to return an order.
 * Returns can only be initiated within 14 days of delivery.
 *
 * Lifecycle: REQUESTED -> APPROVED -> SHIPPED_BACK -> RECEIVED -> REFUNDED
 *                      -> REJECTED
 */
export class ReturnRequest extends Entity<ReturnRequestProps> {
  /**
   * Maximum number of days after delivery when a return can be requested.
   * Per French consumer law (droit de retractation).
   */
  static readonly RETURN_WINDOW_DAYS = 14;

  private constructor(props: ReturnRequestProps, id?: UniqueId) {
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

  get reason(): ReturnReason {
    return this.props.reason;
  }

  get additionalNotes(): string | undefined {
    return this.props.additionalNotes;
  }

  get status(): ReturnStatus {
    return this.props.status;
  }

  get rejectionReason(): string | undefined {
    return this.props.rejectionReason;
  }

  get trackingNumber(): string | undefined {
    return this.props.trackingNumber;
  }

  get carrier(): string | undefined {
    return this.props.carrier;
  }

  get deliveredAt(): Date {
    return this.props.deliveredAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Approve the return request
   */
  approve(): Result<void> {
    if (!this.status.canBeApproved) {
      return Result.fail('La demande de retour ne peut pas etre approuvee dans son etat actuel');
    }

    this.props.status = ReturnStatus.approved();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Reject the return request
   */
  reject(rejectionReason: string): Result<void> {
    if (!this.status.canBeRejected) {
      return Result.fail('La demande de retour ne peut pas etre rejetee dans son etat actuel');
    }

    if (!rejectionReason?.trim()) {
      return Result.fail('La raison du rejet est requise');
    }

    this.props.status = ReturnStatus.rejected();
    this.props.rejectionReason = rejectionReason.trim();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Mark the return as shipped back by the customer
   */
  markAsShippedBack(trackingNumber: string, carrier: string): Result<void> {
    if (!this.status.canBeShippedBack) {
      return Result.fail('Le retour ne peut pas etre marque comme expedie dans son etat actuel');
    }

    if (!trackingNumber?.trim()) {
      return Result.fail('Le numero de suivi est requis');
    }

    if (!carrier?.trim()) {
      return Result.fail('Le transporteur est requis');
    }

    this.props.status = ReturnStatus.shippedBack();
    this.props.trackingNumber = trackingNumber.trim();
    this.props.carrier = carrier.trim();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Mark the return as received by the creator
   */
  markAsReceived(): Result<void> {
    if (!this.status.canBeReceived) {
      return Result.fail('Le retour ne peut pas etre marque comme recu dans son etat actuel');
    }

    this.props.status = ReturnStatus.received();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Mark the return as refunded
   */
  markAsRefunded(): Result<void> {
    if (!this.status.canBeRefunded) {
      return Result.fail('Le retour ne peut pas etre marque comme rembourse dans son etat actuel');
    }

    this.props.status = ReturnStatus.refunded();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Check if a return can be requested for an order delivered at the given date
   */
  static canRequestReturn(deliveredAt: Date, now: Date = new Date()): boolean {
    const daysSinceDelivery = ReturnRequest.getDaysSinceDelivery(deliveredAt, now);
    return daysSinceDelivery <= ReturnRequest.RETURN_WINDOW_DAYS;
  }

  /**
   * Get the number of days since delivery
   */
  static getDaysSinceDelivery(deliveredAt: Date, now: Date = new Date()): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffInMs = now.getTime() - deliveredAt.getTime();
    return Math.floor(diffInMs / msPerDay);
  }

  /**
   * Get the number of days remaining in the return window
   */
  static getDaysRemainingInReturnWindow(deliveredAt: Date, now: Date = new Date()): number {
    const daysSinceDelivery = ReturnRequest.getDaysSinceDelivery(deliveredAt, now);
    return Math.max(0, ReturnRequest.RETURN_WINDOW_DAYS - daysSinceDelivery);
  }

  static create(props: CreateReturnRequestProps): Result<ReturnRequest> {
    if (!props.orderId?.trim()) {
      return Result.fail('Order ID est requis');
    }

    if (!props.customerId?.trim()) {
      return Result.fail('Customer ID est requis');
    }

    if (!props.deliveredAt) {
      return Result.fail('La date de livraison est requise');
    }

    const now = new Date();

    // Check return window
    if (!ReturnRequest.canRequestReturn(props.deliveredAt, now)) {
      const daysElapsed = ReturnRequest.getDaysSinceDelivery(props.deliveredAt, now);
      return Result.fail(
        `Le delai de retour de ${ReturnRequest.RETURN_WINDOW_DAYS} jours est depasse (${daysElapsed} jours depuis la livraison)`
      );
    }

    return Result.ok(
      new ReturnRequest({
        orderId: props.orderId,
        customerId: props.customerId,
        reason: props.reason,
        additionalNotes: props.additionalNotes?.trim(),
        status: ReturnStatus.requested(),
        deliveredAt: props.deliveredAt,
        createdAt: now,
        updatedAt: now,
      })
    );
  }

  static reconstitute(props: ReconstituteReturnRequestProps): Result<ReturnRequest> {
    const reasonResult = ReturnReason.fromString(props.reason);
    if (reasonResult.isFailure) {
      return Result.fail(reasonResult.error!);
    }

    const statusResult = ReturnStatus.fromString(props.status);
    if (statusResult.isFailure) {
      return Result.fail(statusResult.error!);
    }

    return Result.ok(
      new ReturnRequest(
        {
          orderId: props.orderId,
          customerId: props.customerId,
          reason: reasonResult.value,
          additionalNotes: props.additionalNotes,
          status: statusResult.value,
          rejectionReason: props.rejectionReason,
          trackingNumber: props.trackingNumber,
          carrier: props.carrier,
          deliveredAt: props.deliveredAt,
          createdAt: props.createdAt,
          updatedAt: props.updatedAt,
        },
        UniqueId.fromString(props.id)
      )
    );
  }
}
