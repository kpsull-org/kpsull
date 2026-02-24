'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/lib/stores/cart.store';

/**
 * Hook to wait for Zustand cart store hydration from localStorage.
 *
 * Returns `true` once the persisted cart state has been loaded.
 * Use this in checkout pages before rendering cart-dependent UI.
 */
export function useCartHydration(): boolean {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const unsub = useCartStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    if (useCartStore.persist.hasHydrated()) {
      setIsHydrated(true);
    } else {
      // skipHydration: true dans le store — déclencher manuellement.
      // Pour les utilisateurs connectés (getCartAction + replaceItems),
      // rehydrate() lit localStorage vide et onFinishHydration se déclenche aussitôt
      // sans écraser les items déjà chargés par CartDropdown.
      useCartStore.persist.rehydrate();
    }

    return unsub;
  }, []);

  return isHydrated;
}
