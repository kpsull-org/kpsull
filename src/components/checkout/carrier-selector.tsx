'use client';

import { Check, MapPin, Truck } from 'lucide-react';
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
    carrier: 'chronopost',
    carrierName: 'Chronopost Express',
    price: 890,
    estimatedDays: 'J+1 ouvré avant 13h (domicile)',
  },
];

const CARRIER_ICONS = {
  'mondial-relay': MapPin,
  chronopost: Truck,
} as const;

interface CarrierSelectorProps {
  readonly selectedCarrier: CarrierSelection | null;
  readonly onChange: (carrier: CarrierSelection) => void;
}

/**
 * CarrierSelector
 *
 * Composant de sélection du transporteur pour le checkout.
 * Propose 2 transporteurs : Mondial Relay (point relais) et Chronopost Express (domicile).
 */
export function CarrierSelector({ selectedCarrier, onChange }: CarrierSelectorProps) {
  return (
    <div className="space-y-2 font-sans" role="radiogroup" aria-label="Choisir un transporteur">
      {AVAILABLE_CARRIERS.map((carrier) => {
        const Icon = CARRIER_ICONS[carrier.carrier];
        const isSelected = selectedCarrier?.carrier === carrier.carrier;
        const inputId = `carrier-${carrier.carrier}`;

        return (
          <label
            key={carrier.carrier}
            htmlFor={inputId}
            className={cn(
              'w-full flex items-center gap-4 p-4 cursor-pointer transition-colors border',
              isSelected
                ? 'border-black bg-black text-white'
                : 'border-black/20 hover:border-black bg-white text-black'
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
                'w-8 h-8 flex items-center justify-center border flex-shrink-0',
                isSelected ? 'border-white' : 'border-black/30'
              )}
            >
              {isSelected ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold tracking-wide">{carrier.carrierName}</p>
              <p className={cn('text-xs mt-0.5', isSelected ? 'text-white/70' : 'text-black/50')}>
                {carrier.estimatedDays}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold">{formatPrice(carrier.price)}</p>
              <p className={cn('text-xs', isSelected ? 'text-white/60' : 'text-black/40')}>
                frais de port
              </p>
            </div>
          </label>
        );
      })}
    </div>
  );
}
