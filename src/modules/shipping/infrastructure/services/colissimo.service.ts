import { Result } from '@/shared/domain';
import {
  AfterShipServiceInterface,
  TrackingInfoDTO,
  GetTrackingOptions,
} from '../../application/ports/aftership.service.interface';
import { TrackingEvent } from '../../domain/entities/tracking-event.entity';
import { TrackingStatus, TrackingStatusValue } from '../../domain/value-objects/tracking-status.vo';

/**
 * Colissimo API Response Types
 * Based on Colissimo Timeline Web Service v2.1
 */
interface ColissimoTimelineEvent {
  code: string;
  date: string;
  label: string;
  siteCode?: string;
  siteName?: string;
  countryCode?: string;
}

interface ColissimoParcel {
  parcelNumber: string;
  timeline?: ColissimoTimelineEvent[];
  status?: {
    code: string;
    label: string;
  };
  deliveryDate?: string;
  product?: {
    code: string;
    label: string;
  };
}

interface ColissimoApiResponse {
  parcel?: ColissimoParcel;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Mapping Colissimo status codes to our TrackingStatus
 */
const COLISSIMO_STATUS_MAP: Record<string, TrackingStatusValue> = {
  // Pris en charge
  'PC1': 'INFO_RECEIVED',
  'PC2': 'INFO_RECEIVED',
  'ET1': 'IN_TRANSIT',
  'ET2': 'IN_TRANSIT',
  'ET3': 'IN_TRANSIT',
  'ET4': 'IN_TRANSIT',
  // En cours de livraison
  'DR1': 'OUT_FOR_DELIVERY',
  'DR2': 'OUT_FOR_DELIVERY',
  // Livré
  'DI1': 'DELIVERED',
  'DI2': 'DELIVERED',
  // Anomalie
  'AN1': 'EXCEPTION',
  'AN2': 'EXCEPTION',
  'RE1': 'EXCEPTION',
  // Instance (en point relais)
  'AG1': 'OUT_FOR_DELIVERY',
  'AG2': 'OUT_FOR_DELIVERY',
  // Retour
  'RT1': 'EXCEPTION',
  'RT2': 'EXCEPTION',
};

/**
 * Colissimo Tracking Service
 *
 * Uses the official Colissimo Timeline Web Service API.
 * Requires a free API key from the Colissimo developer portal.
 *
 * @see https://www.colissimo.entreprise.laposte.fr/en/tools-and-solutions
 */
export class ColissimoTrackingService implements AfterShipServiceInterface {
  private readonly baseUrl = 'https://ws.colissimo.fr/tracking-timeline-ws/rest/tracking';
  private readonly apiKey: string;
  private readonly timeout = 10000;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.COLISSIMO_API_KEY || '';
  }

  /**
   * Check if service is configured with API key
   */
  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async getTracking(
    trackingNumber: string,
    _carrier: string,
    _options?: GetTrackingOptions
  ): Promise<Result<TrackingInfoDTO>> {
    if (!this.isConfigured()) {
      return Result.fail('Colissimo API key not configured');
    }

    if (!trackingNumber?.trim()) {
      return Result.fail('Le numéro de suivi est requis');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${this.baseUrl}/timelineCompany?parcelNumber=${encodeURIComponent(trackingNumber)}`,
        {
          headers: {
            'X-Okapi-Key': this.apiKey,
            'Accept': 'application/json',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          return Result.fail('Clé API Colissimo invalide');
        }
        if (response.status === 404) {
          return Result.fail('Colis non trouvé');
        }
        return Result.fail(`Erreur Colissimo: ${response.status}`);
      }

      const data = (await response.json()) as ColissimoApiResponse;

      if (data.error) {
        return Result.fail(data.error.message || 'Erreur inconnue');
      }

      if (!data.parcel) {
        return Result.fail('Colis non trouvé');
      }

      return this.mapToTrackingInfo(data.parcel, trackingNumber);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return Result.fail('Service Colissimo temporairement indisponible');
      }
      console.error('Colissimo tracking error:', error);
      return Result.fail('Erreur lors de la récupération du suivi');
    }
  }

  async createTracking(
    _trackingNumber: string,
    _carrier: string,
    _metadata?: Record<string, string>
  ): Promise<Result<void>> {
    // Colissimo doesn't require pre-registration for tracking
    return Result.ok();
  }

  async deleteTracking(_trackingNumber: string, _carrier: string): Promise<Result<void>> {
    // Colissimo doesn't support deleting trackings
    return Result.ok();
  }

  async detectCarrier(trackingNumber: string): Promise<Result<string[]>> {
    if (!trackingNumber?.trim()) {
      return Result.fail('Le numéro de suivi est requis');
    }

    // Colissimo tracking numbers patterns
    const patterns = [
      /^[A-Z]{2}\d{9}FR$/i,  // International format
      /^\d{11,15}$/,         // Domestic format
      /^[A-Z0-9]{13}$/i,     // Alternative format
    ];

    const isColissimo = patterns.some(p => p.test(trackingNumber.trim()));

    if (isColissimo) {
      return Result.ok(['colissimo', 'laposte']);
    }

    return Result.ok([]);
  }

  private mapToTrackingInfo(
    parcel: ColissimoParcel,
    trackingNumber: string
  ): Result<TrackingInfoDTO> {
    // Map events
    const events: TrackingEvent[] = [];

    if (parcel.timeline) {
      for (const event of parcel.timeline) {
        const status = this.mapStatusCode(event.code);
        const eventResult = TrackingEvent.create({
          trackingNumber,
          status,
          message: event.label,
          location: event.siteName
            ? `${event.siteName}${event.countryCode ? `, ${event.countryCode}` : ''}`
            : event.countryCode || 'France',
          timestamp: new Date(event.date),
        });

        if (eventResult.isSuccess) {
          events.push(eventResult.value);
        }
      }
    }

    // Sort events by date (most recent first)
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Determine current status
    const currentStatusValue = parcel.status?.code
      ? this.mapStatusCode(parcel.status.code)
      : events[0]?.status.value || 'PENDING';

    const currentStatusResult = TrackingStatus.fromString(currentStatusValue);
    if (currentStatusResult.isFailure) {
      return Result.fail(currentStatusResult.error!);
    }

    // Parse estimated delivery
    let estimatedDelivery: Date | null = null;
    if (parcel.deliveryDate) {
      estimatedDelivery = new Date(parcel.deliveryDate);
    }

    const trackingInfo: TrackingInfoDTO = {
      trackingNumber,
      carrier: 'colissimo',
      carrierName: 'Colissimo',
      currentStatus: currentStatusResult.value,
      estimatedDelivery,
      events,
      originAddress: 'France',
      destinationAddress: 'France',
      lastUpdated: new Date(),
    };

    return Result.ok(trackingInfo);
  }

  private mapStatusCode(code: string): TrackingStatusValue {
    // Extract base code (first 3 chars)
    const baseCode = code.substring(0, 3).toUpperCase();
    return COLISSIMO_STATUS_MAP[baseCode] || 'IN_TRANSIT';
  }
}
