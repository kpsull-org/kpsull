import { describe, it, expect } from 'vitest';
import { CartItem } from '../cart-item.entity';

const VALID_PROPS = {
  productId: 'product-123',
  name: 'T-shirt Bio',
  price: 2999,
  creatorSlug: 'ma-boutique',
};

function createItem(overrides = {}) {
  return CartItem.create({ ...VALID_PROPS, ...overrides });
}

describe('CartItem Entity', () => {
  describe('create', () => {
    it('should create a cart item with quantity 1', () => {
      const result = createItem();

      expect(result.isSuccess).toBe(true);
      expect(result.value.productId).toBe('product-123');
      expect(result.value.name).toBe('T-shirt Bio');
      expect(result.value.price).toBe(2999);
      expect(result.value.quantity).toBe(1);
      expect(result.value.creatorSlug).toBe('ma-boutique');
      expect(result.value.idString).toBeDefined();
    });

    it('should create with optional variant', () => {
      const result = createItem({
        variantId: 'v-1',
        variantInfo: { type: 'Taille', value: 'M' },
        image: 'https://example.com/img.jpg',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.variantId).toBe('v-1');
      expect(result.value.variantInfo).toEqual({ type: 'Taille', value: 'M' });
      expect(result.value.image).toBe('https://example.com/img.jpg');
    });

    it('should return undefined for optional fields', () => {
      const result = createItem();

      expect(result.value.variantId).toBeUndefined();
      expect(result.value.variantInfo).toBeUndefined();
      expect(result.value.image).toBeUndefined();
    });

    it('should fail when productId is empty', () => {
      const result = createItem({ productId: '' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Product ID');
    });

    it('should fail when name is empty', () => {
      const result = createItem({ name: '' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nom du produit');
    });

    it('should fail when price is negative', () => {
      const result = createItem({ price: -1 });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('prix');
    });

    it('should accept zero price', () => {
      const result = createItem({ price: 0 });

      expect(result.isSuccess).toBe(true);
    });

    it('should fail when creatorSlug is empty', () => {
      const result = createItem({ creatorSlug: '' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator slug');
    });
  });

  describe('key', () => {
    it('should use productId as key when no variant', () => {
      const item = createItem().value;

      expect(item.key).toBe('product-123');
    });

    it('should combine productId and variantId for key', () => {
      const item = createItem({ variantId: 'v-1' }).value;

      expect(item.key).toBe('product-123:v-1');
    });
  });

  describe('subtotal', () => {
    it('should calculate subtotal', () => {
      const item = createItem({ price: 1500 }).value;
      item.incrementQuantity();

      expect(item.subtotal).toBe(3000);
    });
  });

  describe('incrementQuantity', () => {
    it('should increment quantity by 1', () => {
      const item = createItem().value;

      expect(item.quantity).toBe(1);
      item.incrementQuantity();
      expect(item.quantity).toBe(2);
      item.incrementQuantity();
      expect(item.quantity).toBe(3);
    });
  });

  describe('setQuantity', () => {
    it('should set quantity to given value', () => {
      const item = createItem().value;

      const result = item.setQuantity(5);

      expect(result.isSuccess).toBe(true);
      expect(item.quantity).toBe(5);
    });

    it('should allow setting quantity to 0', () => {
      const item = createItem().value;

      const result = item.setQuantity(0);

      expect(result.isSuccess).toBe(true);
      expect(item.quantity).toBe(0);
    });

    it('should fail when quantity is negative', () => {
      const item = createItem().value;

      const result = item.setQuantity(-1);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('quantit');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from persistence data', () => {
      const result = CartItem.reconstitute({
        id: 'cart-item-42',
        productId: 'p-1',
        name: 'Hoodie',
        price: 5999,
        quantity: 3,
        creatorSlug: 'shop',
        variantId: 'v-1',
        variantInfo: { type: 'Size', value: 'XL' },
        image: 'https://example.com/hoodie.jpg',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.idString).toBe('cart-item-42');
      expect(result.value.quantity).toBe(3);
      expect(result.value.variantInfo).toEqual({ type: 'Size', value: 'XL' });
    });
  });
});
