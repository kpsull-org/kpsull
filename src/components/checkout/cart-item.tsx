'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { QuantitySelector } from './quantity-selector';
import type { CartItem as CartItemType } from '@/lib/stores/cart.store';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  formatPrice: (cents: number) => string;
}

export function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  formatPrice,
}: CartItemProps) {
  const lineTotal = item.price * item.quantity;
  const productUrl = `/${item.creatorSlug}/products/${item.productId}`;

  return (
    <Card className="p-4">
      <div className="flex gap-4">
        <Link href={productUrl} className="flex-shrink-0">
          <div className="relative w-24 h-24 rounded-md overflow-hidden bg-muted">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                No image
              </div>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <Link href={productUrl} className="hover:underline">
            <h3 className="font-semibold truncate">{item.name}</h3>
          </Link>

          {item.variantInfo && (
            <p className="text-sm text-muted-foreground">
              {item.variantInfo.type}: {item.variantInfo.value}
            </p>
          )}

          <p className="text-sm text-muted-foreground mt-1">
            {formatPrice(item.price)} / unite
          </p>

          <div className="flex items-center gap-4 mt-3 lg:hidden">
            <QuantitySelector
              value={item.quantity}
              onChange={onUpdateQuantity}
              min={1}
              max={99}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="text-destructive hover:text-destructive"
              aria-label="Supprimer l'article"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-6">
          <QuantitySelector
            value={item.quantity}
            onChange={onUpdateQuantity}
            min={1}
            max={99}
          />

          <div className="w-24 text-right">
            <p className="font-semibold">{formatPrice(lineTotal)}</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="text-destructive hover:text-destructive"
            aria-label="Supprimer l'article"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="lg:hidden mt-3 pt-3 border-t flex justify-between">
        <span className="text-sm text-muted-foreground">Sous-total</span>
        <span className="font-semibold">{formatPrice(lineTotal)}</span>
      </div>
    </Card>
  );
}
