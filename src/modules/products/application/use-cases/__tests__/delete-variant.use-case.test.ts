import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { DeleteVariantUseCase, type DeleteVariantInput } from '../variants/delete-variant.use-case';
import type { VariantRepository } from '../../ports/variant.repository.interface';
import type { ImageUploadService } from '../../ports/image-upload.service.interface';
import { Result } from '@/shared/domain';
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
  let mockImageUploadService: {
    upload: Mock;
    delete: Mock;
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

    mockImageUploadService = {
      upload: vi.fn(),
      delete: vi.fn().mockResolvedValue(Result.ok()),
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
    mockVariantRepo.countByProductId.mockResolvedValue(2); // More than 1 variant, deletion allowed
    mockVariantRepo.delete.mockResolvedValue(undefined);

    useCase = new DeleteVariantUseCase(
      mockVariantRepo as unknown as VariantRepository,
      mockImageUploadService as unknown as ImageUploadService
    );
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

    it('should delete variant images from Cloudinary before deleting', async () => {
      // Arrange
      const variantWithImages = ProductVariant.reconstitute({
        id: 'variant-with-imgs',
        productId: 'product-123',
        name: 'Taille L',
        stock: 5,
        images: [
          'https://res.cloudinary.com/demo/image/upload/v1/kpsull/var-img1.jpg',
          'https://res.cloudinary.com/demo/image/upload/v1/kpsull/var-img2.jpg',
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value;
      mockVariantRepo.findById.mockResolvedValue(variantWithImages);

      const input: DeleteVariantInput = { id: 'variant-with-imgs' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockImageUploadService.delete).toHaveBeenCalledTimes(2);
      expect(mockImageUploadService.delete).toHaveBeenCalledWith('https://res.cloudinary.com/demo/image/upload/v1/kpsull/var-img1.jpg');
      expect(mockImageUploadService.delete).toHaveBeenCalledWith('https://res.cloudinary.com/demo/image/upload/v1/kpsull/var-img2.jpg');
    });

    it('should still delete variant if Cloudinary deletion fails', async () => {
      // Arrange
      const variantWithImages = ProductVariant.reconstitute({
        id: 'variant-with-imgs',
        productId: 'product-123',
        name: 'Taille L',
        stock: 5,
        images: ['https://res.cloudinary.com/demo/image/upload/v1/kpsull/var-img1.jpg'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value;
      mockVariantRepo.findById.mockResolvedValue(variantWithImages);
      mockImageUploadService.delete.mockResolvedValue(Result.fail('Cloudinary error'));

      const input: DeleteVariantInput = { id: 'variant-with-imgs' };

      // Act
      const result = await useCase.execute(input);

      // Assert - deletion should succeed despite Cloudinary failure
      expect(result.isSuccess).toBe(true);
      expect(mockVariantRepo.delete).toHaveBeenCalledWith('variant-with-imgs');
    });

    it('should not call Cloudinary if variant has no images', async () => {
      // Arrange - existingVariant has no images (default)
      const input: DeleteVariantInput = { id: 'variant-123' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockImageUploadService.delete).not.toHaveBeenCalled();
    });

    it('should fail when trying to delete the last variant of a product', async () => {
      // Arrange - only 1 variant remaining
      mockVariantRepo.countByProductId.mockResolvedValue(1);
      const input: DeleteVariantInput = { id: 'variant-123' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('dernière variante');
      expect(mockVariantRepo.delete).not.toHaveBeenCalled();
    });
  });
});
