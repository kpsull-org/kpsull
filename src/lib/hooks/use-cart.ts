'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useCartStore, type CartItem } from '@/lib/stores/cart.store';
import { getCartAction, saveCartAction } from '@/app/cart/actions';

/**
 * Hook to manage cart state with DB sync for authenticated users.
 * - Authenticated: loads from DB on mount, saves to DB on changes
 * - Guest: uses localStorage (Zustand persist)
 */
export function useCart(isAuthenticated: boolean) {
  const items = useCartStore((s) => s.items);
  const addItemStore = useCartStore((s) => s.addItem);
  const removeItemStore = useCartStore((s) => s.removeItem);
  const updateQuantityStore = useCartStore((s) => s.updateQuantity);
  const replaceItems = useCartStore((s) => s.replaceItems);
  const clearStore = useCartStore((s) => s.clear);
  const getTotal = useCartStore((s) => s.getTotal);
  const getItemCount = useCartStore((s) => s.getItemCount);

  const isHydrated = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate on mount
  useEffect(() => {
    if (isHydrated.current) return;
    isHydrated.current = true;

    if (isAuthenticated) {
      getCartAction().then((dbItems) => {
        if (dbItems.length > 0) {
          replaceItems(dbItems);
        }
      });
    } else {
      useCartStore.persist.rehydrate();
    }
  }, [isAuthenticated, replaceItems]);

  // Debounced save to DB
  const saveToDb = useCallback(() => {
    if (!isAuthenticated) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const currentItems = useCartStore.getState().items;
      saveCartAction(currentItems).then((result) => {
        if (!result.success) {
          console.error('[useCart] Échec de la sauvegarde du panier:', result.error);
        }
      });
    }, 500);
  }, [isAuthenticated]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const addItem = useCallback(
    (item: Omit<CartItem, 'quantity'>) => {
      addItemStore(item);
      saveToDb();
    },
    [addItemStore, saveToDb]
  );

  const removeItem = useCallback(
    (productId: string, variantId?: string) => {
      removeItemStore(productId, variantId);
      saveToDb();
    },
    [removeItemStore, saveToDb]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number, variantId?: string) => {
      updateQuantityStore(productId, quantity, variantId);
      saveToDb();
    },
    [updateQuantityStore, saveToDb]
  );

  const clear = useCallback(() => {
    clearStore();
    saveToDb();
  }, [clearStore, saveToDb]);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clear,
    total: getTotal(),
    itemCount: getItemCount(),
  };
}
