'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/lib/stores/cart.store';
import { CartItem } from '@/components/checkout/cart-item';
import { CartSummary } from '@/components/checkout/cart-summary';
import { EmptyCart } from '@/components/checkout/empty-cart';
import { Button } from '@/components/ui/button';

export default function CartPage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const items = useCartStore((state) => state.items);
  const getTotal = useCartStore((state) => state.getTotal);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  useEffect(() => {
    // Attendre que l'hydratation soit terminee
    const unsubFinishHydration = useCartStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // Si deja hydrate, mettre a jour immediatement
    if (useCartStore.persist.hasHydrated()) {
      setIsHydrated(true);
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

  // Attendre l'hydratation avant de rendre
  if (!isHydrated) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continuer mes achats
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-8">Mon Panier</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
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

        <div className="lg:col-span-1">
          <CartSummary subtotal={getTotal()} formatPrice={formatPrice} />
        </div>
      </div>
    </div>
  );
}
