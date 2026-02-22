'use client';

import { Check, MapPin, Truck, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils/format';
import type { CarrierSelection } from '@/lib/schemas/checkout.schema';

/** Available shipping carriers with pricing */
export const AVAILABLE_CARRIERS: CarrierSelection[] = [
  {
    carrier: 'mondial-relay',
    carrierName: 'Mondial Relay',
    price: 390,
    estimatedDays: '3-5 jours ouvrés (point relais)',
  },
  {
    carrier: 'relais-colis',
    carrierName: 'Relais Colis',
    price: 450,
    estimatedDays: '3-4 jours ouvrés (point relais)',
  },
  {
    carrier: 'chronopost-pickup',
    carrierName: 'Chronopost Pickup',
    price: 550,
    estimatedDays: 'J+2 ouvré (point relais Pickup)',
  },
  {
    carrier: 'chronopost-shop2shop',
    carrierName: 'Chronopost Shop2Shop',
    price: 650,
    estimatedDays: 'J+2-3 ouvrés (boutique partenaire)',
  },
  {
    carrier: 'chronopost',
    carrierName: 'Chronopost Express',
    price: 890,
    estimatedDays: 'J+1 ouvré avant 13h (domicile)',
  },
];

const CARRIER_ICONS = {
  'mondial-relay': MapPin,
  'relais-colis': Package,
  'chronopost-pickup': MapPin,
  'chronopost-shop2shop': Package,
  'chronopost': Truck,
} as const;

interface CarrierSelectorProps {
  readonly selectedCarrier: CarrierSelection | null;
  readonly onChange: (carrier: CarrierSelection) => void;
}

/**
 * CarrierSelector
 *
 * Composant de sélection du transporteur pour le checkout.
 * Propose 3 transporteurs : Mondial Relay, Relais Colis, Chronopost.
 */
export function CarrierSelector({ selectedCarrier, onChange }: CarrierSelectorProps) {
  return (
    <div className="space-y-3" role="radiogroup" aria-label="Choisir un transporteur">
      {AVAILABLE_CARRIERS.map((carrier) => {
        const Icon = CARRIER_ICONS[carrier.carrier];
        const isSelected = selectedCarrier?.carrier === carrier.carrier;

        const inputId = `carrier-${carrier.carrier}`;
        return (
          <label
            key={carrier.carrier}
            htmlFor={inputId}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all cursor-pointer',
              isSelected
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border hover:border-primary/40 hover:bg-muted/30'
            )}
          >
            <input
              type="radio"
              id={inputId}
              name="carrier"
              value={carrier.carrier}
              checked={isSelected}
              onChange={() => onChange(carrier)}
              className="sr-only"
            />
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border-2 flex-shrink-0 transition-colors',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground/30 text-muted-foreground'
              )}
            >
              {isSelected ? (
                <Check className="h-5 w-5" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold font-sans">{carrier.carrierName}</p>
              <p className="text-sm text-muted-foreground font-sans">{carrier.estimatedDays}</p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="font-bold font-sans">{formatPrice(carrier.price)}</p>
              <p className="text-xs text-muted-foreground font-sans">frais de port</p>
            </div>
          </label>
        );
      })}
    </div>
  );
}
