'use client';

import { useState } from 'react';
import { Truck, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  CARRIERS,
  formatDeliveryEstimate,
  type Carrier,
  type CarrierId,
} from '@/lib/constants/carriers';

interface CarrierSelectorProps {
  value?: CarrierId;
  onChange: (carrierId: CarrierId) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * CarrierSelector component
 *
 * Radio button selection for shipping carriers with delivery estimates.
 *
 * Story 8-4: Selection transporteur
 * - AC2: Selection du transporteur dans le formulaire d'expedition
 * - AC3: Affichage des delais estimes par transporteur
 */
export function CarrierSelector({
  value,
  onChange,
  disabled = false,
  className,
}: CarrierSelectorProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Choix du transporteur
        </CardTitle>
        <CardDescription>
          Selectionnez le transporteur pour cette expedition
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3" role="radiogroup" aria-label="Transporteur">
          {CARRIERS.map((carrier) => (
            <CarrierOption
              key={carrier.id}
              carrier={carrier}
              isSelected={value === carrier.id}
              onSelect={() => onChange(carrier.id)}
              disabled={disabled}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface CarrierOptionProps {
  carrier: Carrier;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

function CarrierOption({
  carrier,
  isSelected,
  onSelect,
  disabled = false,
}: CarrierOptionProps) {
  const deliveryEstimate = formatDeliveryEstimate(carrier);
  const isExpress = carrier.estimatedDeliveryDays.max <= 2;

  return (
    <Label
      htmlFor={`carrier-${carrier.id}`}
      className={cn(
        'flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors',
        isSelected
          ? 'border-primary bg-primary/5 ring-2 ring-primary'
          : 'border-border hover:border-primary/50 hover:bg-muted/50',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <input
        type="radio"
        id={`carrier-${carrier.id}`}
        name="carrier"
        value={carrier.id}
        checked={isSelected}
        onChange={onSelect}
        disabled={disabled}
        className="sr-only"
        aria-describedby={`carrier-desc-${carrier.id}`}
      />

      <div
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
          isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
        )}
      >
        {isSelected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{carrier.name}</span>
          {isExpress && (
            <Badge variant="secondary" className="text-xs">
              Express
            </Badge>
          )}
        </div>

        <p
          id={`carrier-desc-${carrier.id}`}
          className="text-sm text-muted-foreground"
        >
          {carrier.description}
        </p>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Delai estime : {deliveryEstimate}</span>
        </div>
      </div>
    </Label>
  );
}

/**
 * Controlled carrier selector hook for form integration
 */
export function useCarrierSelector(initialValue?: CarrierId) {
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierId | undefined>(
    initialValue
  );

  const reset = () => setSelectedCarrier(undefined);

  return {
    value: selectedCarrier,
    onChange: setSelectedCarrier,
    reset,
    isValid: selectedCarrier !== undefined,
  };
}
