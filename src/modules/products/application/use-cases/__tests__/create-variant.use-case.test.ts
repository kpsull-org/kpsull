import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { CreateVariantUseCase, type CreateVariantInput } from '../variants/create-variant.use-case';
import type { VariantRepository } from '../../ports/variant.repository.interface';
import type { ProductRepository } from '../../ports/product.repository.interface';
import { Product } from '../../../domain/entities/product.entity';

describe('CreateVariantUseCase', () => {
  let useCase: CreateVariantUseCase;
  let mockVariantRepo: {
    findById: Mock;
    findByProductId: Mock;
    save: Mock;
    delete: Mock;
    countByProductId: Mock;
  };
  let mockProductRepo: {
    findById: Mock;
    findByCreatorId: Mock;
    save: Mock;
    delete: Mock;
    countByCreatorId: Mock;
  };
  let validProduct: Product;

  beforeEach(() => {
    mockVariantRepo = {
      findById: vi.fn(),
      findByProductId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      countByProductId: vi.fn(),
    };

    mockProductRepo = {
      findById: vi.fn(),
      findByCreatorId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      countByCreatorId: vi.fn(),
    };

    // Create a valid product for tests
    validProduct = Product.reconstitute({
      id: 'product-123',
      creatorId: 'creator-123',
      name: 'Mon Produit',
      priceAmount: 2999,
      priceCurrency: 'EUR',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).value;

    mockProductRepo.findById.mockResolvedValue(validProduct);
    mockVariantRepo.save.mockResolvedValue(undefined);

    useCase = new CreateVariantUseCase(
      mockVariantRepo as unknown as VariantRepository,
      mockProductRepo as unknown as ProductRepository
    );
  });

  describe('execute', () => {
    it('should create a variant successfully', async () => {
      // Arrange
      const input: CreateVariantInput = {
        productId: 'product-123',
        name: 'Taille M',
        stock: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.name).toBe('Taille M');
      expect(result.value.stock).toBe(10);
      expect(result.value.productId).toBe('product-123');
      expect(mockVariantRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should create a variant with optional price override', async () => {
      // Arrange
      const input: CreateVariantInput = {
        productId: 'product-123',
        name: 'Version Premium',
        stock: 3,
        priceOverride: 39.99,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.priceOverride).toBe(39.99);
    });

    it('should fail when product does not exist', async () => {
      // Arrange
      mockProductRepo.findById.mockResolvedValue(null);

      const input: CreateVariantInput = {
        productId: 'nonexistent-product',
        name: 'Taille M',
        stock: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('produit');
      expect(mockVariantRepo.save).not.toHaveBeenCalled();
    });

    it('should fail when name is empty', async () => {
      // Arrange
      const input: CreateVariantInput = {
        productId: 'product-123',
        name: '',
        stock: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nom');
    });

    it('should fail when stock is negative', async () => {
      // Arrange
      const input: CreateVariantInput = {
        productId: 'product-123',
        name: 'Taille M',
        stock: -5,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('négatif');
    });

    it('should return variant with generated ID', async () => {
      // Arrange
      const input: CreateVariantInput = {
        productId: 'product-123',
        name: 'Taille M',
        stock: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBeDefined();
      expect(result.value.id.length).toBeGreaterThan(0);
    });

    it('should create variant with zero stock', async () => {
      // Arrange
      const input: CreateVariantInput = {
        productId: 'product-123',
        name: 'En rupture',
        stock: 0,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.stock).toBe(0);
      expect(result.value.isAvailable).toBe(false);
    });

    it('should fail when priceOverride is negative', async () => {
      // Arrange
      const input: CreateVariantInput = {
        productId: 'product-123',
        name: 'Taille M',
        stock: 10,
        priceOverride: -1,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(mockVariantRepo.save).not.toHaveBeenCalled();
    });
  });
});
