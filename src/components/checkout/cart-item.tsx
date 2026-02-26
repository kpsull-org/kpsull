'use client';

import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import { QuantitySelector } from './quantity-selector';
import type { CartItem as CartItemType } from '@/lib/stores/cart.store';

interface CartItemProps {
  readonly item: CartItemType;
  readonly index?: number;
  readonly onUpdateQuantity: (quantity: number) => void;
  readonly onRemove: () => void;
  readonly formatPrice: (cents: number) => string;
}

const STAGGER_CLASSES: Record<number, string> = {
  0: 'kp-scroll-reveal',
  1: 'kp-scroll-reveal kp-scroll-reveal-delay-1',
  2: 'kp-scroll-reveal kp-scroll-reveal-delay-2',
  3: 'kp-scroll-reveal kp-scroll-reveal-delay-3',
  4: 'kp-scroll-reveal kp-scroll-reveal-delay-4',
};

function getStaggerClass(index: number): string {
  return STAGGER_CLASSES[Math.min(index, 4)] ?? 'kp-scroll-reveal kp-scroll-reveal-delay-4';
}

export function CartItem({
  item,
  index = 0,
  onUpdateQuantity,
  onRemove,
  formatPrice,
}: CartItemProps) {
  const lineTotal = item.price * item.quantity;
  const productUrl = `/${item.creatorSlug}/products/${item.productId}`;

  return (
    <div
      className={`group border-b border-black/10 py-6 font-sans hover:bg-black/[0.02] transition-colors duration-200 ${getStaggerClass(index)}`}
    >
      <div className="flex gap-4 sm:gap-5 min-w-0">
        {/* Image */}
        <Link href={productUrl} className="flex-shrink-0">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-[#F2F2F2] overflow-hidden">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-black/30 text-xs">
                —
              </div>
            )}
          </div>
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link href={productUrl}>
            <h3 className="font-bold text-sm tracking-wide uppercase truncate hover:underline leading-tight">
              {item.name}
            </h3>
          </Link>

          {item.variantInfo && (
            <p className="text-xs text-black/40 mt-1">
              {item.variantInfo.type}: {item.variantInfo.value}
            </p>
          )}

          <p className="text-xs text-black/40 mt-1">
            {formatPrice(item.price)} / unité
          </p>

          {/* Mobile: quantity + remove */}
          <div className="flex items-center gap-3 mt-3 lg:hidden">
            <QuantitySelector
              value={item.quantity}
              onChange={onUpdateQuantity}
              min={1}
              max={99}
            />
            <button
              onClick={onRemove}
              className="text-black/40 hover:text-black transition-colors"
              aria-label="Supprimer l'article"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Desktop: quantity + total + remove */}
        <div className="hidden lg:flex items-start gap-6">
          <QuantitySelector
            value={item.quantity}
            onChange={onUpdateQuantity}
            min={1}
            max={99}
          />

          <div className="w-20 text-right">
            <p className="font-bold text-base">{formatPrice(lineTotal)}</p>
          </div>

          <button
            onClick={onRemove}
            className="text-black/40 hover:text-black transition-colors mt-1 opacity-0 group-hover:opacity-100"
            aria-label="Supprimer l'article"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile total */}
      <div className="lg:hidden mt-3 flex justify-between text-xs">
        <span className="text-black/50">Sous-total</span>
        <span className="font-bold">{formatPrice(lineTotal)}</span>
      </div>
    </div>
  );
}
