import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore, type CartItem } from '../cart.store';

describe('CartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  const sampleItem: Omit<CartItem, 'quantity'> = {
    productId: 'prod-123',
    name: 'Test Product',
    price: 2999,
    image: '/test.jpg',
    creatorSlug: 'test-creator',
  };

  describe('addItem', () => {
    it('should add a new item to cart', () => {
      useCartStore.getState().addItem(sampleItem);

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0]?.productId).toBe('prod-123');
      expect(items[0]?.quantity).toBe(1);
    });

    it('should increment quantity when adding existing item', () => {
      useCartStore.getState().addItem(sampleItem);
      useCartStore.getState().addItem(sampleItem);

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0]?.quantity).toBe(2);
    });

    it('should treat same product with different variant as different items', () => {
      useCartStore.getState().addItem(sampleItem);
      useCartStore.getState().addItem({
        ...sampleItem,
        variantId: 'var-1',
        variantInfo: { type: 'Taille', value: 'M' },
      });

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(2);
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      useCartStore.getState().addItem(sampleItem);
      useCartStore.getState().updateQuantity('prod-123', 5);

      const items = useCartStore.getState().items;
      expect(items[0]?.quantity).toBe(5);
    });

    it('should remove item when quantity is 0', () => {
      useCartStore.getState().addItem(sampleItem);
      useCartStore.getState().updateQuantity('prod-123', 0);

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(0);
    });

    it('should update correct variant', () => {
      useCartStore.getState().addItem(sampleItem);
      useCartStore.getState().addItem({
        ...sampleItem,
        variantId: 'var-1',
      });
      useCartStore.getState().updateQuantity('prod-123', 10, 'var-1');

      const items = useCartStore.getState().items;
      const variantItem = items.find((i) => i.variantId === 'var-1');
      const normalItem = items.find((i) => !i.variantId);
      expect(variantItem?.quantity).toBe(10);
      expect(normalItem?.quantity).toBe(1);
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', () => {
      useCartStore.getState().addItem(sampleItem);
      useCartStore.getState().removeItem('prod-123');

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(0);
    });

    it('should only remove specific variant', () => {
      useCartStore.getState().addItem(sampleItem);
      useCartStore.getState().addItem({
        ...sampleItem,
        variantId: 'var-1',
      });
      useCartStore.getState().removeItem('prod-123', 'var-1');

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0]?.variantId).toBeUndefined();
    });
  });

  describe('getTotal', () => {
    it('should calculate correct total', () => {
      useCartStore.getState().addItem({ ...sampleItem, price: 1000 });
      useCartStore.getState().addItem({
        ...sampleItem,
        productId: 'prod-456',
        price: 2000,
      });
      useCartStore.getState().updateQuantity('prod-123', 2);

      const total = useCartStore.getState().getTotal();
      expect(total).toBe(4000); // 1000*2 + 2000*1
    });

    it('should return 0 for empty cart', () => {
      const total = useCartStore.getState().getTotal();
      expect(total).toBe(0);
    });
  });

  describe('getItemCount', () => {
    it('should return total item count', () => {
      useCartStore.getState().addItem(sampleItem);
      useCartStore.getState().addItem({
        ...sampleItem,
        productId: 'prod-456',
      });
      useCartStore.getState().updateQuantity('prod-123', 3);

      const count = useCartStore.getState().getItemCount();
      expect(count).toBe(4); // 3 + 1
    });
  });

  describe('clear', () => {
    it('should clear all items', () => {
      useCartStore.getState().addItem(sampleItem);
      useCartStore.getState().addItem({
        ...sampleItem,
        productId: 'prod-456',
      });
      useCartStore.getState().clear();

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(0);
    });
  });

  describe('replaceItems', () => {
    it('should replace all existing items with new ones', () => {
      useCartStore.getState().addItem(sampleItem);

      const newItems: CartItem[] = [
        { productId: 'new-prod-1', name: 'New Product', price: 500, quantity: 3, creatorSlug: 'creator-a' },
        { productId: 'new-prod-2', name: 'Another Product', price: 1500, quantity: 1, creatorSlug: 'creator-b' },
      ];
      useCartStore.getState().replaceItems(newItems);

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(2);
      expect(items[0]?.productId).toBe('new-prod-1');
      expect(items[1]?.productId).toBe('new-prod-2');
    });

    it('should replace items with empty array, clearing the cart', () => {
      useCartStore.getState().addItem(sampleItem);
      useCartStore.getState().replaceItems([]);

      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });
});
