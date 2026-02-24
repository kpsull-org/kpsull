'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/lib/stores/cart.store';
import { getCartAction } from '@/app/cart/actions';

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

interface CartDropdownProps {
  isAuthenticated: boolean;
}

export function CartDropdown({ isAuthenticated }: CartDropdownProps) {
  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);
  const getItemCount = useCartStore((s) => s.getItemCount);
  const [hydrated, setHydrated] = useState(false);
  const hasRunRef = useRef(false);

  // Hydrate cart on mount — runs only once via ref guard to avoid re-triggering
  // when Zustand store functions change reference after a replaceItems call.
  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;
    setHydrated(true);

    if (isAuthenticated) {
      getCartAction()
        .then((dbItems) => {
          if (dbItems.length > 0) {
            useCartStore.getState().replaceItems(dbItems);
          }
        })
        .catch((err: unknown) => {
          // Erreur réseau ou token expiré : fallback localStorage
          console.error('[CartDropdown] Impossible de charger le panier depuis la DB:', err);
          useCartStore.persist.rehydrate();
        });
    } else {
      useCartStore.persist.rehydrate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const itemCount = hydrated ? getItemCount() : 0;
  const total = hydrated ? getTotal() : 0;

  return (
    <div className="group/cart flex h-full items-center">
      {/* Cart icon with badge + label */}
      <button
        className="relative flex items-center gap-2 transition-opacity hover:opacity-70 before:pointer-events-auto before:absolute before:-inset-x-2 before:top-full before:h-10 before:content-['']"
        aria-label="Panier"
      >
        <span className="relative">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </span>
        <span className="font-[family-name:var(--font-archivo)] text-[18px] font-medium uppercase tracking-wide">Panier</span>
      </button>

      {/* Dropdown panel -- flush with header bottom, hover bridge via ::before on button */}
      <div className="pointer-events-none absolute -left-[5px] right-0 top-full opacity-0 group-hover/cart:pointer-events-auto group-hover/cart:opacity-100 transition-[opacity] duration-200">
        <div className="relative -mt-[5px] bg-white pt-[5px] pb-[18px]">
          {/* Vertical grid lines */}
          <div className="absolute inset-y-0 left-[5px] flex gap-1">
            <div className="w-px bg-black" />
            <div className="w-px bg-black" />
          </div>

          {/* Bottom double lines */}
          <div className="absolute inset-x-0 bottom-[9px] h-[2px] bg-black" />
          <div className="absolute inset-x-0 bottom-[5px] h-[2px] bg-black" />

          <div className="px-4 py-0">
            {!hydrated || items.length === 0 ? (
              /* Empty state */
              <div className="py-4 text-center">
                <ShoppingCart className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 font-[family-name:var(--font-archivo)] text-[13px] uppercase tracking-wide text-gray-400">
                  Votre panier est vide
                </p>
              </div>
            ) : (
              <>
                {/* Cart items list */}
                <div className="max-h-[300px] overflow-y-auto space-y-3">
                  {items.map((item) => (
                    <div
                      key={`${item.productId}:${item.variantId ?? ''}`}
                      className="flex gap-3"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden bg-gray-100">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[8px] text-gray-400">
                            IMG
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-[family-name:var(--font-archivo)] text-[12px] font-medium uppercase tracking-wide">
                          {item.name}
                        </p>
                        {item.variantInfo && (
                          <p className="text-[11px] text-gray-500">
                            {item.variantInfo.value}
                          </p>
                        )}
                        <p className="text-[12px] text-gray-600">
                          {item.quantity} x {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Full-width double line separator */}
                <div className="-mx-4 my-3 space-y-[2px]">
                  <div className="h-[1px] bg-black" />
                  <div className="h-[1px] bg-black" />
                </div>

                {/* Total TTC */}
                <div className="flex items-center justify-between">
                  <span className="font-[family-name:var(--font-archivo)] text-[13px] font-medium uppercase tracking-wide">
                    Total TTC
                  </span>
                  <span className="font-[family-name:var(--font-montserrat)] text-[15px] font-bold">
                    {formatPrice(total)}
                  </span>
                </div>

                {/* Full-width double line separator */}
                <div className="-mx-4 my-3 space-y-[2px]">
                  <div className="h-[1px] bg-black" />
                  <div className="h-[1px] bg-black" />
                </div>

                {/* Link to cart page */}
                <Link
                  href="/cart"
                  className="block text-center font-[family-name:var(--font-archivo)] text-[14px] font-medium uppercase tracking-wide text-black transition-colors hover:bg-black hover:text-white px-4 py-2.5"
                >
                  Voir le panier
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
