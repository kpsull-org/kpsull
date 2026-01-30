import { ValueObject, Result } from '@/shared/domain';

/**
 * Enum representing the possible tracking statuses
 */
export type TrackingStatusValue =
  | 'PENDING'
  | 'INFO_RECEIVED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED_ATTEMPT'
  | 'EXCEPTION'
  | 'EXPIRED';

/**
 * Labels for each tracking status (French)
 */
export const TrackingStatusLabels: Record<TrackingStatusValue, string> = {
  PENDING: 'En attente',
  INFO_RECEIVED: 'Informations recues',
  IN_TRANSIT: 'En transit',
  OUT_FOR_DELIVERY: 'En cours de livraison',
  DELIVERED: 'Livre',
  FAILED_ATTEMPT: 'Tentative echouee',
  EXCEPTION: 'Probleme de livraison',
  EXPIRED: 'Expire',
};

/**
 * Status progression order for timeline display
 */
export const TrackingStatusOrder: Record<TrackingStatusValue, number> = {
  PENDING: 1,
  INFO_RECEIVED: 2,
  IN_TRANSIT: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
  FAILED_ATTEMPT: 4, // Same level as out for delivery
  EXCEPTION: 4, // Same level as out for delivery
  EXPIRED: 6,
};

interface TrackingStatusProps {
  value: TrackingStatusValue;
}

/**
 * TrackingStatus Value Object
 *
 * Represents the current status of a shipment in its tracking lifecycle.
 * Follows the AfterShip status model:
 * PENDING -> INFO_RECEIVED -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED
 *                                        -> FAILED_ATTEMPT
 *                                        -> EXCEPTION
 *                                        -> EXPIRED
 *
 * @example
 * ```typescript
 * const status = TrackingStatus.inTransit();
 * console.log(status.isInTransit); // true
 * console.log(status.label); // "En transit"
 * ```
 */
export class TrackingStatus extends ValueObject<TrackingStatusProps> {
  private static readonly VALID_STATUSES: TrackingStatusValue[] = [
    'PENDING',
    'INFO_RECEIVED',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'FAILED_ATTEMPT',
    'EXCEPTION',
    'EXPIRED',
  ];

  private constructor(props: TrackingStatusProps) {
    super(props);
  }

  /**
   * The status value
   */
  get value(): TrackingStatusValue {
    return this.props.value;
  }

  /**
   * The human-readable label in French
   */
  get label(): string {
    return TrackingStatusLabels[this.value];
  }

  /**
   * The order for timeline display
   */
  get order(): number {
    return TrackingStatusOrder[this.value];
  }

  /**
   * Whether the shipment is pending pickup
   */
  get isPending(): boolean {
    return this.value === 'PENDING';
  }

  /**
   * Whether the carrier has received shipment info
   */
  get isInfoReceived(): boolean {
    return this.value === 'INFO_RECEIVED';
  }

  /**
   * Whether the shipment is in transit
   */
  get isInTransit(): boolean {
    return this.value === 'IN_TRANSIT';
  }

  /**
   * Whether the shipment is out for delivery
   */
  get isOutForDelivery(): boolean {
    return this.value === 'OUT_FOR_DELIVERY';
  }

  /**
   * Whether the shipment has been delivered
   */
  get isDelivered(): boolean {
    return this.value === 'DELIVERED';
  }

  /**
   * Whether a delivery attempt failed
   */
  get isFailedAttempt(): boolean {
    return this.value === 'FAILED_ATTEMPT';
  }

  /**
   * Whether there is a delivery exception
   */
  get isException(): boolean {
    return this.value === 'EXCEPTION';
  }

  /**
   * Whether the tracking has expired
   */
  get isExpired(): boolean {
    return this.value === 'EXPIRED';
  }

  /**
   * Whether this is a final state (delivered or expired)
   */
  get isFinal(): boolean {
    return this.isDelivered || this.isExpired;
  }

  /**
   * Whether there is a problem with delivery
   */
  get hasIssue(): boolean {
    return this.isFailedAttempt || this.isException;
  }

  /**
   * Whether the shipment is still in progress
   */
  get isActive(): boolean {
    return !this.isFinal;
  }

  /**
   * Factory method for PENDING status
   */
  static pending(): TrackingStatus {
    return new TrackingStatus({ value: 'PENDING' });
  }

  /**
   * Factory method for INFO_RECEIVED status
   */
  static infoReceived(): TrackingStatus {
    return new TrackingStatus({ value: 'INFO_RECEIVED' });
  }

  /**
   * Factory method for IN_TRANSIT status
   */
  static inTransit(): TrackingStatus {
    return new TrackingStatus({ value: 'IN_TRANSIT' });
  }

  /**
   * Factory method for OUT_FOR_DELIVERY status
   */
  static outForDelivery(): TrackingStatus {
    return new TrackingStatus({ value: 'OUT_FOR_DELIVERY' });
  }

  /**
   * Factory method for DELIVERED status
   */
  static delivered(): TrackingStatus {
    return new TrackingStatus({ value: 'DELIVERED' });
  }

  /**
   * Factory method for FAILED_ATTEMPT status
   */
  static failedAttempt(): TrackingStatus {
    return new TrackingStatus({ value: 'FAILED_ATTEMPT' });
  }

  /**
   * Factory method for EXCEPTION status
   */
  static exception(): TrackingStatus {
    return new TrackingStatus({ value: 'EXCEPTION' });
  }

  /**
   * Factory method for EXPIRED status
   */
  static expired(): TrackingStatus {
    return new TrackingStatus({ value: 'EXPIRED' });
  }

  /**
   * Creates a TrackingStatus from a string value
   */
  static fromString(value: string): Result<TrackingStatus> {
    const upperValue = value.toUpperCase() as TrackingStatusValue;

    if (!TrackingStatus.VALID_STATUSES.includes(upperValue)) {
      return Result.fail(`Statut de suivi invalide: ${value}`);
    }

    return Result.ok(new TrackingStatus({ value: upperValue }));
  }

  /**
   * Creates a TrackingStatus from an AfterShip tag
   * Maps AfterShip's tag values to our internal status values
   */
  static fromAfterShipTag(tag: string): Result<TrackingStatus> {
    const tagMapping: Record<string, TrackingStatusValue> = {
      Pending: 'PENDING',
      InfoReceived: 'INFO_RECEIVED',
      InTransit: 'IN_TRANSIT',
      OutForDelivery: 'OUT_FOR_DELIVERY',
      Delivered: 'DELIVERED',
      AttemptFail: 'FAILED_ATTEMPT',
      AvailableForPickup: 'OUT_FOR_DELIVERY',
      Exception: 'EXCEPTION',
      Expired: 'EXPIRED',
    };

    const mappedStatus = tagMapping[tag];
    if (!mappedStatus) {
      return Result.fail(`Tag AfterShip non reconnu: ${tag}`);
    }

    return Result.ok(new TrackingStatus({ value: mappedStatus }));
  }

  /**
   * Returns the string representation
   */
  override toString(): string {
    return this.value;
  }
}
