import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { UpdateVariantUseCase, type UpdateVariantInput } from '../variants/update-variant.use-case';
import type { VariantRepository } from '../../ports/variant.repository.interface';
import { ProductVariant } from '../../../domain/entities/product-variant.entity';

describe('UpdateVariantUseCase', () => {
  let useCase: UpdateVariantUseCase;
  let mockVariantRepo: {
    findById: Mock;
    findByProductId: Mock;
    save: Mock;
    delete: Mock;
    countByProductId: Mock;
  };
  let existingVariant: ProductVariant;

  beforeEach(() => {
    mockVariantRepo = {
      findById: vi.fn(),
      findByProductId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      countByProductId: vi.fn(),
    };

    // Create an existing variant for tests
    existingVariant = ProductVariant.reconstitute({
      id: 'variant-123',
      productId: 'product-123',
      name: 'Taille M',
      priceOverrideAmount: 2999,
      priceOverrideCurrency: 'EUR',
      stock: 10,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    }).value;

    mockVariantRepo.findById.mockResolvedValue(existingVariant);
    mockVariantRepo.save.mockResolvedValue(undefined);

    useCase = new UpdateVariantUseCase(mockVariantRepo as unknown as VariantRepository);
  });

  describe('execute', () => {
    it('should update variant name successfully', async () => {
      // Arrange
      const input: UpdateVariantInput = {
        id: 'variant-123',
        name: 'Taille L',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.name).toBe('Taille L');
      expect(mockVariantRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should update variant stock successfully', async () => {
      // Arrange
      const input: UpdateVariantInput = {
        id: 'variant-123',
        stock: 25,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.stock).toBe(25);
      expect(result.value.isAvailable).toBe(true);
    });

    it('should update variant price override successfully', async () => {
      // Arrange
      const input: UpdateVariantInput = {
        id: 'variant-123',
        priceOverride: 49.99,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.priceOverride).toBe(49.99);
    });

    it('should remove price override when set to null', async () => {
      // Arrange
      const input: UpdateVariantInput = {
        id: 'variant-123',
        removePriceOverride: true,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.priceOverride).toBeUndefined();
    });

    it('should update multiple fields at once', async () => {
      // Arrange
      const input: UpdateVariantInput = {
        id: 'variant-123',
        name: 'Taille XL',
        stock: 30,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.name).toBe('Taille XL');
      expect(result.value.stock).toBe(30);
    });

    it('should fail when variant does not exist', async () => {
      // Arrange
      mockVariantRepo.findById.mockResolvedValue(null);

      const input: UpdateVariantInput = {
        id: 'nonexistent-variant',
        name: 'Taille L',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('variante');
      expect(mockVariantRepo.save).not.toHaveBeenCalled();
    });

    it('should fail when updating to empty name', async () => {
      // Arrange
      const input: UpdateVariantInput = {
        id: 'variant-123',
        name: '',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nom');
    });

    it('should fail when updating to negative stock', async () => {
      // Arrange
      const input: UpdateVariantInput = {
        id: 'variant-123',
        stock: -5,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('négatif');
    });

    it('should update stock to zero and mark as unavailable', async () => {
      // Arrange
      const input: UpdateVariantInput = {
        id: 'variant-123',
        stock: 0,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.stock).toBe(0);
      expect(result.value.isAvailable).toBe(false);
    });

  });
});
