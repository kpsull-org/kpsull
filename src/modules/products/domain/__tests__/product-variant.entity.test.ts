import { describe, it, expect } from 'vitest';
import { ProductVariant } from '../entities/product-variant.entity';
import { Money } from '../value-objects/money.vo';

describe('ProductVariant Entity', () => {
  describe('create', () => {
    it('should create a valid variant with required fields', () => {
      // Arrange
      const props = {
        productId: 'product-123',
        name: 'Taille M',
        stock: 10,
      };

      // Act
      const result = ProductVariant.create(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.productId).toBe('product-123');
      expect(result.value.name).toBe('Taille M');
      expect(result.value.stock).toBe(10);
      expect(result.value.isAvailable).toBe(true);
    });

    it('should create a variant with optional priceOverride', () => {
      // Arrange
      const priceOverride = Money.fromCents(1999, 'EUR');
      const props = {
        productId: 'product-123',
        name: 'Version Premium',
        stock: 3,
        priceOverride,
      };

      // Act
      const result = ProductVariant.create(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.priceOverride).toBeDefined();
      expect(result.value.priceOverride!.amount).toBe(1999);
    });

    it('should create a variant with zero stock', () => {
      // Arrange
      const props = {
        productId: 'product-123',
        name: 'Rupture de stock',
        stock: 0,
      };

      // Act
      const result = ProductVariant.create(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.stock).toBe(0);
      expect(result.value.isAvailable).toBe(false);
    });

    it('should fail when productId is empty', () => {
      // Arrange
      const props = {
        productId: '',
        name: 'Taille M',
        stock: 10,
      };

      // Act
      const result = ProductVariant.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Product ID');
    });

    it('should fail when name is empty', () => {
      // Arrange
      const props = {
        productId: 'product-123',
        name: '',
        stock: 10,
      };

      // Act
      const result = ProductVariant.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nom');
    });

    it('should fail when name is only whitespace', () => {
      // Arrange
      const props = {
        productId: 'product-123',
        name: '   ',
        stock: 10,
      };

      // Act
      const result = ProductVariant.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nom');
    });

    it('should fail when name exceeds 100 characters', () => {
      // Arrange
      const props = {
        productId: 'product-123',
        name: 'a'.repeat(101),
        stock: 10,
      };

      // Act
      const result = ProductVariant.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('100');
    });

    it('should fail when stock is negative', () => {
      // Arrange
      const props = {
        productId: 'product-123',
        name: 'Taille M',
        stock: -5,
      };

      // Act
      const result = ProductVariant.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('négatif');
    });

    it('should trim name on creation', () => {
      // Arrange
      const props = {
        productId: 'product-123',
        name: '  Taille M  ',
        stock: 10,
      };

      // Act
      const result = ProductVariant.create(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.name).toBe('Taille M');
    });

    it('should set timestamps on creation', () => {
      // Arrange
      const props = {
        productId: 'product-123',
        name: 'Taille M',
        stock: 10,
      };

      // Act
      const result = ProductVariant.create(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.createdAt).toBeDefined();
      expect(result.value.updatedAt).toBeDefined();
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a variant from persistence', () => {
      // Arrange
      const props = {
        id: 'variant-123',
        productId: 'product-123',
        name: 'Taille L',
        priceOverrideAmount: 2999,
        priceOverrideCurrency: 'EUR',
        stock: 15,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      // Act
      const result = ProductVariant.reconstitute(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.idString).toBe('variant-123');
      expect(result.value.name).toBe('Taille L');
      expect(result.value.priceOverride!.amount).toBe(2999);
      expect(result.value.stock).toBe(15);
    });

    it('should reconstitute a variant without priceOverride', () => {
      // Arrange
      const props = {
        id: 'variant-123',
        productId: 'product-123',
        name: 'Taille S',
        stock: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      // Act
      const result = ProductVariant.reconstitute(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.priceOverride).toBeUndefined();
    });
  });

  describe('updateStock', () => {
    it('should update stock successfully', () => {
      // Arrange
      const variant = ProductVariant.create({
        productId: 'product-123',
        name: 'Taille M',
        stock: 10,
      }).value;

      // Act
      const result = variant.updateStock(20);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(variant.stock).toBe(20);
      expect(variant.isAvailable).toBe(true);
    });

    it('should update stock to zero and mark unavailable', () => {
      // Arrange
      const variant = ProductVariant.create({
        productId: 'product-123',
        name: 'Taille M',
        stock: 10,
      }).value;

      // Act
      const result = variant.updateStock(0);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(variant.stock).toBe(0);
      expect(variant.isAvailable).toBe(false);
    });

    it('should fail when updating to negative stock', () => {
      // Arrange
      const variant = ProductVariant.create({
        productId: 'product-123',
        name: 'Taille M',
        stock: 10,
      }).value;

      // Act
      const result = variant.updateStock(-5);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('négatif');
    });

    it('should update updatedAt when stock changes', () => {
      // Arrange
      const variant = ProductVariant.create({
        productId: 'product-123',
        name: 'Taille M',
        stock: 10,
      }).value;
      const originalUpdatedAt = variant.updatedAt;

      // Wait a bit to ensure time difference
      // Act
      const result = variant.updateStock(15);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(variant.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });

  describe('updatePrice', () => {
    it('should update price override successfully', () => {
      // Arrange
      const variant = ProductVariant.create({
        productId: 'product-123',
        name: 'Taille M',
        stock: 10,
      }).value;
      const newPrice = Money.fromCents(2999, 'EUR');

      // Act
      variant.updatePrice(newPrice);

      // Assert
      expect(variant.priceOverride).toBeDefined();
      expect(variant.priceOverride!.amount).toBe(2999);
    });

    it('should remove price override when undefined is passed', () => {
      // Arrange
      const priceOverride = Money.fromCents(1999, 'EUR');
      const variant = ProductVariant.create({
        productId: 'product-123',
        name: 'Version Premium',
        stock: 3,
        priceOverride,
      }).value;

      // Act
      variant.updatePrice(undefined);

      // Assert
      expect(variant.priceOverride).toBeUndefined();
    });

    it('should update updatedAt when price changes', () => {
      // Arrange
      const variant = ProductVariant.create({
        productId: 'product-123',
        name: 'Taille M',
        stock: 10,
      }).value;
      const originalUpdatedAt = variant.updatedAt;
      const newPrice = Money.fromCents(2999, 'EUR');

      // Act
      variant.updatePrice(newPrice);

      // Assert
      expect(variant.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });

  describe('disable', () => {
    it('should disable an available variant', () => {
      // Arrange
      const variant = ProductVariant.create({
        productId: 'product-123',
        name: 'Taille M',
        stock: 10,
      }).value;

      // Act
      const result = variant.disable();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(variant.stock).toBe(0);
      expect(variant.isAvailable).toBe(false);
    });

    it('should succeed even if already disabled', () => {
      // Arrange
      const variant = ProductVariant.create({
        productId: 'product-123',
        name: 'Taille M',
        stock: 0,
      }).value;

      // Act
      const result = variant.disable();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(variant.stock).toBe(0);
      expect(variant.isAvailable).toBe(false);
    });

    it('should update updatedAt when disabled', () => {
      // Arrange
      const variant = ProductVariant.create({
        productId: 'product-123',
        name: 'Taille M',
        stock: 10,
      }).value;
      const originalUpdatedAt = variant.updatedAt;

      // Act
      variant.disable();

      // Assert
      expect(variant.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });

  describe('updateName', () => {
    it('should update name successfully', () => {
      // Arrange
      const variant = ProductVariant.create({
        productId: 'product-123',
        name: 'Taille M',
        stock: 10,
      }).value;

      // Act
      const result = variant.updateName('Taille L');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(variant.name).toBe('Taille L');
    });

    it('should fail when name is empty', () => {
      // Arrange
      const variant = ProductVariant.create({
        productId: 'product-123',
        name: 'Taille M',
        stock: 10,
      }).value;

      // Act
      const result = variant.updateName('');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nom');
    });

    it('should fail when name exceeds 100 characters', () => {
      // Arrange
      const variant = ProductVariant.create({
        productId: 'product-123',
        name: 'Taille M',
        stock: 10,
      }).value;

      // Act
      const result = variant.updateName('a'.repeat(101));

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('100');
    });

    it('should trim name on update', () => {
      // Arrange
      const variant = ProductVariant.create({
        productId: 'product-123',
        name: 'Taille M',
        stock: 10,
      }).value;

      // Act
      const result = variant.updateName('  Taille L  ');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(variant.name).toBe('Taille L');
    });
  });

  describe('computed properties', () => {
    it('should be available when stock > 0', () => {
      // Arrange
      const variant = ProductVariant.create({
        productId: 'product-123',
        name: 'Taille M',
        stock: 1,
      }).value;

      // Assert
      expect(variant.isAvailable).toBe(true);
    });

    it('should not be available when stock = 0', () => {
      // Arrange
      const variant = ProductVariant.create({
        productId: 'product-123',
        name: 'Taille M',
        stock: 0,
      }).value;

      // Assert
      expect(variant.isAvailable).toBe(false);
    });

    it('should have hasPriceOverride true when priceOverride is set', () => {
      // Arrange
      const priceOverride = Money.fromCents(1999, 'EUR');
      const variant = ProductVariant.create({
        productId: 'product-123',
        name: 'Version Premium',
        stock: 3,
        priceOverride,
      }).value;

      // Assert
      expect(variant.hasPriceOverride).toBe(true);
    });

    it('should have hasPriceOverride false when priceOverride is not set', () => {
      // Arrange
      const variant = ProductVariant.create({
        productId: 'product-123',
        name: 'Taille M',
        stock: 10,
      }).value;

      // Assert
      expect(variant.hasPriceOverride).toBe(false);
    });
  });
});
