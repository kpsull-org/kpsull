import { describe, it, expect, beforeEach, type Mock, vi } from 'vitest';
import { ReorderProductImagesUseCase } from '../images/reorder-product-images.use-case';
import { ProductImageRepository } from '../../ports/product-image.repository.interface';
import { ProductImage } from '../../../domain/entities/product-image.entity';

describe('ReorderProductImagesUseCase', () => {
  let useCase: ReorderProductImagesUseCase;
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
    position: number;
  }> = {}) => {
    return ProductImage.reconstitute({
      id: overrides.id ?? 'image-123',
      productId: overrides.productId ?? 'product-456',
      url: 'https://cdn.example.com/image.jpg',
      urlType: 'product',
      alt: 'Test image',
      position: overrides.position ?? 0,
      createdAt: new Date(),
    }).value!;
  };

  beforeEach(() => {
    mockProductImageRepository = {
      findById: vi.fn(),
      findByProductId: vi.fn(),
      save: vi.fn(),
      saveMany: vi.fn(),
      delete: vi.fn(),
      countByProductId: vi.fn(),
    };

    useCase = new ReorderProductImagesUseCase(
      mockProductImageRepository as ProductImageRepository
    );
  });

  describe('execute', () => {
    it('should reorder images successfully', async () => {
      // Arrange
      const image1 = createMockProductImage({ id: 'img-1', productId: 'product-1', position: 0 });
      const image2 = createMockProductImage({ id: 'img-2', productId: 'product-1', position: 1 });
      const image3 = createMockProductImage({ id: 'img-3', productId: 'product-1', position: 2 });

      mockProductImageRepository.findByProductId.mockResolvedValue([image1, image2, image3]);
      mockProductImageRepository.saveMany.mockResolvedValue(undefined);

      const input = {
        productId: 'product-1',
        imageIds: ['img-3', 'img-1', 'img-2'], // New order
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockProductImageRepository.saveMany).toHaveBeenCalled();

      const savedImages = mockProductImageRepository.saveMany.mock.calls[0]?.[0] as ProductImage[];
      expect(savedImages).toHaveLength(3);

      // Find each image and check its new position
      const savedImg3 = savedImages.find((img: ProductImage) => img.idString === 'img-3');
      const savedImg1 = savedImages.find((img: ProductImage) => img.idString === 'img-1');
      const savedImg2 = savedImages.find((img: ProductImage) => img.idString === 'img-2');

      expect(savedImg3?.position).toBe(0);
      expect(savedImg1?.position).toBe(1);
      expect(savedImg2?.position).toBe(2);
    });

    it('should return the new order in output', async () => {
      // Arrange
      const image1 = createMockProductImage({ id: 'img-1', productId: 'product-1', position: 0 });
      const image2 = createMockProductImage({ id: 'img-2', productId: 'product-1', position: 1 });

      mockProductImageRepository.findByProductId.mockResolvedValue([image1, image2]);
      mockProductImageRepository.saveMany.mockResolvedValue(undefined);

      const input = {
        productId: 'product-1',
        imageIds: ['img-2', 'img-1'],
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      const images = result.value?.images;
      expect(images).toHaveLength(2);
      expect(images?.[0]?.id).toBe('img-2');
      expect(images?.[0]?.position).toBe(0);
      expect(images?.[1]?.id).toBe('img-1');
      expect(images?.[1]?.position).toBe(1);
    });

    it('should fail when productId is empty', async () => {
      // Act
      const result = await useCase.execute({
        productId: '',
        imageIds: ['img-1', 'img-2'],
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Product ID');
    });

    it('should fail when imageIds is empty', async () => {
      // Act
      const result = await useCase.execute({
        productId: 'product-1',
        imageIds: [],
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('images');
    });

    it('should fail when imageIds count does not match existing images', async () => {
      // Arrange
      const image1 = createMockProductImage({ id: 'img-1', productId: 'product-1' });
      const image2 = createMockProductImage({ id: 'img-2', productId: 'product-1' });

      mockProductImageRepository.findByProductId.mockResolvedValue([image1, image2]);

      const input = {
        productId: 'product-1',
        imageIds: ['img-1'], // Missing img-2
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('correspond');
    });

    it('should fail when an imageId does not belong to the product', async () => {
      // Arrange
      const image1 = createMockProductImage({ id: 'img-1', productId: 'product-1' });
      const image2 = createMockProductImage({ id: 'img-2', productId: 'product-1' });

      mockProductImageRepository.findByProductId.mockResolvedValue([image1, image2]);

      const input = {
        productId: 'product-1',
        imageIds: ['img-1', 'img-unknown'], // img-unknown doesn't exist
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('img-unknown');
    });

    it('should fail when product has no images', async () => {
      // Arrange
      mockProductImageRepository.findByProductId.mockResolvedValue([]);

      // Act
      const result = await useCase.execute({
        productId: 'product-1',
        imageIds: ['img-1'],
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('aucune image');
    });
  });
});
