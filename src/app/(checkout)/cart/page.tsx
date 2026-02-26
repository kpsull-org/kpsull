'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/lib/stores/cart.store';
import { CartItem } from '@/components/checkout/cart-item';
import { CartSummary } from '@/components/checkout/cart-summary';
import { EmptyCart } from '@/components/checkout/empty-cart';

export default function CartPage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const items = useCartStore((state) => state.items);
  const getTotal = useCartStore((state) => state.getTotal);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  useEffect(() => {
    // Subscribe to finish-hydration event before triggering rehydration,
    // so the callback is guaranteed to fire even if rehydrate() resolves
    // synchronously on the same tick.
    const unsubFinishHydration = useCartStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // If the store was already hydrated (e.g. CartDropdown ran first), mark
    // immediately so the page doesn't stay stuck on the skeleton.
    if (useCartStore.persist.hasHydrated()) {
      setIsHydrated(true);
    } else {
      // Store is configured with skipHydration:true, so we must trigger it
      // explicitly from here for guest users. Authenticated users are handled
      // by CartDropdown which calls getCartAction and replaceItems directly.
      useCartStore.persist.rehydrate();
    }

    return () => {
      unsubFinishHydration();
    };
  }, []);

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);

  if (!isHydrated) {
    return (
      <div className="max-w-4xl mx-auto py-8 sm:py-12 font-sans">
        <div className="h-4 w-32 bg-black/10 animate-pulse mb-10" />
        <div className="h-7 w-48 bg-black/10 animate-pulse mb-8" />
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-8 lg:gap-12">
          <div className="space-y-4">
            <div className="h-28 bg-black/5 animate-pulse" />
            <div className="h-28 bg-black/5 animate-pulse" />
            <div className="h-28 bg-black/5 animate-pulse" />
          </div>
          <div>
            <div className="h-64 bg-black/5 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 font-sans">
      {/* Breadcrumb */}
      <div className="mb-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-black/50 hover:text-black transition-colors tracking-wide"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Continuer mes achats
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-wider uppercase mb-10">
        Mon panier{' '}
        <span className="text-black/40 font-normal text-lg">({items.length})</span>
      </h1>

      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-8 lg:gap-12 items-start">
        {/* Items */}
        <div className="w-full min-w-0">
          {/* Desktop column headers */}
          <div className="hidden lg:grid grid-cols-[1fr_auto_auto_auto] gap-6 pb-3 border-b border-black/10 mb-1">
            <span className="text-[10px] font-medium tracking-widest uppercase text-black/40">
              Produit
            </span>
            <span className="text-[10px] font-medium tracking-widest uppercase text-black/40 w-24 text-center">
              Qté
            </span>
            <span className="text-[10px] font-medium tracking-widest uppercase text-black/40 w-20 text-right">
              Prix
            </span>
            <span className="w-5" />
          </div>

          {items.map((item, index) => (
            <CartItem
              key={`${item.productId}-${item.variantId || 'default'}`}
              item={item}
              index={index}
              onUpdateQuantity={(quantity) =>
                updateQuantity(item.productId, quantity, item.variantId)
              }
              onRemove={() => removeItem(item.productId, item.variantId)}
              formatPrice={formatPrice}
            />
          ))}
        </div>

        {/* Summary */}
        <div className="w-full lg:w-auto">
          <CartSummary subtotal={getTotal()} formatPrice={formatPrice} />
        </div>
      </div>
    </div>
  );
}
