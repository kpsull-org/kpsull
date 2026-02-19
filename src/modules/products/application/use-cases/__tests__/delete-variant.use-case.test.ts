import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { DeleteVariantUseCase, type DeleteVariantInput } from '../variants/delete-variant.use-case';
import type { VariantRepository } from '../../ports/variant.repository.interface';
import { ProductVariant } from '../../../domain/entities/product-variant.entity';

describe('DeleteVariantUseCase', () => {
  let useCase: DeleteVariantUseCase;
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
      stock: 10,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    }).value;

    mockVariantRepo.findById.mockResolvedValue(existingVariant);
    mockVariantRepo.delete.mockResolvedValue(undefined);

    useCase = new DeleteVariantUseCase(mockVariantRepo as unknown as VariantRepository);
  });

  describe('execute', () => {
    it('should delete a variant successfully', async () => {
      // Arrange
      const input: DeleteVariantInput = {
        id: 'variant-123',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockVariantRepo.delete).toHaveBeenCalledWith('variant-123');
    });

    it('should fail when variant does not exist', async () => {
      // Arrange
      mockVariantRepo.findById.mockResolvedValue(null);

      const input: DeleteVariantInput = {
        id: 'nonexistent-variant',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('variante');
      expect(mockVariantRepo.delete).not.toHaveBeenCalled();
    });

    it('should return deleted variant info', async () => {
      // Arrange
      const input: DeleteVariantInput = {
        id: 'variant-123',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBe('variant-123');
      expect(result.value.name).toBe('Taille M');
      expect(result.value.productId).toBe('product-123');
    });

    it('should call repository delete method', async () => {
      // Arrange
      const input: DeleteVariantInput = {
        id: 'variant-123',
      };

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockVariantRepo.delete).toHaveBeenCalledTimes(1);
      expect(mockVariantRepo.delete).toHaveBeenCalledWith('variant-123');
    });

    it('should find variant before deleting', async () => {
      // Arrange
      const input: DeleteVariantInput = {
        id: 'variant-123',
      };

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockVariantRepo.findById).toHaveBeenCalledWith('variant-123');
      expect(mockVariantRepo.findById).toHaveBeenCalledBefore(mockVariantRepo.delete);
    });
  });
});
