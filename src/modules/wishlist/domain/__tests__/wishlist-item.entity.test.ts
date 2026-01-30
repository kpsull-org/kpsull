import { describe, it, expect } from 'vitest';
import { WishlistItem } from '../entities/wishlist-item.entity';

describe('WishlistItem Entity', () => {
  const validProps = {
    userId: 'user-123',
    productId: 'product-456',
    productName: 'Produit Test',
    productPrice: 2999,
    productImage: 'https://example.com/image.jpg',
    creatorId: 'creator-789',
    creatorName: 'Createur Test',
  };

  describe('create', () => {
    it('should create a wishlist item with valid properties', () => {
      const result = WishlistItem.create(validProps);

      expect(result.isSuccess).toBe(true);
      expect(result.value.userId).toBe('user-123');
      expect(result.value.productId).toBe('product-456');
      expect(result.value.productName).toBe('Produit Test');
      expect(result.value.productPrice).toBe(2999);
      expect(result.value.productImage).toBe('https://example.com/image.jpg');
      expect(result.value.creatorId).toBe('creator-789');
      expect(result.value.creatorName).toBe('Createur Test');
      expect(result.value.addedAt).toBeInstanceOf(Date);
    });

    it('should create a wishlist item without optional image', () => {
      const props = {
        ...validProps,
        productImage: undefined,
      };

      const result = WishlistItem.create(props);

      expect(result.isSuccess).toBe(true);
      expect(result.value.productImage).toBeUndefined();
    });

    it('should set addedAt to current date', () => {
      const before = new Date();
      const result = WishlistItem.create(validProps);
      const after = new Date();

      expect(result.isSuccess).toBe(true);
      expect(result.value.addedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.value.addedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should fail when userId is empty', () => {
      const props = { ...validProps, userId: '' };

      const result = WishlistItem.create(props);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('User ID');
    });

    it('should fail when userId is only whitespace', () => {
      const props = { ...validProps, userId: '   ' };

      const result = WishlistItem.create(props);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('User ID');
    });

    it('should fail when productId is empty', () => {
      const props = { ...validProps, productId: '' };

      const result = WishlistItem.create(props);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Product ID');
    });

    it('should fail when productName is empty', () => {
      const props = { ...validProps, productName: '' };

      const result = WishlistItem.create(props);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nom du produit');
    });

    it('should fail when productPrice is negative', () => {
      const props = { ...validProps, productPrice: -100 };

      const result = WishlistItem.create(props);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('prix');
    });

    it('should accept zero price (free products)', () => {
      const props = { ...validProps, productPrice: 0 };

      const result = WishlistItem.create(props);

      expect(result.isSuccess).toBe(true);
      expect(result.value.productPrice).toBe(0);
    });

    it('should fail when creatorId is empty', () => {
      const props = { ...validProps, creatorId: '' };

      const result = WishlistItem.create(props);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should fail when creatorName is empty', () => {
      const props = { ...validProps, creatorName: '' };

      const result = WishlistItem.create(props);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nom du createur');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a wishlist item from persistence data', () => {
      const persistenceData = {
        id: 'wishlist-item-id-123',
        userId: 'user-123',
        productId: 'product-456',
        productName: 'Produit Test',
        productPrice: 2999,
        productImage: 'https://example.com/image.jpg',
        creatorId: 'creator-789',
        creatorName: 'Createur Test',
        addedAt: new Date('2024-01-15T10:30:00Z'),
      };

      const result = WishlistItem.reconstitute(persistenceData);

      expect(result.isSuccess).toBe(true);
      expect(result.value.idString).toBe('wishlist-item-id-123');
      expect(result.value.userId).toBe('user-123');
      expect(result.value.productId).toBe('product-456');
      expect(result.value.addedAt).toEqual(new Date('2024-01-15T10:30:00Z'));
    });
  });

  describe('uniqueKey', () => {
    it('should return a unique key based on userId and productId', () => {
      const result = WishlistItem.create(validProps);

      expect(result.isSuccess).toBe(true);
      expect(result.value.uniqueKey).toBe('user-123:product-456');
    });
  });

  describe('equals', () => {
    it('should return true for items with same id', () => {
      const item1 = WishlistItem.reconstitute({
        id: 'same-id',
        ...validProps,
        addedAt: new Date(),
      }).value;

      const item2 = WishlistItem.reconstitute({
        id: 'same-id',
        ...validProps,
        productName: 'Different name',
        addedAt: new Date(),
      }).value;

      expect(item1.equals(item2)).toBe(true);
    });

    it('should return false for items with different id', () => {
      const item1 = WishlistItem.create(validProps).value;
      const item2 = WishlistItem.create(validProps).value;

      expect(item1.equals(item2)).toBe(false);
    });
  });
});
