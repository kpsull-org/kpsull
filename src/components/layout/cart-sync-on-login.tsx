'use client';

import { useEffect, useRef } from 'react';
import { useCartStore } from '@/lib/stores/cart.store';
import { saveCartAction } from '@/app/cart/actions';

interface CartSyncOnLoginProps {
  isAuthenticated: boolean;
}

/**
 * Syncs localStorage cart to DB when user logs in.
 * If the guest had items in localStorage, those replace the DB cart.
 * Then localStorage is cleared so the DB becomes the source of truth.
 */
export function CartSyncOnLogin({ isAuthenticated }: CartSyncOnLoginProps) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current || !isAuthenticated) return;
    hasRun.current = true;

    // Read raw localStorage to check for guest cart items
    try {
      const raw = localStorage.getItem('kpsull-cart');
      if (!raw) return;

      const parsed = JSON.parse(raw);
      const localItems = parsed?.state?.items;

      if (!Array.isArray(localItems) || localItems.length === 0) return;

      // Replace DB cart with local cart
      saveCartAction(localItems).then(() => {
        // Clear localStorage cart and hydrate Zustand from the saved items
        localStorage.removeItem('kpsull-cart');
        useCartStore.getState().replaceItems(localItems);
      });
    } catch {
      // Ignore parse errors
    }
  }, [isAuthenticated]);

  return null;
}
