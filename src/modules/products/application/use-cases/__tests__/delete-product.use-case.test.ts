import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { DeleteProductUseCase, type DeleteProductInput } from '../products/delete-product.use-case';
import type { ProductRepository } from '../../ports/product.repository.interface';
import type { ProductImageRepository } from '../../ports/product-image.repository.interface';
import type { VariantRepository } from '../../ports/variant.repository.interface';
import type { ImageUploadService } from '../../ports/image-upload.service.interface';
import { Result } from '@/shared/domain';
import { TestProductRepository } from '../../../__tests__/helpers/test-product.repository';
import { Product } from '../../../domain/entities/product.entity';
import { ProductImage } from '../../../domain/entities/product-image.entity';
import { ProductVariant } from '../../../domain/entities/product-variant.entity';

function createProduct(overrides: Partial<{ id: string; creatorId: string }> = {}): Product {
  return Product.reconstitute({
    id: overrides.id ?? 'product-123',
    creatorId: overrides.creatorId ?? 'creator-123',
    name: 'Mon Produit',
    priceAmount: 2999,
    priceCurrency: 'EUR',
    status: 'DRAFT',
    createdAt: new Date(),
    updatedAt: new Date(),
  }).value;
}

function createProductImage(overrides: Partial<{ id: string; url: string }> = {}): ProductImage {
  return ProductImage.reconstitute({
    id: overrides.id ?? 'image-123',
    productId: 'product-123',
    url: overrides.url ?? 'https://res.cloudinary.com/demo/image/upload/v1/kpsull/products/image.jpg',
    urlType: 'product',
    alt: 'Test image',
    position: 0,
    createdAt: new Date(),
  }).value;
}

function createVariant(overrides: Partial<{ id: string; images: string[] }> = {}): ProductVariant {
  return ProductVariant.reconstitute({
    id: overrides.id ?? 'variant-123',
    productId: 'product-123',
    name: 'Taille M',
    stock: 10,
    images: overrides.images ?? [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }).value;
}

describe('DeleteProductUseCase', () => {
  let useCase: DeleteProductUseCase;
  let productRepo: TestProductRepository;
  let mockProductImageRepo: {
    findById: Mock;
    findByProductId: Mock;
    save: Mock;
    saveMany: Mock;
    delete: Mock;
    countByProductId: Mock;
  };
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

  beforeEach(() => {
    productRepo = new TestProductRepository();

    mockProductImageRepo = {
      findById: vi.fn(),
      findByProductId: vi.fn().mockResolvedValue([]),
      save: vi.fn(),
      saveMany: vi.fn(),
      delete: vi.fn(),
      countByProductId: vi.fn(),
    };

    mockVariantRepo = {
      findById: vi.fn(),
      findByProductId: vi.fn().mockResolvedValue([]),
      save: vi.fn(),
      delete: vi.fn(),
      countByProductId: vi.fn(),
    };

    mockImageUploadService = {
      upload: vi.fn(),
      delete: vi.fn().mockResolvedValue(Result.ok()),
    };

    useCase = new DeleteProductUseCase(
      productRepo as unknown as ProductRepository,
      mockProductImageRepo as unknown as ProductImageRepository,
      mockVariantRepo as unknown as VariantRepository,
      mockImageUploadService as unknown as ImageUploadService
    );
  });

  describe('execute', () => {
    it('should delete product and all its product images from Cloudinary', async () => {
      // Arrange
      const product = createProduct();
      productRepo.set(product);

      const image1 = createProductImage({ id: 'img-1', url: 'https://res.cloudinary.com/demo/image/upload/v1/kpsull/img1.jpg' });
      const image2 = createProductImage({ id: 'img-2', url: 'https://res.cloudinary.com/demo/image/upload/v1/kpsull/img2.jpg' });
      mockProductImageRepo.findByProductId.mockResolvedValue([image1, image2]);
      mockVariantRepo.findByProductId.mockResolvedValue([]);

      const input: DeleteProductInput = { productId: 'product-123', creatorId: 'creator-123' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.deleted).toBe(true);
      expect(mockImageUploadService.delete).toHaveBeenCalledTimes(2);
      expect(mockImageUploadService.delete).toHaveBeenCalledWith(image1.url.url);
      expect(mockImageUploadService.delete).toHaveBeenCalledWith(image2.url.url);
    });

    it('should delete product and all variant Cloudinary images', async () => {
      // Arrange
      const product = createProduct();
      productRepo.set(product);

      mockProductImageRepo.findByProductId.mockResolvedValue([]);

      const variantWithImages = createVariant({
        images: [
          'https://res.cloudinary.com/demo/image/upload/v1/kpsull/var1.jpg',
          'https://res.cloudinary.com/demo/image/upload/v1/kpsull/var2.jpg',
        ],
      });
      mockVariantRepo.findByProductId.mockResolvedValue([variantWithImages]);

      const input: DeleteProductInput = { productId: 'product-123', creatorId: 'creator-123' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockImageUploadService.delete).toHaveBeenCalledTimes(2);
      expect(mockImageUploadService.delete).toHaveBeenCalledWith('https://res.cloudinary.com/demo/image/upload/v1/kpsull/var1.jpg');
      expect(mockImageUploadService.delete).toHaveBeenCalledWith('https://res.cloudinary.com/demo/image/upload/v1/kpsull/var2.jpg');
    });

    it('should still delete from DB if Cloudinary deletion fails (best effort)', async () => {
      // Arrange
      const product = createProduct();
      productRepo.set(product);

      const image = createProductImage();
      mockProductImageRepo.findByProductId.mockResolvedValue([image]);
      mockVariantRepo.findByProductId.mockResolvedValue([]);
      mockImageUploadService.delete.mockResolvedValue(Result.fail('Cloudinary error'));

      const input: DeleteProductInput = { productId: 'product-123', creatorId: 'creator-123' };

      // Act
      const result = await useCase.execute(input);

      // Assert - should succeed despite Cloudinary failure
      expect(result.isSuccess).toBe(true);
      expect(result.value.deleted).toBe(true);
      // The product should have been removed from the repo
      const deletedProduct = await productRepo.findById('product-123');
      expect(deletedProduct).toBeNull();
    });

    it('should delete product with no images without calling Cloudinary', async () => {
      // Arrange
      const product = createProduct();
      productRepo.set(product);

      mockProductImageRepo.findByProductId.mockResolvedValue([]);
      mockVariantRepo.findByProductId.mockResolvedValue([]);

      const input: DeleteProductInput = { productId: 'product-123', creatorId: 'creator-123' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockImageUploadService.delete).not.toHaveBeenCalled();
    });

    it('should fail when product not found', async () => {
      // Arrange
      const input: DeleteProductInput = { productId: 'non-existent', creatorId: 'creator-123' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouve');
      expect(mockImageUploadService.delete).not.toHaveBeenCalled();
    });

    it('should fail when creator is not owner', async () => {
      // Arrange
      const product = createProduct({ creatorId: 'creator-123' });
      productRepo.set(product);

      const input: DeleteProductInput = { productId: 'product-123', creatorId: 'other-creator' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('autorise');
      expect(mockImageUploadService.delete).not.toHaveBeenCalled();
    });

    it('should fail when productId is empty', async () => {
      // Arrange
      const input: DeleteProductInput = { productId: '', creatorId: 'creator-123' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Product ID');
    });

    it('should fail when creatorId is empty', async () => {
      // Arrange
      const input: DeleteProductInput = { productId: 'product-123', creatorId: '' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should delete both product images and variant images', async () => {
      // Arrange
      const product = createProduct();
      productRepo.set(product);

      const productImage = createProductImage({ url: 'https://res.cloudinary.com/demo/image/upload/v1/kpsull/product-img.jpg' });
      mockProductImageRepo.findByProductId.mockResolvedValue([productImage]);

      const variantWithImages = createVariant({
        images: ['https://res.cloudinary.com/demo/image/upload/v1/kpsull/variant-img.jpg'],
      });
      mockVariantRepo.findByProductId.mockResolvedValue([variantWithImages]);

      const input: DeleteProductInput = { productId: 'product-123', creatorId: 'creator-123' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockImageUploadService.delete).toHaveBeenCalledTimes(2);
      expect(mockImageUploadService.delete).toHaveBeenCalledWith(productImage.url.url);
      expect(mockImageUploadService.delete).toHaveBeenCalledWith('https://res.cloudinary.com/demo/image/upload/v1/kpsull/variant-img.jpg');
    });
  });
});
