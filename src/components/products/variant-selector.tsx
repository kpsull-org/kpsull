'use client';

import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/utils/format';

interface Variant {
  id: string;
  name: string;
  priceOverride?: number;
  stock: number;
  isAvailable: boolean;
}

interface VariantSelectorProps {
  variants: Variant[];
  selectedVariantId: string | null;
  onSelectVariant: (variantId: string) => void;
  basePrice: number;
}

export function VariantSelector({
  variants,
  selectedVariantId,
  onSelectVariant,
  basePrice,
}: VariantSelectorProps) {
  if (variants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <Label>Variante</Label>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedVariantId;
          const displayPrice = variant.priceOverride ?? basePrice;

          return (
            <button
              key={variant.id}
              onClick={() => onSelectVariant(variant.id)}
              disabled={!variant.isAvailable}
              className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : variant.isAvailable
                    ? 'border-input hover:border-primary hover:bg-muted'
                    : 'border-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              <span className="font-medium">{variant.name}</span>
              {variant.priceOverride && (
                <span className="ml-2 text-xs">
                  {formatPrice(displayPrice * 100)}
                </span>
              )}
              {!variant.isAvailable && (
                <span className="ml-2 text-xs">(Épuisé)</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
