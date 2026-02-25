import { describe, it, expect } from 'vitest';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';

describe('Cart Entity', () => {
  describe('create', () => {
    it('should create an empty cart', () => {
      // Act
      const result = Cart.create({ userId: 'user-123' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.userId).toBe('user-123');
      expect(result.value.items).toHaveLength(0);
      expect(result.value.isEmpty).toBe(true);
    });

    it('should create a guest cart without userId', () => {
      // Act
      const result = Cart.create({});

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.userId).toBeUndefined();
    });
  });

  describe('addItem', () => {
    it('should add a new item to cart', () => {
      // Arrange
      const cart = Cart.create({ userId: 'user-123' }).value;
      const item = CartItem.create({
        productId: 'product-1',
        name: 'Produit A',
        price: 2999,
        image: 'https://example.com/image.jpg',
        creatorSlug: 'creator-slug',
      }).value;

      // Act
      const result = cart.addItem(item);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(cart.items).toHaveLength(1);
      expect(cart.itemCount).toBe(1);
    });

    it('should increment quantity when adding same product', () => {
      // Arrange
      const cart = Cart.create({ userId: 'user-123' }).value;
      const item1 = CartItem.create({
        productId: 'product-1',
        name: 'Produit A',
        price: 2999,
        creatorSlug: 'creator-slug',
      }).value;
      const item2 = CartItem.create({
        productId: 'product-1',
        name: 'Produit A',
        price: 2999,
        creatorSlug: 'creator-slug',
      }).value;

      // Act
      cart.addItem(item1);
      cart.addItem(item2);

      // Assert
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0]?.quantity).toBe(2);
      expect(cart.itemCount).toBe(2);
    });

    it('should treat different variants as separate items', () => {
      // Arrange
      const cart = Cart.create({ userId: 'user-123' }).value;
      const item1 = CartItem.create({
        productId: 'product-1',
        variantId: 'variant-A',
        name: 'Produit A - Taille S',
        price: 2999,
        creatorSlug: 'creator-slug',
      }).value;
      const item2 = CartItem.create({
        productId: 'product-1',
        variantId: 'variant-B',
        name: 'Produit A - Taille M',
        price: 2999,
        creatorSlug: 'creator-slug',
      }).value;

      // Act
      cart.addItem(item1);
      cart.addItem(item2);

      // Assert
      expect(cart.items).toHaveLength(2);
    });
  });

  describe('removeItem', () => {
    it('should remove an item from cart', () => {
      // Arrange
      const cart = Cart.create({ userId: 'user-123' }).value;
      const item = CartItem.create({
        productId: 'product-1',
        name: 'Produit A',
        price: 2999,
        creatorSlug: 'creator-slug',
      }).value;
      cart.addItem(item);

      // Act
      const result = cart.removeItem('product-1');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(cart.items).toHaveLength(0);
    });

    it('should remove specific variant only', () => {
      // Arrange
      const cart = Cart.create({ userId: 'user-123' }).value;
      const item1 = CartItem.create({
        productId: 'product-1',
        variantId: 'variant-A',
        name: 'Produit A - Taille S',
        price: 2999,
        creatorSlug: 'creator-slug',
      }).value;
      const item2 = CartItem.create({
        productId: 'product-1',
        variantId: 'variant-B',
        name: 'Produit A - Taille M',
        price: 2999,
        creatorSlug: 'creator-slug',
      }).value;
      cart.addItem(item1);
      cart.addItem(item2);

      // Act
      cart.removeItem('product-1', 'variant-A');

      // Assert
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0]?.variantId).toBe('variant-B');
    });

    it('should fail when item not found', () => {
      // Arrange
      const cart = Cart.create({ userId: 'user-123' }).value;

      // Act
      const result = cart.removeItem('non-existent');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvé');
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      // Arrange
      const cart = Cart.create({ userId: 'user-123' }).value;
      const item = CartItem.create({
        productId: 'product-1',
        name: 'Produit A',
        price: 2999,
        creatorSlug: 'creator-slug',
      }).value;
      cart.addItem(item);

      // Act
      const result = cart.updateQuantity('product-1', 5);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(cart.items[0]?.quantity).toBe(5);
      expect(cart.itemCount).toBe(5);
    });

    it('should remove item when quantity is 0', () => {
      // Arrange
      const cart = Cart.create({ userId: 'user-123' }).value;
      const item = CartItem.create({
        productId: 'product-1',
        name: 'Produit A',
        price: 2999,
        creatorSlug: 'creator-slug',
      }).value;
      cart.addItem(item);

      // Act
      cart.updateQuantity('product-1', 0);

      // Assert
      expect(cart.items).toHaveLength(0);
    });

    it('should fail with negative quantity', () => {
      // Arrange
      const cart = Cart.create({ userId: 'user-123' }).value;
      const item = CartItem.create({
        productId: 'product-1',
        name: 'Produit A',
        price: 2999,
        creatorSlug: 'creator-slug',
      }).value;
      cart.addItem(item);

      // Act
      const result = cart.updateQuantity('product-1', -1);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('négative');
    });

    it('should update quantity for a specific variant', () => {
      const cart = Cart.create({ userId: 'user-123' }).value;
      const item = CartItem.create({
        productId: 'product-1',
        variantId: 'variant-A',
        name: 'Produit A - Taille M',
        price: 2999,
        creatorSlug: 'creator-slug',
      }).value;
      cart.addItem(item);

      const result = cart.updateQuantity('product-1', 3, 'variant-A');

      expect(result.isSuccess).toBe(true);
      expect(cart.items[0]?.quantity).toBe(3);
    });
  });

  describe('clear', () => {
    it('should clear all items from cart', () => {
      // Arrange
      const cart = Cart.create({ userId: 'user-123' }).value;
      cart.addItem(
        CartItem.create({
          productId: 'product-1',
          name: 'Produit A',
          price: 2999,
          creatorSlug: 'creator-slug',
        }).value
      );
      cart.addItem(
        CartItem.create({
          productId: 'product-2',
          name: 'Produit B',
          price: 4999,
          creatorSlug: 'creator-slug',
        }).value
      );

      // Act
      cart.clear();

      // Assert
      expect(cart.items).toHaveLength(0);
      expect(cart.isEmpty).toBe(true);
    });
  });

  describe('total', () => {
    it('should calculate total correctly', () => {
      // Arrange
      const cart = Cart.create({ userId: 'user-123' }).value;
      const item1 = CartItem.create({
        productId: 'product-1',
        name: 'Produit A',
        price: 2999, // 29.99€
        creatorSlug: 'creator-slug',
      }).value;
      const item2 = CartItem.create({
        productId: 'product-2',
        name: 'Produit B',
        price: 4999, // 49.99€
        creatorSlug: 'creator-slug',
      }).value;

      cart.addItem(item1);
      cart.addItem(item2);
      cart.updateQuantity('product-1', 2);

      // Act
      const total = cart.total;

      // Assert
      // 2 * 29.99 + 1 * 49.99 = 109.97 -> 10997 cents
      expect(total).toBe(10997);
    });

    it('should return 0 for empty cart', () => {
      // Arrange
      const cart = Cart.create({ userId: 'user-123' }).value;

      // Assert
      expect(cart.total).toBe(0);
    });
  });

  describe('merge', () => {
    it('should merge carts and combine quantities', () => {
      // Arrange
      const cart1 = Cart.create({ userId: 'user-123' }).value;
      const cart2 = Cart.create({}).value;

      cart1.addItem(
        CartItem.create({
          productId: 'product-1',
          name: 'Produit A',
          price: 2999,
          creatorSlug: 'creator-slug',
        }).value
      );

      cart2.addItem(
        CartItem.create({
          productId: 'product-1',
          name: 'Produit A',
          price: 2999,
          creatorSlug: 'creator-slug',
        }).value
      );
      cart2.addItem(
        CartItem.create({
          productId: 'product-2',
          name: 'Produit B',
          price: 4999,
          creatorSlug: 'creator-slug',
        }).value
      );

      // Act
      cart1.merge(cart2);

      // Assert
      expect(cart1.items).toHaveLength(2);
      expect(cart1.items.find((i) => i.productId === 'product-1')?.quantity).toBe(2);
    });
  });

  describe('updateQuantity - item not found', () => {
    it('should fail when updating quantity for non-existent item', () => {
      const cart = Cart.create({ userId: 'user-123' }).value;

      const result = cart.updateQuantity('non-existent', 5);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvé');
    });
  });

  describe('assignToUser', () => {
    it('should assign cart to a user', () => {
      const cart = Cart.create({}).value;

      cart.assignToUser('user-456');

      expect(cart.userId).toBe('user-456');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute cart from persistence', () => {
      const item = CartItem.create({
        productId: 'product-1',
        name: 'Produit A',
        price: 2999,
        creatorSlug: 'creator-slug',
      }).value;

      const now = new Date('2026-01-15T10:00:00Z');
      const result = Cart.reconstitute({
        id: 'cart-42',
        userId: 'user-123',
        items: [item],
        updatedAt: now,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.idString).toBe('cart-42');
      expect(result.value.userId).toBe('user-123');
      expect(result.value.items).toHaveLength(1);
      expect(result.value.updatedAt).toEqual(now);
    });
  });
});
