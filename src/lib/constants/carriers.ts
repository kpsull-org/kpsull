/**
 * Shipping carriers configuration
 *
 * Story 8-4: Selection transporteur
 * AC1: Liste des transporteurs disponibles (Colissimo, Chronopost, Mondial Relay, La Poste)
 */

export type CarrierId = 'colissimo' | 'chronopost' | 'mondial_relay' | 'la_poste';

export interface Carrier {
  id: CarrierId;
  name: string;
  description: string;
  estimatedDeliveryDays: {
    min: number;
    max: number;
  };
  logo: string;
  trackingUrl: string;
}

/**
 * Available shipping carriers for France metropolitan
 */
export const CARRIERS: readonly Carrier[] = [
  {
    id: 'colissimo',
    name: 'Colissimo',
    description: 'Livraison a domicile avec signature',
    estimatedDeliveryDays: {
      min: 2,
      max: 3,
    },
    logo: '/images/carriers/colissimo.svg',
    trackingUrl: 'https://www.laposte.fr/outils/suivre-vos-envois?code=',
  },
  {
    id: 'chronopost',
    name: 'Chronopost',
    description: 'Livraison express garantie',
    estimatedDeliveryDays: {
      min: 1,
      max: 2,
    },
    logo: '/images/carriers/chronopost.svg',
    trackingUrl: 'https://www.chronopost.fr/tracking-no-cms/suivi-page?liession=',
  },
  {
    id: 'mondial_relay',
    name: 'Mondial Relay',
    description: 'Retrait en point relais',
    estimatedDeliveryDays: {
      min: 3,
      max: 5,
    },
    logo: '/images/carriers/mondial-relay.svg',
    trackingUrl: 'https://www.mondialrelay.fr/suivi-de-colis/?NumeroExpedition=',
  },
  {
    id: 'la_poste',
    name: 'La Poste',
    description: 'Lettre suivie standard',
    estimatedDeliveryDays: {
      min: 2,
      max: 4,
    },
    logo: '/images/carriers/la-poste.svg',
    trackingUrl: 'https://www.laposte.fr/outils/suivre-vos-envois?code=',
  },
] as const;

/**
 * Get a carrier by its ID
 */
export function getCarrierById(id: CarrierId): Carrier | undefined {
  return CARRIERS.find((carrier) => carrier.id === id);
}

/**
 * Format estimated delivery days for display
 */
export function formatDeliveryEstimate(carrier: Carrier): string {
  const { min, max } = carrier.estimatedDeliveryDays;
  if (min === max) {
    return `${min} jour${min > 1 ? 's' : ''} ouvre${min > 1 ? 's' : ''}`;
  }
  return `${min}-${max} jours ouvres`;
}

/**
 * Get tracking URL for a shipment
 */
export function getTrackingUrl(carrierId: CarrierId, trackingNumber: string): string | null {
  const carrier = getCarrierById(carrierId);
  if (!carrier) return null;
  return `${carrier.trackingUrl}${encodeURIComponent(trackingNumber)}`;
}
