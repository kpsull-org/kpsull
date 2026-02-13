import { describe, it, expect } from 'vitest';
import { OrderItem } from '../order-item.entity';

const VALID_PROPS = {
  productId: 'product-123',
  productName: 'T-shirt Bio',
  price: 2999,
  quantity: 2,
};

function createItem(overrides = {}) {
  return OrderItem.create({ ...VALID_PROPS, ...overrides });
}

describe('OrderItem Entity', () => {
  describe('create', () => {
    it('should create an order item with valid props', () => {
      const result = createItem();

      expect(result.isSuccess).toBe(true);
      expect(result.value.productId).toBe('product-123');
      expect(result.value.productName).toBe('T-shirt Bio');
      expect(result.value.price).toBe(2999);
      expect(result.value.quantity).toBe(2);
      expect(result.value.idString).toBeDefined();
    });

    it('should create with optional variantId and variantInfo', () => {
      const result = createItem({
        variantId: 'variant-1',
        variantInfo: 'Taille M - Bleu',
        image: 'https://example.com/img.jpg',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.variantId).toBe('variant-1');
      expect(result.value.variantInfo).toBe('Taille M - Bleu');
      expect(result.value.image).toBe('https://example.com/img.jpg');
    });

    it('should return undefined for optional fields when not set', () => {
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

    it('should fail when productId is whitespace', () => {
      const result = createItem({ productId: '   ' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Product ID');
    });

    it('should fail when productName is empty', () => {
      const result = createItem({ productName: '' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nom du produit');
    });

    it('should fail when price is negative', () => {
      const result = createItem({ price: -100 });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('prix');
    });

    it('should accept zero price', () => {
      const result = createItem({ price: 0 });

      expect(result.isSuccess).toBe(true);
      expect(result.value.price).toBe(0);
    });

    it('should fail when quantity is zero', () => {
      const result = createItem({ quantity: 0 });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('quantit');
    });

    it('should fail when quantity is negative', () => {
      const result = createItem({ quantity: -1 });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('quantit');
    });
  });

  describe('subtotal', () => {
    it('should calculate subtotal correctly', () => {
      const result = createItem({ price: 1500, quantity: 3 });

      expect(result.value.subtotal).toBe(4500);
    });

    it('should return 0 subtotal for free products', () => {
      const result = createItem({ price: 0, quantity: 5 });

      expect(result.value.subtotal).toBe(0);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from persistence data', () => {
      const result = OrderItem.reconstitute({
        id: 'item-42',
        productId: 'product-1',
        productName: 'Hoodie',
        price: 5999,
        quantity: 1,
        variantId: 'v-1',
        variantInfo: 'XL Noir',
        image: 'https://example.com/hoodie.jpg',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.idString).toBe('item-42');
      expect(result.value.productId).toBe('product-1');
      expect(result.value.productName).toBe('Hoodie');
      expect(result.value.price).toBe(5999);
      expect(result.value.quantity).toBe(1);
      expect(result.value.variantId).toBe('v-1');
      expect(result.value.variantInfo).toBe('XL Noir');
      expect(result.value.image).toBe('https://example.com/hoodie.jpg');
    });

    it('should reconstitute without optional fields', () => {
      const result = OrderItem.reconstitute({
        id: 'item-43',
        productId: 'product-2',
        productName: 'Sticker',
        price: 499,
        quantity: 10,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.variantId).toBeUndefined();
      expect(result.value.variantInfo).toBeUndefined();
      expect(result.value.image).toBeUndefined();
    });
  });

  describe('equals', () => {
    it('should return true for same id', () => {
      const item1 = OrderItem.reconstitute({ id: 'same-id', ...VALID_PROPS }).value;
      const item2 = OrderItem.reconstitute({ id: 'same-id', productId: 'other', productName: 'Other', price: 100, quantity: 1 }).value;

      expect(item1.equals(item2)).toBe(true);
    });

    it('should return false for different ids', () => {
      const item1 = OrderItem.create(VALID_PROPS).value;
      const item2 = OrderItem.create(VALID_PROPS).value;

      expect(item1.equals(item2)).toBe(false);
    });
  });
});
