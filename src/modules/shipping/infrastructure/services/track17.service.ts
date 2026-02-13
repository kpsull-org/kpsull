import { Result } from '@/shared/domain';
import * as Sentry from '@sentry/nextjs';
import {
  AfterShipServiceInterface,
  TrackingInfoDTO,
  GetTrackingOptions,
} from '../../application/ports/aftership.service.interface';
import { TrackingEvent } from '../../domain/entities/tracking-event.entity';
import { TrackingStatus, TrackingStatusValue } from '../../domain/value-objects/tracking-status.vo';

/**
 * 17TRACK API Response Types
 * @see https://api.17track.net/en/doc
 */
interface Track17Event {
  a: string; // Location
  c: string; // Country code
  d: string; // Description/message
  z: string; // Datetime (ISO format)
}

interface Track17Tracking {
  no: string; // Tracking number
  carrier: number; // Carrier code
  track: {
    e: number; // Error code (0 = success)
    z0?: Track17Event; // Latest event
    z1?: Track17Event[]; // Event history
    z2?: {
      a?: string; // Origin address
      b?: string; // Destination address
      d?: string; // Estimated delivery
    };
    w1?: number; // Current status code
  };
}

interface Track17ApiResponse {
  code: number;
  data: {
    accepted: Track17Tracking[];
    rejected?: Array<{ number: string; error: { code: number; message: string } }>;
  };
}

/**
 * 17TRACK carrier codes for common French carriers
 */
const CARRIER_CODES: Record<string, number> = {
  colissimo: 100003,
  laposte: 100003,
  chronopost: 100003,
  mondial_relay: 190012,
  dpd: 100007,
  gls: 100008,
  ups: 100001,
  fedex: 100002,
  dhl: 100004,
  tnt: 100006,
};

/**
 * 17TRACK carrier names
 */
const CARRIER_NAMES: Record<string, string> = {
  colissimo: 'Colissimo',
  laposte: 'La Poste',
  chronopost: 'Chronopost',
  mondial_relay: 'Mondial Relay',
  dpd: 'DPD',
  gls: 'GLS',
  ups: 'UPS',
  fedex: 'FedEx',
  dhl: 'DHL',
  tnt: 'TNT',
};

/**
 * 17TRACK status codes to our TrackingStatus
 * @see https://api.17track.net/en/doc#status
 */
const STATUS_MAP: Record<number, TrackingStatusValue> = {
  0: 'PENDING',        // Not Found
  10: 'IN_TRANSIT',    // In Transit
  20: 'EXPIRED',       // Expired
  30: 'EXCEPTION',     // Delivery Failed
  35: 'EXCEPTION',     // Abnormal
  40: 'DELIVERED',     // Delivered
  50: 'OUT_FOR_DELIVERY', // Out for Delivery
};

/**
 * 17TRACK Tracking Service
 *
 * Free aggregator API supporting 2600+ carriers worldwide.
 * Free tier: 100 trackings/month
 *
 * Used as fallback when carrier-specific APIs are not available.
 *
 * @see https://api.17track.net/en/doc
 */
export class Track17Service implements AfterShipServiceInterface {
  private readonly baseUrl = 'https://api.17track.net/track/v2.2';
  private readonly apiKey: string;
  private readonly timeout = 15000;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TRACK17_API_KEY || '';
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async getTracking(
    trackingNumber: string,
    carrier: string,
    _options?: GetTrackingOptions
  ): Promise<Result<TrackingInfoDTO>> {
    if (!this.isConfigured()) {
      return Result.fail('17TRACK API key not configured');
    }

    if (!trackingNumber?.trim()) {
      return Result.fail('Le numéro de suivi est requis');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      // Get carrier code
      const carrierCode = CARRIER_CODES[carrier.toLowerCase()] || 0;

      const response = await fetch(`${this.baseUrl}/gettrackinfo`, {
        method: 'POST',
        headers: {
          '17token': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            number: trackingNumber,
            carrier: carrierCode > 0 ? carrierCode : undefined,
          },
        ]),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          return Result.fail('Clé API 17TRACK invalide');
        }
        if (response.status === 429) {
          return Result.fail('Quota 17TRACK dépassé (100/mois max en gratuit)');
        }
        return Result.fail(`Erreur 17TRACK: ${response.status}`);
      }

      const data = (await response.json()) as Track17ApiResponse;

      if (data.code !== 0) {
        return Result.fail(`Erreur API 17TRACK: code ${data.code}`);
      }

      // Check for rejected trackings
      if (data.data.rejected && data.data.rejected.length > 0) {
        const rejection = data.data.rejected[0];
        return Result.fail(rejection?.error.message || 'Colis non trouvé');
      }

      // Get accepted tracking
      const tracking = data.data.accepted[0];
      if (!tracking || tracking.track.e !== 0) {
        return Result.fail('Colis non trouvé');
      }

      return this.mapToTrackingInfo(tracking, carrier);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return Result.fail('Service 17TRACK temporairement indisponible');
      }
      console.error('17TRACK error:', error);
      Sentry.captureException(error);
      return Result.fail('Erreur lors de la récupération du suivi');
    }
  }

  async createTracking(
    _trackingNumber: string,
    _carrier: string,
    _metadata?: Record<string, string>
  ): Promise<Result<void>> {
    // 17TRACK doesn't require pre-registration
    return Result.ok();
  }

  async deleteTracking(_trackingNumber: string, _carrier: string): Promise<Result<void>> {
    // 17TRACK doesn't support deletion
    return Result.ok();
  }

  async detectCarrier(trackingNumber: string): Promise<Result<string[]>> {
    if (!this.isConfigured()) {
      return Result.fail('17TRACK API key not configured');
    }

    if (!trackingNumber?.trim()) {
      return Result.fail('Le numéro de suivi est requis');
    }

    try {
      const response = await fetch(`${this.baseUrl}/register`, {
        method: 'POST',
        headers: {
          '17token': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ number: trackingNumber }]),
      });

      if (!response.ok) {
        return Result.ok(['colissimo', 'chronopost', 'mondial_relay']);
      }

      const data = await response.json();

      // Return detected carriers or default French carriers
      if (data.data?.accepted?.[0]?.carrier) {
        const carrierCode = data.data.accepted[0].carrier;
        const carrierName = Object.entries(CARRIER_CODES).find(([, code]) => code === carrierCode)?.[0];
        if (carrierName) {
          return Result.ok([carrierName]);
        }
      }

      return Result.ok(['colissimo', 'chronopost', 'mondial_relay']);
    } catch {
      return Result.ok(['colissimo', 'chronopost', 'mondial_relay']);
    }
  }

  private mapToTrackingInfo(
    tracking: Track17Tracking,
    carrier: string
  ): Result<TrackingInfoDTO> {
    const events: TrackingEvent[] = [];

    // Map event history
    if (tracking.track.z1) {
      for (const event of tracking.track.z1) {
        const eventResult = TrackingEvent.create({
          trackingNumber: tracking.no,
          status: this.mapStatusCode(tracking.track.w1 || 0),
          message: event.d,
          location: event.a || event.c || 'France',
          timestamp: new Date(event.z),
        });

        if (eventResult.isSuccess) {
          events.push(eventResult.value);
        }
      }
    }

    // Add latest event if not in history
    if (tracking.track.z0) {
      const latestEvent = tracking.track.z0;
      const existsInHistory = events.some(
        e => e.timestamp.getTime() === new Date(latestEvent.z).getTime()
      );

      if (!existsInHistory) {
        const eventResult = TrackingEvent.create({
          trackingNumber: tracking.no,
          status: this.mapStatusCode(tracking.track.w1 || 0),
          message: latestEvent.d,
          location: latestEvent.a || latestEvent.c || 'France',
          timestamp: new Date(latestEvent.z),
        });

        if (eventResult.isSuccess) {
          events.unshift(eventResult.value);
        }
      }
    }

    // Sort by date (most recent first)
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Get current status
    const currentStatusValue = this.mapStatusCode(tracking.track.w1 || 0);
    const currentStatusResult = TrackingStatus.fromString(currentStatusValue);
    if (currentStatusResult.isFailure) {
      return Result.fail(currentStatusResult.error!);
    }

    // Parse estimated delivery
    let estimatedDelivery: Date | null = null;
    if (tracking.track.z2?.d) {
      estimatedDelivery = new Date(tracking.track.z2.d);
    }

    const carrierKey = carrier.toLowerCase();
    const trackingInfo: TrackingInfoDTO = {
      trackingNumber: tracking.no,
      carrier: carrierKey,
      carrierName: CARRIER_NAMES[carrierKey] || carrier.toUpperCase(),
      currentStatus: currentStatusResult.value,
      estimatedDelivery,
      events,
      originAddress: tracking.track.z2?.a || null,
      destinationAddress: tracking.track.z2?.b || null,
      lastUpdated: new Date(),
    };

    return Result.ok(trackingInfo);
  }

  private mapStatusCode(code: number): TrackingStatusValue {
    return STATUS_MAP[code] || 'IN_TRANSIT';
  }
}
