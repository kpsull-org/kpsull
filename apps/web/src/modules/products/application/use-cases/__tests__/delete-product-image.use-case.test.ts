import { describe, it, expect, beforeEach, type Mock, vi } from 'vitest';
import { DeleteProductImageUseCase } from '../images/delete-product-image.use-case';
import { ImageUploadService } from '../../ports/image-upload.service.interface';
import { ProductImageRepository } from '../../ports/product-image.repository.interface';
import { Result } from '@/shared/domain';
import { ProductImage } from '../../../domain/entities/product-image.entity';

describe('DeleteProductImageUseCase', () => {
  let useCase: DeleteProductImageUseCase;
  let mockImageUploadService: {
    upload: Mock;
    delete: Mock;
  };
  let mockProductImageRepository: {
    findById: Mock;
    findByProductId: Mock;
    save: Mock;
    saveMany: Mock;
    delete: Mock;
    countByProductId: Mock;
  };

  const createMockProductImage = (overrides: Partial<{
    id: string;
    productId: string;
    url: string;
    position: number;
  }> = {}) => {
    return ProductImage.reconstitute({
      id: overrides.id ?? 'image-123',
      productId: overrides.productId ?? 'product-456',
      url: overrides.url ?? 'https://cdn.example.com/image.jpg',
      urlType: 'product',
      alt: 'Test image',
      position: overrides.position ?? 0,
      createdAt: new Date(),
    }).value!;
  };

  beforeEach(() => {
    mockImageUploadService = {
      upload: vi.fn(),
      delete: vi.fn(),
    };

    mockProductImageRepository = {
      findById: vi.fn(),
      findByProductId: vi.fn(),
      save: vi.fn(),
      saveMany: vi.fn(),
      delete: vi.fn(),
      countByProductId: vi.fn(),
    };

    useCase = new DeleteProductImageUseCase(
      mockImageUploadService as ImageUploadService,
      mockProductImageRepository as ProductImageRepository
    );
  });

  describe('execute', () => {
    it('should delete an image successfully', async () => {
      // Arrange
      const mockImage = createMockProductImage();
      mockProductImageRepository.findById.mockResolvedValue(mockImage);
      mockImageUploadService.delete.mockResolvedValue(Result.ok());
      mockProductImageRepository.delete.mockResolvedValue(undefined);
      mockProductImageRepository.findByProductId.mockResolvedValue([]);

      // Act
      const result = await useCase.execute({ imageId: 'image-123' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockImageUploadService.delete).toHaveBeenCalledWith(
        'https://cdn.example.com/image.jpg'
      );
      expect(mockProductImageRepository.delete).toHaveBeenCalledWith('image-123');
    });

    it('should reorder remaining images after deletion', async () => {
      // Arrange
      const imageToDelete = createMockProductImage({ id: 'image-1', position: 0 });
      const remainingImage1 = createMockProductImage({ id: 'image-2', position: 1 });
      const remainingImage2 = createMockProductImage({ id: 'image-3', position: 2 });

      mockProductImageRepository.findById.mockResolvedValue(imageToDelete);
      mockImageUploadService.delete.mockResolvedValue(Result.ok());
      mockProductImageRepository.delete.mockResolvedValue(undefined);
      mockProductImageRepository.findByProductId.mockResolvedValue([
        remainingImage1,
        remainingImage2,
      ]);
      mockProductImageRepository.saveMany.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute({ imageId: 'image-1' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockProductImageRepository.saveMany).toHaveBeenCalled();
      // Check that positions were updated
      const savedImages = mockProductImageRepository.saveMany.mock.calls[0]?.[0] as ProductImage[];
      expect(savedImages?.[0]?.position).toBe(0);
      expect(savedImages?.[1]?.position).toBe(1);
    });

    it('should fail when image is not found', async () => {
      // Arrange
      mockProductImageRepository.findById.mockResolvedValue(null);

      // Act
      const result = await useCase.execute({ imageId: 'non-existent' });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Image non trouvée');
    });

    it('should still delete from database if storage deletion fails', async () => {
      // Arrange
      const mockImage = createMockProductImage();
      mockProductImageRepository.findById.mockResolvedValue(mockImage);
      mockImageUploadService.delete.mockResolvedValue(
        Result.fail('Storage error')
      );
      mockProductImageRepository.delete.mockResolvedValue(undefined);
      mockProductImageRepository.findByProductId.mockResolvedValue([]);

      // Act
      const result = await useCase.execute({ imageId: 'image-123' });

      // Assert
      // Should still succeed - we log the error but don't fail the operation
      expect(result.isSuccess).toBe(true);
      expect(mockProductImageRepository.delete).toHaveBeenCalledWith('image-123');
    });

    it('should not reorder if no remaining images', async () => {
      // Arrange
      const mockImage = createMockProductImage();
      mockProductImageRepository.findById.mockResolvedValue(mockImage);
      mockImageUploadService.delete.mockResolvedValue(Result.ok());
      mockProductImageRepository.delete.mockResolvedValue(undefined);
      mockProductImageRepository.findByProductId.mockResolvedValue([]);

      // Act
      const result = await useCase.execute({ imageId: 'image-123' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockProductImageRepository.saveMany).not.toHaveBeenCalled();
    });

    it('should fail when imageId is empty', async () => {
      // Act
      const result = await useCase.execute({ imageId: '' });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('ID');
    });
  });
});
