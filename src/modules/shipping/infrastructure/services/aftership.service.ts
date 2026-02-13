import { Result } from '@/shared/domain';
import {
  AfterShipServiceInterface,
  TrackingInfoDTO,
  GetTrackingOptions,
} from '../../application/ports/aftership.service.interface';
import { TrackingEvent } from '../../domain/entities/tracking-event.entity';
import { TrackingStatus, TrackingStatusValue } from '../../domain/value-objects/tracking-status.vo';

/**
 * Carrier display names
 */
const CARRIER_NAMES: Record<string, string> = {
  ups: 'UPS',
  fedex: 'FedEx',
  dhl: 'DHL',
  colissimo: 'Colissimo',
  chronopost: 'Chronopost',
  mondial_relay: 'Mondial Relay',
  laposte: 'La Poste',
  dpd: 'DPD',
  gls: 'GLS',
  tnt: 'TNT',
};

/**
 * Mock scenario data for development
 */
interface MockScenario {
  status: TrackingStatusValue;
  events: Array<{
    status: TrackingStatusValue;
    message: string;
    location: string;
    daysAgo: number;
    hoursAgo?: number;
  }>;
  estimatedDeliveryDays?: number;
}

const MOCK_SCENARIOS: Record<string, MockScenario> = {
  DELIVERED: {
    status: 'DELIVERED',
    events: [
      { status: 'PENDING', message: 'Colis pris en charge', location: 'Lyon, France', daysAgo: 5 },
      {
        status: 'INFO_RECEIVED',
        message: 'Informations recues par le transporteur',
        location: 'Lyon, France',
        daysAgo: 5,
        hoursAgo: 2,
      },
      {
        status: 'IN_TRANSIT',
        message: 'Colis en transit',
        location: 'Paris Hub, France',
        daysAgo: 4,
      },
      {
        status: 'IN_TRANSIT',
        message: 'Arrive au centre de tri',
        location: 'Paris Hub, France',
        daysAgo: 3,
      },
      {
        status: 'OUT_FOR_DELIVERY',
        message: 'Colis en cours de livraison',
        location: 'Paris 75001, France',
        daysAgo: 2,
      },
      {
        status: 'DELIVERED',
        message: 'Colis livre - signe par: DUPONT',
        location: 'Paris 75001, France',
        daysAgo: 2,
        hoursAgo: 4,
      },
    ],
  },
  IN_TRANSIT: {
    status: 'IN_TRANSIT',
    events: [
      {
        status: 'PENDING',
        message: 'Colis pris en charge',
        location: 'Marseille, France',
        daysAgo: 3,
      },
      {
        status: 'INFO_RECEIVED',
        message: 'Informations recues par le transporteur',
        location: 'Marseille, France',
        daysAgo: 3,
        hoursAgo: 1,
      },
      {
        status: 'IN_TRANSIT',
        message: 'Colis en transit',
        location: 'Lyon Hub, France',
        daysAgo: 2,
      },
      {
        status: 'IN_TRANSIT',
        message: 'En cours de transfert',
        location: 'Paris Hub, France',
        daysAgo: 1,
      },
    ],
    estimatedDeliveryDays: 1,
  },
  OUT_FOR_DELIVERY: {
    status: 'OUT_FOR_DELIVERY',
    events: [
      {
        status: 'PENDING',
        message: 'Colis pris en charge',
        location: 'Bordeaux, France',
        daysAgo: 4,
      },
      {
        status: 'INFO_RECEIVED',
        message: 'Informations recues par le transporteur',
        location: 'Bordeaux, France',
        daysAgo: 4,
        hoursAgo: 1,
      },
      {
        status: 'IN_TRANSIT',
        message: 'Colis en transit',
        location: 'Toulouse Hub, France',
        daysAgo: 3,
      },
      {
        status: 'IN_TRANSIT',
        message: 'Arrive au centre de distribution',
        location: 'Toulouse, France',
        daysAgo: 1,
      },
      {
        status: 'OUT_FOR_DELIVERY',
        message: 'Colis en cours de livraison',
        location: 'Toulouse 31000, France',
        daysAgo: 0,
        hoursAgo: 3,
      },
    ],
  },
  EXCEPTION: {
    status: 'EXCEPTION',
    events: [
      { status: 'PENDING', message: 'Colis pris en charge', location: 'Nice, France', daysAgo: 5 },
      {
        status: 'INFO_RECEIVED',
        message: 'Informations recues par le transporteur',
        location: 'Nice, France',
        daysAgo: 5,
        hoursAgo: 1,
      },
      {
        status: 'IN_TRANSIT',
        message: 'Colis en transit',
        location: 'Marseille Hub, France',
        daysAgo: 4,
      },
      {
        status: 'FAILED_ATTEMPT',
        message: 'Tentative de livraison echouee - Absent',
        location: 'Paris 75002, France',
        daysAgo: 2,
      },
      {
        status: 'EXCEPTION',
        message: 'Colis en attente - Adresse incorrecte',
        location: 'Paris, France',
        daysAgo: 1,
      },
    ],
  },
  PENDING: {
    status: 'PENDING',
    events: [
      {
        status: 'PENDING',
        message: 'Etiquette creee - En attente de prise en charge',
        location: 'Lille, France',
        daysAgo: 1,
      },
    ],
    estimatedDeliveryDays: 4,
  },
};

/**
 * Mock AfterShip Service
 *
 * Provides mock tracking data for development and testing.
 * In production, this should be replaced with a real AfterShip API client.
 *
 * @example
 * ```typescript
 * const service = new MockAfterShipService();
 * const result = await service.getTracking('1Z999AA10123456784', 'ups');
 *
 * if (result.isSuccess) {
 *   console.log(result.value.currentStatus.label);
 *   console.log(result.value.events.length);
 * }
 * ```
 */
export class MockAfterShipService implements AfterShipServiceInterface {
  private registeredTrackings: Map<string, { carrier: string; metadata?: Record<string, string> }> =
    new Map();

  /**
   * Get tracking information
   * Uses the last digit of the tracking number to determine the mock scenario
   */
  async getTracking(
    trackingNumber: string,
    carrier: string,
    _options?: GetTrackingOptions
  ): Promise<Result<TrackingInfoDTO>> {
    // Simulate network delay
    await this.simulateDelay();

    if (!trackingNumber?.trim()) {
      return Result.fail('Le numero de suivi est requis');
    }

    if (!carrier?.trim()) {
      return Result.fail('Le transporteur est requis');
    }

    // Determine scenario based on tracking number pattern
    const scenario = this.getScenarioForTrackingNumber(trackingNumber);

    // Build tracking events
    const eventsResults = scenario.events.map((eventData) => {
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - eventData.daysAgo);
      if (eventData.hoursAgo) {
        timestamp.setHours(timestamp.getHours() - eventData.hoursAgo);
      }

      return TrackingEvent.create({
        trackingNumber,
        status: eventData.status,
        message: eventData.message,
        location: eventData.location,
        timestamp,
      });
    });

    // Check for any failed event creation
    const failedEvent = eventsResults.find((r) => r.isFailure);
    if (failedEvent) {
      return Result.fail(failedEvent.error!);
    }

    const events = eventsResults.map((r) => r.value);

    // Sort events by timestamp (most recent first for display)
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Calculate estimated delivery
    let estimatedDelivery: Date | null = null;
    if (scenario.estimatedDeliveryDays !== undefined) {
      estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + scenario.estimatedDeliveryDays);
    }

    // Get current status
    const currentStatusResult = TrackingStatus.fromString(scenario.status);
    if (currentStatusResult.isFailure) {
      return Result.fail(currentStatusResult.error!);
    }

    const trackingInfo: TrackingInfoDTO = {
      trackingNumber,
      carrier,
      carrierName: CARRIER_NAMES[carrier] ?? carrier.toUpperCase(),
      currentStatus: currentStatusResult.value,
      estimatedDelivery,
      events,
      originAddress: 'France',
      destinationAddress: 'France',
      lastUpdated: new Date(),
    };

    return Result.ok(trackingInfo);
  }

  /**
   * Create a new tracking
   */
  async createTracking(
    trackingNumber: string,
    carrier: string,
    metadata?: Record<string, string>
  ): Promise<Result<void>> {
    await this.simulateDelay();

    if (!trackingNumber?.trim()) {
      return Result.fail('Le numero de suivi est requis');
    }

    if (!carrier?.trim()) {
      return Result.fail('Le transporteur est requis');
    }

    const key = this.getTrackingKey(trackingNumber, carrier);
    if (this.registeredTrackings.has(key)) {
      return Result.fail('Ce numero de suivi est deja enregistre');
    }

    this.registeredTrackings.set(key, { carrier, metadata });
    return Result.ok();
  }

  /**
   * Delete a tracking
   */
  async deleteTracking(trackingNumber: string, carrier: string): Promise<Result<void>> {
    await this.simulateDelay();

    const key = this.getTrackingKey(trackingNumber, carrier);
    if (!this.registeredTrackings.has(key)) {
      return Result.fail('Numero de suivi non trouve');
    }

    this.registeredTrackings.delete(key);
    return Result.ok();
  }

  /**
   * Detect carrier from tracking number
   * Returns mock carriers based on tracking number format
   */
  async detectCarrier(trackingNumber: string): Promise<Result<string[]>> {
    await this.simulateDelay();

    if (!trackingNumber?.trim()) {
      return Result.fail('Le numero de suivi est requis');
    }

    const upper = trackingNumber.toUpperCase();

    // Simple pattern matching for common carriers
    if (upper.startsWith('1Z')) {
      return Result.ok(['ups']);
    }
    if (upper.match(/^\d{12,22}$/)) {
      return Result.ok(['fedex', 'dhl']);
    }
    if (upper.match(/^[A-Z]{2}\d{9}[A-Z]{2}$/)) {
      return Result.ok(['colissimo', 'laposte']);
    }
    if (upper.startsWith('JD')) {
      return Result.ok(['dhl']);
    }

    // Default to common French carriers
    return Result.ok(['colissimo', 'chronopost', 'mondial_relay']);
  }

  /**
   * Determines which scenario to use based on tracking number
   */
  private getScenarioForTrackingNumber(trackingNumber: string): MockScenario {
    // Use the last character to determine scenario
    const lastChar = trackingNumber.slice(-1).toUpperCase();

    // Map characters to scenarios
    if (['0', '1', '2', 'A', 'B'].includes(lastChar)) {
      return MOCK_SCENARIOS['DELIVERED']!;
    }
    if (['3', '4', '5', 'C', 'D'].includes(lastChar)) {
      return MOCK_SCENARIOS['IN_TRANSIT']!;
    }
    if (['6', '7', 'E', 'F'].includes(lastChar)) {
      return MOCK_SCENARIOS['OUT_FOR_DELIVERY']!;
    }
    if (['8', 'G', 'H'].includes(lastChar)) {
      return MOCK_SCENARIOS['EXCEPTION']!;
    }

    return MOCK_SCENARIOS['PENDING']!;
  }

  /**
   * Creates a unique key for tracking storage
   */
  private getTrackingKey(trackingNumber: string, carrier: string): string {
    return `${carrier}:${trackingNumber}`;
  }

  /**
   * Simulates network delay for realistic testing
   */
  private async simulateDelay(): Promise<void> {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const delay = (array[0]! % 200) + 100; // 100-300ms
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

/**
 * Factory function to create the appropriate AfterShip service
 * In production, this would check for API keys and return the real service
 */
export function createAfterShipService(): AfterShipServiceInterface {
  // TODO: In production, check for AFTERSHIP_API_KEY and return real service
  // const apiKey = process.env.AFTERSHIP_API_KEY;
  // if (apiKey) {
  //   return new RealAfterShipService(apiKey);
  // }

  return new MockAfterShipService();
}
