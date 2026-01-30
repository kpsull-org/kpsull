import { Entity, UniqueId, Result } from '@/shared/domain';
import { TrackingStatus, TrackingStatusValue } from '../value-objects/tracking-status.vo';

interface TrackingEventProps {
  trackingNumber: string;
  status: TrackingStatus;
  message: string;
  location: string | null;
  timestamp: Date;
  rawData: Record<string, unknown> | null;
}

interface CreateTrackingEventProps {
  trackingNumber: string;
  status: TrackingStatusValue | TrackingStatus;
  message: string;
  location?: string | null;
  timestamp?: Date;
  rawData?: Record<string, unknown> | null;
}

interface ReconstituteTrackingEventProps {
  id: string;
  trackingNumber: string;
  status: string;
  message: string;
  location: string | null;
  timestamp: Date;
  rawData: Record<string, unknown> | null;
}

/**
 * TrackingEvent Entity
 *
 * Represents a single tracking event in the shipment's journey.
 * Each event captures a checkpoint in the delivery process.
 *
 * @example
 * ```typescript
 * const eventResult = TrackingEvent.create({
 *   trackingNumber: '1Z999AA10123456784',
 *   status: 'IN_TRANSIT',
 *   message: 'Package arrived at facility',
 *   location: 'Paris, France',
 * });
 *
 * if (eventResult.isSuccess) {
 *   const event = eventResult.value;
 *   console.log(event.status.label); // "En transit"
 * }
 * ```
 */
export class TrackingEvent extends Entity<TrackingEventProps> {
  private constructor(props: TrackingEventProps, id?: UniqueId) {
    super(props, id);
  }

  /**
   * The tracking number associated with this event
   */
  get trackingNumber(): string {
    return this.props.trackingNumber;
  }

  /**
   * The status at this checkpoint
   */
  get status(): TrackingStatus {
    return this.props.status;
  }

  /**
   * The human-readable message describing the event
   */
  get message(): string {
    return this.props.message;
  }

  /**
   * The location where this event occurred (if available)
   */
  get location(): string | null {
    return this.props.location;
  }

  /**
   * When this event occurred
   */
  get timestamp(): Date {
    return this.props.timestamp;
  }

  /**
   * Raw data from the carrier API (for debugging/auditing)
   */
  get rawData(): Record<string, unknown> | null {
    return this.props.rawData;
  }

  /**
   * Returns a formatted location string
   */
  get formattedLocation(): string {
    return this.location ?? 'Localisation inconnue';
  }

  /**
   * Returns a formatted timestamp string
   */
  get formattedTimestamp(): string {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(this.timestamp);
  }

  /**
   * Creates a new TrackingEvent
   */
  static create(props: CreateTrackingEventProps): Result<TrackingEvent> {
    if (!props.trackingNumber?.trim()) {
      return Result.fail('Le numero de suivi est requis');
    }

    if (!props.message?.trim()) {
      return Result.fail('Le message est requis');
    }

    // Handle status as either TrackingStatus or TrackingStatusValue
    let status: TrackingStatus;
    if (props.status instanceof TrackingStatus) {
      status = props.status;
    } else {
      const statusResult = TrackingStatus.fromString(props.status);
      if (statusResult.isFailure) {
        return Result.fail(statusResult.error!);
      }
      status = statusResult.value;
    }

    return Result.ok(
      new TrackingEvent({
        trackingNumber: props.trackingNumber.trim(),
        status,
        message: props.message.trim(),
        location: props.location?.trim() ?? null,
        timestamp: props.timestamp ?? new Date(),
        rawData: props.rawData ?? null,
      })
    );
  }

  /**
   * Reconstitutes a TrackingEvent from persistence data
   */
  static reconstitute(props: ReconstituteTrackingEventProps): Result<TrackingEvent> {
    const statusResult = TrackingStatus.fromString(props.status);
    if (statusResult.isFailure) {
      return Result.fail(statusResult.error!);
    }

    return Result.ok(
      new TrackingEvent(
        {
          trackingNumber: props.trackingNumber,
          status: statusResult.value,
          message: props.message,
          location: props.location,
          timestamp: props.timestamp,
          rawData: props.rawData,
        },
        UniqueId.fromString(props.id)
      )
    );
  }

  /**
   * Creates a TrackingEvent from AfterShip checkpoint data
   */
  static fromAfterShipCheckpoint(
    trackingNumber: string,
    checkpoint: {
      tag: string;
      message: string;
      location?: string;
      city?: string;
      country_name?: string;
      checkpoint_time: string;
      raw_status?: string;
    }
  ): Result<TrackingEvent> {
    const statusResult = TrackingStatus.fromAfterShipTag(checkpoint.tag);
    if (statusResult.isFailure) {
      return Result.fail(statusResult.error!);
    }

    // Build location from available fields
    let location: string | null = null;
    if (checkpoint.location) {
      location = checkpoint.location;
    } else if (checkpoint.city || checkpoint.country_name) {
      const parts = [checkpoint.city, checkpoint.country_name].filter(Boolean);
      location = parts.join(', ');
    }

    return Result.ok(
      new TrackingEvent({
        trackingNumber,
        status: statusResult.value,
        message: checkpoint.message || checkpoint.raw_status || statusResult.value.label,
        location,
        timestamp: new Date(checkpoint.checkpoint_time),
        rawData: checkpoint as unknown as Record<string, unknown>,
      })
    );
  }
}
