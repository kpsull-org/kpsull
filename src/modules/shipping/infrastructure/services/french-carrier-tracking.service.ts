import { Result } from '@/shared/domain';
import {
  AfterShipServiceInterface,
  TrackingInfoDTO,
  GetTrackingOptions,
} from '../../application/ports/aftership.service.interface';
import { ColissimoTrackingService } from './colissimo.service';
import { Track17Service } from './track17.service';
import { MockAfterShipService } from './aftership.service';

/**
 * Supported French carriers
 */
export type FrenchCarrier =
  | 'colissimo'
  | 'laposte'
  | 'chronopost'
  | 'mondial_relay'
  | 'dpd'
  | 'gls'
  | 'ups'
  | 'fedex'
  | 'dhl';

/**
 * Carrier configuration
 */
interface CarrierConfig {
  name: string;
  aliases: string[];
  patterns: RegExp[];
  service?: AfterShipServiceInterface;
  /** Use 17TRACK as fallback if carrier API not configured */
  use17TrackFallback?: boolean;
}

/**
 * French Carrier Tracking Service
 *
 * Aggregates multiple French carrier APIs into a single interface.
 * Priority order for each carrier:
 * 1. Carrier-specific API (if configured with API key)
 * 2. 17TRACK aggregator (if configured - 100 free/month)
 * 3. Mock service (for development)
 *
 * Supported carriers with direct API:
 * - Colissimo (La Poste) - Free API via developer.laposte.fr
 *
 * Supported via 17TRACK fallback:
 * - Chronopost, Mondial Relay, DPD, GLS, UPS, FedEx, DHL
 *
 * @example
 * ```typescript
 * const service = new FrenchCarrierTrackingService();
 * const result = await service.getTracking('1234567890', 'colissimo');
 * ```
 */
export class FrenchCarrierTrackingService implements AfterShipServiceInterface {
  private readonly carriers: Map<string, CarrierConfig> = new Map();
  private readonly colissimoService: ColissimoTrackingService;
  private readonly track17Service: Track17Service;
  private readonly mockService: MockAfterShipService;

  constructor() {
    this.colissimoService = new ColissimoTrackingService();
    this.track17Service = new Track17Service();
    this.mockService = new MockAfterShipService();

    this.initializeCarriers();
  }

  private initializeCarriers(): void {
    // Colissimo / La Poste - Direct API available (free)
    this.carriers.set('colissimo', {
      name: 'Colissimo',
      aliases: ['laposte', 'la-poste', 'la_poste'],
      patterns: [
        /^[A-Z]{2}\d{9}FR$/i,
        /^\d{11,15}$/,
        /^[A-Z0-9]{13}$/i,
      ],
      service: this.colissimoService,
      use17TrackFallback: true,
    });

    // Chronopost - Use 17TRACK or pro account
    this.carriers.set('chronopost', {
      name: 'Chronopost',
      aliases: ['chrono'],
      patterns: [
        /^[A-Z]{2}\d{9}FR$/i,
        /^\d{13,15}$/,
      ],
      use17TrackFallback: true,
    });

    // Mondial Relay - Use 17TRACK or pro account
    this.carriers.set('mondial_relay', {
      name: 'Mondial Relay',
      aliases: ['mondialrelay', 'mondial-relay', 'mr'],
      patterns: [
        /^\d{8,12}$/,
      ],
      use17TrackFallback: true,
    });

    // DPD - Use 17TRACK or pro account
    this.carriers.set('dpd', {
      name: 'DPD France',
      aliases: ['dpd-france', 'dpdfrance'],
      patterns: [
        /^\d{14}$/,
        /^[A-Z0-9]{14}$/i,
      ],
      use17TrackFallback: true,
    });

    // GLS - Use 17TRACK or pro account
    this.carriers.set('gls', {
      name: 'GLS France',
      aliases: ['gls-france', 'glsfrance'],
      patterns: [
        /^\d{11,12}$/,
      ],
      use17TrackFallback: true,
    });

    // UPS - Use 17TRACK
    this.carriers.set('ups', {
      name: 'UPS',
      aliases: [],
      patterns: [
        /^1Z[A-Z0-9]{16}$/i,
      ],
      use17TrackFallback: true,
    });

    // FedEx - Use 17TRACK
    this.carriers.set('fedex', {
      name: 'FedEx',
      aliases: [],
      patterns: [
        /^\d{12,22}$/,
      ],
      use17TrackFallback: true,
    });

    // DHL - Use 17TRACK
    this.carriers.set('dhl', {
      name: 'DHL',
      aliases: ['dhl-express', 'dhlexpress'],
      patterns: [
        /^\d{10,11}$/,
        /^JD\d{18}$/i,
      ],
      use17TrackFallback: true,
    });
  }

  /**
   * Get the appropriate service for a carrier
   * Priority: Carrier API > 17TRACK > Mock
   */
  private getServiceForCarrier(carrier: string): AfterShipServiceInterface {
    const normalizedCarrier = carrier.toLowerCase().replace(/[-\s]/g, '_');

    // Check direct carrier match
    const config = this.carriers.get(normalizedCarrier) || this.findByAlias(normalizedCarrier);

    // 1. Try carrier-specific service
    if (config?.service) {
      const service = config.service as ColissimoTrackingService;
      if (service.isConfigured?.()) {
        return service;
      }
    }

    // 2. Try 17TRACK fallback
    if (config?.use17TrackFallback && this.track17Service.isConfigured()) {
      return this.track17Service;
    }

    // 3. Fallback to mock
    return this.mockService;
  }

  /**
   * Find carrier config by alias
   */
  private findByAlias(alias: string): CarrierConfig | undefined {
    for (const [, cfg] of this.carriers) {
      if (cfg.aliases.includes(alias)) {
        return cfg;
      }
    }
    return undefined;
  }

  /**
   * Get carrier display name
   */
  private getCarrierName(carrier: string): string {
    const normalizedCarrier = carrier.toLowerCase().replace(/[-\s]/g, '_');

    const config = this.carriers.get(normalizedCarrier);
    if (config) {
      return config.name;
    }

    // Check aliases
    for (const [, cfg] of this.carriers) {
      if (cfg.aliases.includes(normalizedCarrier)) {
        return cfg.name;
      }
    }

    return carrier.toUpperCase();
  }

  async getTracking(
    trackingNumber: string,
    carrier: string,
    options?: GetTrackingOptions
  ): Promise<Result<TrackingInfoDTO>> {
    if (!trackingNumber?.trim()) {
      return Result.fail('Le numéro de suivi est requis');
    }

    if (!carrier?.trim()) {
      // Try to detect carrier
      const detectedResult = await this.detectCarrier(trackingNumber);
      if (detectedResult.isSuccess && detectedResult.value.length > 0) {
        carrier = detectedResult.value[0]!;
      } else {
        return Result.fail('Le transporteur est requis');
      }
    }

    const service = this.getServiceForCarrier(carrier);
    const result = await service.getTracking(trackingNumber, carrier, options);

    // Ensure carrier name is correct
    if (result.isSuccess) {
      result.value.carrierName = this.getCarrierName(carrier);
    }

    return result;
  }

  async createTracking(
    trackingNumber: string,
    carrier: string,
    metadata?: Record<string, string>
  ): Promise<Result<void>> {
    const service = this.getServiceForCarrier(carrier);
    return service.createTracking(trackingNumber, carrier, metadata);
  }

  async deleteTracking(trackingNumber: string, carrier: string): Promise<Result<void>> {
    const service = this.getServiceForCarrier(carrier);
    return service.deleteTracking(trackingNumber, carrier);
  }

  async detectCarrier(trackingNumber: string): Promise<Result<string[]>> {
    if (!trackingNumber?.trim()) {
      return Result.fail('Le numéro de suivi est requis');
    }

    const cleaned = trackingNumber.trim().toUpperCase();
    const detected: string[] = [];

    for (const [carrierCode, config] of this.carriers) {
      for (const pattern of config.patterns) {
        if (pattern.test(cleaned)) {
          detected.push(carrierCode);
          break;
        }
      }
    }

    // If no specific match, return common French carriers
    if (detected.length === 0) {
      return Result.ok(['colissimo', 'chronopost', 'mondial_relay']);
    }

    return Result.ok(detected);
  }

  /**
   * Get list of supported carriers and their status
   */
  getSupportedCarriers(): Array<{
    code: string;
    name: string;
    hasDirectApi: boolean;
    uses17Track: boolean;
    isMock: boolean;
  }> {
    const carriers: Array<{
      code: string;
      name: string;
      hasDirectApi: boolean;
      uses17Track: boolean;
      isMock: boolean;
    }> = [];

    for (const [code, config] of this.carriers) {
      let hasDirectApi = false;
      let uses17Track = false;
      let isMock = true;

      // Check if carrier-specific API is configured
      if (config.service) {
        const service = config.service as ColissimoTrackingService;
        hasDirectApi = service.isConfigured?.() ?? false;
        if (hasDirectApi) {
          isMock = false;
        }
      }

      // Check if 17TRACK fallback is available
      if (!hasDirectApi && config.use17TrackFallback && this.track17Service.isConfigured()) {
        uses17Track = true;
        isMock = false;
      }

      carriers.push({
        code,
        name: config.name,
        hasDirectApi,
        uses17Track,
        isMock,
      });
    }

    return carriers;
  }

  /**
   * Check service configuration status
   */
  getStatus(): {
    colissimoConfigured: boolean;
    track17Configured: boolean;
    activeCarriers: number;
    mockCarriers: number;
  } {
    const carriers = this.getSupportedCarriers();
    const activeCarriers = carriers.filter(c => !c.isMock).length;
    const mockCarriers = carriers.filter(c => c.isMock).length;

    return {
      colissimoConfigured: this.colissimoService.isConfigured(),
      track17Configured: this.track17Service.isConfigured(),
      activeCarriers,
      mockCarriers,
    };
  }
}

/**
 * Factory function to create the tracking service
 */
export function createTrackingService(): AfterShipServiceInterface {
  return new FrenchCarrierTrackingService();
}
