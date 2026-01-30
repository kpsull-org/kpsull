import { Result } from '@/shared/domain';
import { TrackingEvent } from '../../domain/entities/tracking-event.entity';
import { TrackingStatus } from '../../domain/value-objects/tracking-status.vo';

/**
 * DTO for tracking information response
 */
export interface TrackingInfoDTO {
  trackingNumber: string;
  carrier: string;
  carrierName: string;
  currentStatus: TrackingStatus;
  estimatedDelivery: Date | null;
  events: TrackingEvent[];
  originAddress: string | null;
  destinationAddress: string | null;
  lastUpdated: Date;
}

/**
 * Options for fetching tracking information
 */
export interface GetTrackingOptions {
  /** Force refresh from carrier API, bypassing cache */
  forceRefresh?: boolean;
}

/**
 * AfterShip Service Interface (Port)
 *
 * Defines the contract for tracking shipments through AfterShip API.
 * Implementations can be a real AfterShip client or a mock for testing.
 */
export interface AfterShipServiceInterface {
  /**
   * Get tracking information for a shipment
   *
   * @param trackingNumber - The tracking number to look up
   * @param carrier - The carrier slug (e.g., 'ups', 'fedex', 'colissimo')
   * @param options - Optional fetch options
   * @returns Result containing tracking info or error message
   */
  getTracking(
    trackingNumber: string,
    carrier: string,
    options?: GetTrackingOptions
  ): Promise<Result<TrackingInfoDTO>>;

  /**
   * Create a new tracking in AfterShip
   *
   * @param trackingNumber - The tracking number to register
   * @param carrier - The carrier slug
   * @param metadata - Optional metadata to attach
   * @returns Result indicating success or failure
   */
  createTracking(
    trackingNumber: string,
    carrier: string,
    metadata?: Record<string, string>
  ): Promise<Result<void>>;

  /**
   * Delete a tracking from AfterShip
   *
   * @param trackingNumber - The tracking number to remove
   * @param carrier - The carrier slug
   * @returns Result indicating success or failure
   */
  deleteTracking(trackingNumber: string, carrier: string): Promise<Result<void>>;

  /**
   * Detect carrier from tracking number
   *
   * @param trackingNumber - The tracking number to analyze
   * @returns Result containing detected carrier slugs or error
   */
  detectCarrier(trackingNumber: string): Promise<Result<string[]>>;
}
