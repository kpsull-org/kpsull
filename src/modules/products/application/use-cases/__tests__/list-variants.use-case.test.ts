import { describe, it, expect, beforeEach } from 'vitest';
import { ListVariantsUseCase, type ListVariantsInput } from '../variants/list-variants.use-case';
import type { VariantRepository } from '../../ports/variant.repository.interface';
import type { ProductRepository } from '../../ports/product.repository.interface';
import { ProductVariant } from '../../../domain/entities/product-variant.entity';
import {
  createMockVariantRepo,
  createMockProductRepo,
  createValidTestProduct,
  type MockVariantRepo,
  type MockProductRepo,
} from './variant-test.helpers';

describe('ListVariantsUseCase', () => {
  let useCase: ListVariantsUseCase;
  let mockVariantRepo: MockVariantRepo;
  let mockProductRepo: MockProductRepo;

  beforeEach(() => {
    mockVariantRepo = createMockVariantRepo();
    mockProductRepo = createMockProductRepo();

    const validProduct = createValidTestProduct();
    mockProductRepo.findById.mockResolvedValue(validProduct);
    mockVariantRepo.findByProductId.mockResolvedValue([]);

    useCase = new ListVariantsUseCase(
      mockVariantRepo as unknown as VariantRepository,
      mockProductRepo as unknown as ProductRepository
    );
  });

  function createSimpleVariant(id: string, name: string, stock: number) {
    return ProductVariant.reconstitute({
      id,
      productId: 'product-123',
      name,
      stock,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).value;
  }

  describe('execute', () => {
    it('should list variants for a product successfully', async () => {
      // Arrange
      const testVariants = [
        createSimpleVariant('variant-1', 'Taille S', 5),
        createSimpleVariant('variant-2', 'Taille M', 10),
      ];

      mockVariantRepo.findByProductId.mockResolvedValue(testVariants);

      const input: ListVariantsInput = {
        productId: 'product-123',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      const resultVariants = result.value?.variants ?? [];
      expect(resultVariants).toHaveLength(2);
      expect(resultVariants[0]?.name).toBe('Taille S');
      expect(resultVariants[1]?.name).toBe('Taille M');
    });

    it('should return empty list when no variants exist', async () => {
      // Arrange
      mockVariantRepo.findByProductId.mockResolvedValue([]);

      const input: ListVariantsInput = {
        productId: 'product-123',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.variants).toHaveLength(0);
      expect(result.value.total).toBe(0);
    });

    it('should fail when product does not exist', async () => {
      // Arrange
      mockProductRepo.findById.mockResolvedValue(null);

      const input: ListVariantsInput = {
        productId: 'nonexistent-product',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('produit');
    });

    it('should return variants with all properties', async () => {
      // Arrange
      const variant = ProductVariant.reconstitute({
        id: 'variant-1',
        productId: 'product-123',
        name: 'Version Premium',
        priceOverrideAmount: 3999,
        priceOverrideCurrency: 'EUR',
        stock: 15,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      }).value;

      mockVariantRepo.findByProductId.mockResolvedValue([variant]);

      const input: ListVariantsInput = {
        productId: 'product-123',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      const variants = result.value?.variants ?? [];
      expect(variants[0]).toEqual({
        id: 'variant-1',
        productId: 'product-123',
        name: 'Version Premium',
        priceOverride: 39.99,
        stock: 15,
        isAvailable: true,
        color: undefined,
        colorCode: undefined,
        images: [],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should return total count of variants', async () => {
      // Arrange
      const variants = [
        createSimpleVariant('variant-1', 'Taille S', 5),
        createSimpleVariant('variant-2', 'Taille M', 10),
        createSimpleVariant('variant-3', 'Taille L', 8),
      ];

      mockVariantRepo.findByProductId.mockResolvedValue(variants);

      const input: ListVariantsInput = {
        productId: 'product-123',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.total).toBe(3);
    });

    it('should return variants without price override as undefined', async () => {
      // Arrange
      const variant = createSimpleVariant('variant-1', 'Taille S', 5);

      mockVariantRepo.findByProductId.mockResolvedValue([variant]);

      const input: ListVariantsInput = {
        productId: 'product-123',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      const variants = result.value?.variants ?? [];
      expect(variants[0]?.priceOverride).toBeUndefined();
    });

    it('should indicate variant availability based on stock', async () => {
      // Arrange
      const variants = [
        createSimpleVariant('variant-1', 'En stock', 10),
        createSimpleVariant('variant-2', 'Rupture', 0),
      ];

      mockVariantRepo.findByProductId.mockResolvedValue(variants);

      const input: ListVariantsInput = {
        productId: 'product-123',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      const variantsList = result.value?.variants ?? [];
      expect(variantsList[0]?.isAvailable).toBe(true);
      expect(variantsList[1]?.isAvailable).toBe(false);
    });
  });
});
