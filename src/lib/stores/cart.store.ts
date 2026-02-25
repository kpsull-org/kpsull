import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  creatorSlug: string;
  variantInfo?: {
    type: string;
    value: string;
  };
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  removeItem: (productId: string, variantId?: string) => void;
  replaceItems: (items: CartItem[]) => void;
  getTotal: () => number;
  getItemCount: () => number;
  clear: () => void;
}

const getItemKey = (productId: string, variantId?: string): string => {
  return variantId ? `${productId}:${variantId}` : productId;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const key = getItemKey(item.productId, item.variantId);
          const existingIndex = state.items.findIndex(
            (i) => getItemKey(i.productId, i.variantId) === key
          );

          if (existingIndex >= 0) {
            const newItems = [...state.items];
            const existingItem = newItems[existingIndex];
            /* c8 ignore start */
            if (existingItem) {
              newItems[existingIndex] = {
                ...existingItem,
                quantity: existingItem.quantity + 1,
              };
            }
            /* c8 ignore stop */
            return { items: newItems };
          }

          return {
            items: [...state.items, { ...item, quantity: 1 }],
          };
        });
      },

      updateQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }

        set((state) => {
          const key = getItemKey(productId, variantId);
          const newItems = state.items.map((item) => {
            if (getItemKey(item.productId, item.variantId) === key) {
              return { ...item, quantity };
            }
            return item;
          });
          return { items: newItems };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => {
          const key = getItemKey(productId, variantId);
          return {
            items: state.items.filter(
              (item) => getItemKey(item.productId, item.variantId) !== key
            ),
          };
        });
      },

      getTotal: () => {
        const state = get();
        return state.items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getItemCount: () => {
        const state = get();
        return state.items.reduce((count, item) => count + item.quantity, 0);
      },

      replaceItems: (items) => {
        set({ items });
      },

      clear: () => {
        set({ items: [] });
      },
    }),
    {
      name: 'kpsull-cart',
      skipHydration: true,
    }
  )
);
