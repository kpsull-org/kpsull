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
      <div className="container py-8">
        <div className="space-y-4">
          <div className="h-4 w-32 bg-black/10 animate-pulse" />
          <div className="h-24 bg-black/5 animate-pulse" />
          <div className="h-24 bg-black/5 animate-pulse" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="container py-8 font-sans">
      {/* Breadcrumb */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-black/50 hover:text-black transition-colors tracking-wide"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Continuer mes achats
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-wider uppercase mb-8">
        Mon panier{' '}
        <span className="text-black/40 font-normal text-lg">({items.length})</span>
      </h1>

      <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Items */}
        <div className="lg:col-span-2">
          {items.map((item) => (
            <CartItem
              key={`${item.productId}-${item.variantId || 'default'}`}
              item={item}
              onUpdateQuantity={(quantity) =>
                updateQuantity(item.productId, quantity, item.variantId)
              }
              onRemove={() => removeItem(item.productId, item.variantId)}
              formatPrice={formatPrice}
            />
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <CartSummary subtotal={getTotal()} formatPrice={formatPrice} />
        </div>
      </div>
    </div>
  );
}
