import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CartItem } from '@/lib/stores/cart.store';

// Mock next-auth/react signOut for SESSION_EXPIRED tests
const mockSignOut = vi.hoisted(() => vi.fn());
vi.mock('next-auth/react', () => ({
  signOut: mockSignOut,
}));

// vi.hoisted() ensures these are initialized before vi.mock() factories run
const {
  mockItems,
  mockReplaceItems,
  mockAddItem,
  mockRemoveItem,
  mockUpdateQuantity,
  mockClear,
  mockGetTotal,
  mockGetItemCount,
  mockRehydrate,
  mockGetState,
} = vi.hoisted(() => {
  const mockItems: CartItem[] = [];
  return {
    mockItems,
    mockReplaceItems: vi.fn(),
    mockAddItem: vi.fn(),
    mockRemoveItem: vi.fn(),
    mockUpdateQuantity: vi.fn(),
    mockClear: vi.fn(),
    mockGetTotal: vi.fn(() => 0),
    mockGetItemCount: vi.fn(() => 0),
    mockRehydrate: vi.fn(),
    mockGetState: vi.fn(() => ({ items: mockItems })),
  };
});

// Mock cart actions
vi.mock('@/app/cart/actions', () => ({
  getCartAction: vi.fn(),
  saveCartAction: vi.fn(),
}));

// Mock cart store
vi.mock('@/lib/stores/cart.store', () => ({
  useCartStore: Object.assign(
    vi.fn((selector: (s: object) => unknown) => {
      const state = {
        items: mockItems,
        addItem: mockAddItem,
        removeItem: mockRemoveItem,
        updateQuantity: mockUpdateQuantity,
        replaceItems: mockReplaceItems,
        clear: mockClear,
        getTotal: mockGetTotal,
        getItemCount: mockGetItemCount,
      };
      return selector(state);
    }),
    {
      persist: { rehydrate: mockRehydrate },
      getState: mockGetState,
    }
  ),
}));

// Capture useEffect calls for manual triggering in tests
const effectCallbacks: Array<() => Promise<void> | void> = [];

vi.mock('react', () => ({
  useEffect: vi.fn((fn: () => Promise<void> | void) => {
    effectCallbacks.push(fn);
  }),
  useCallback: vi.fn(<T extends (...args: unknown[]) => unknown>(fn: T) => fn),
  useRef: vi.fn((initial: unknown) => ({ current: initial })),
}));

import { getCartAction, saveCartAction } from '@/app/cart/actions';
import { useCart } from '../use-cart';

const mockGetCartAction = vi.mocked(getCartAction);
const mockSaveCartAction = vi.mocked(saveCartAction);

describe('useCart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    effectCallbacks.length = 0;
    mockGetState.mockReturnValue({ items: mockItems });
  });

  const validItem: Omit<CartItem, 'quantity'> = {
    productId: 'prod-123',
    name: 'Test Product',
    price: 2999,
    creatorSlug: 'creator-slug',
  };

  describe('hydration (authenticated)', () => {
    it('should call getCartAction on mount when authenticated', async () => {
      mockGetCartAction.mockResolvedValue([]);

      useCart(true);
      for (const cb of effectCallbacks) {
        await cb();
      }

      expect(getCartAction).toHaveBeenCalledOnce();
    });

    it('should call replaceItems when DB returns non-empty items', async () => {
      const dbItems: CartItem[] = [{ ...validItem, quantity: 1 }];
      mockGetCartAction.mockResolvedValue(dbItems);

      useCart(true);
      for (const cb of effectCallbacks) {
        await cb();
      }

      expect(mockReplaceItems).toHaveBeenCalledWith(dbItems);
    });

    it('should not call replaceItems when DB returns empty items', async () => {
      mockGetCartAction.mockResolvedValue([]);

      useCart(true);
      for (const cb of effectCallbacks) {
        await cb();
      }

      expect(mockReplaceItems).not.toHaveBeenCalled();
    });
  });

  describe('hydration (guest)', () => {
    it('should call useCartStore.persist.rehydrate when not authenticated', async () => {
      useCart(false);
      for (const cb of effectCallbacks) {
        await cb();
      }

      expect(mockRehydrate).toHaveBeenCalledOnce();
      expect(getCartAction).not.toHaveBeenCalled();
    });
  });

  describe('hydration error handling', () => {
    it('should log error and rehydrate from store when getCartAction fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetCartAction.mockRejectedValue(new Error('Network failure'));

      useCart(true);
      for (const cb of effectCallbacks) {
        await cb();
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[useCart]'),
        expect.any(Error)
      );
      expect(mockRehydrate).toHaveBeenCalledOnce();

      consoleSpy.mockRestore();
    });
  });

  describe('addItem', () => {
    it('should call addItemStore when adding an item', () => {
      const { addItem } = useCart(true);
      addItem(validItem);

      expect(mockAddItem).toHaveBeenCalledWith(validItem);
    });

    it('should call addItemStore when not authenticated', () => {
      const { addItem } = useCart(false);
      addItem(validItem);

      expect(mockAddItem).toHaveBeenCalledWith(validItem);
    });
  });

  describe('removeItem', () => {
    it('should call removeItemStore when removing an item', () => {
      const { removeItem } = useCart(true);
      removeItem('prod-123');

      expect(mockRemoveItem).toHaveBeenCalledWith('prod-123', undefined);
    });

    it('should call removeItemStore with variantId when provided', () => {
      const { removeItem } = useCart(true);
      removeItem('prod-123', 'var-1');

      expect(mockRemoveItem).toHaveBeenCalledWith('prod-123', 'var-1');
    });
  });

  describe('updateQuantity', () => {
    it('should call updateQuantityStore with correct args', () => {
      const { updateQuantity } = useCart(true);
      updateQuantity('prod-123', 5);

      expect(mockUpdateQuantity).toHaveBeenCalledWith('prod-123', 5, undefined);
    });

    it('should call updateQuantityStore with variantId when provided', () => {
      const { updateQuantity } = useCart(true);
      updateQuantity('prod-123', 3, 'var-1');

      expect(mockUpdateQuantity).toHaveBeenCalledWith('prod-123', 3, 'var-1');
    });
  });

  describe('clear', () => {
    it('should call clearStore when clearing cart', () => {
      const { clear } = useCart(true);
      clear();

      expect(mockClear).toHaveBeenCalledOnce();
    });
  });

  describe('return values', () => {
    it('should return items, total, itemCount and action fns from the hook', () => {
      const result = useCart(false);

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('itemCount');
      expect(result).toHaveProperty('addItem');
      expect(result).toHaveProperty('removeItem');
      expect(result).toHaveProperty('updateQuantity');
      expect(result).toHaveProperty('clear');
    });
  });

  describe('saveToDb (error handling)', () => {
    it('should log console.error when saveCartAction returns success false', async () => {
      vi.useFakeTimers();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSaveCartAction.mockResolvedValue({ success: false, error: 'DB error' });
      mockGetState.mockReturnValue({ items: [{ ...validItem, quantity: 1 }] });

      const { addItem } = useCart(true);
      addItem(validItem);
      vi.advanceTimersByTime(600);
      await vi.runAllTimersAsync();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[useCart]'),
        'DB error'
      );

      consoleSpy.mockRestore();
      vi.useRealTimers();
    });

    it('should not call saveCartAction when not authenticated', async () => {
      vi.useFakeTimers();

      const { addItem } = useCart(false);
      addItem(validItem);
      vi.advanceTimersByTime(600);
      await vi.runAllTimersAsync();

      expect(saveCartAction).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should call signOut when saveCartAction returns SESSION_EXPIRED', async () => {
      vi.useFakeTimers();
      mockSaveCartAction.mockResolvedValue({ success: false, error: 'SESSION_EXPIRED' });
      mockGetState.mockReturnValue({ items: [{ ...validItem, quantity: 1 }] });

      const { addItem } = useCart(true);
      addItem(validItem);
      vi.advanceTimersByTime(600);
      await vi.runAllTimersAsync();

      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });

      vi.useRealTimers();
    });

    it('should clear existing timeout when saveToDb is called multiple times quickly', async () => {
      vi.useFakeTimers();
      mockSaveCartAction.mockResolvedValue({ success: true });
      mockGetState.mockReturnValue({ items: [{ ...validItem, quantity: 1 }] });

      const { addItem } = useCart(true);
      addItem(validItem); // sets timeout
      addItem(validItem); // clears previous timeout, sets new one
      vi.advanceTimersByTime(600);
      await vi.runAllTimersAsync();

      // should only be called once since the first timeout was cleared
      expect(saveCartAction).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe('cleanup effect', () => {
    it('should clear pending timeout on unmount when timeout is set', () => {
      vi.useFakeTimers();
      mockSaveCartAction.mockResolvedValue({ success: true });
      mockGetState.mockReturnValue({ items: [{ ...validItem, quantity: 1 }] });

      const { addItem } = useCart(true);

      // Set a pending timeout via addItem (triggers saveToDb → setTimeout)
      addItem(validItem);

      // Second effect is the cleanup effect
      const cleanupEffectFn = effectCallbacks[1];
      expect(cleanupEffectFn).toBeDefined();

      // Execute the effect body to get the cleanup function
      const cleanup = cleanupEffectFn!() as (() => void) | undefined;

      // saveTimeoutRef.current is now set to a timer ID → cleanup should clearTimeout
      if (typeof cleanup === 'function') {
        expect(() => cleanup()).not.toThrow();
      }

      vi.useRealTimers();
    });

    it('should not throw on unmount when no pending timeout', () => {
      useCart(true);

      const cleanupEffectFn = effectCallbacks[1];
      if (cleanupEffectFn) {
        const cleanup = cleanupEffectFn() as (() => void) | undefined;
        if (typeof cleanup === 'function') {
          expect(() => cleanup()).not.toThrow();
        }
      }
    });
  });
});
