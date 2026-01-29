import { describe, it, expect, beforeEach, type Mock, vi } from 'vitest';
import { UploadProductImageUseCase } from '../images/upload-product-image.use-case';
import { ImageUploadService } from '../../ports/image-upload.service.interface';
import { ProductImageRepository } from '../../ports/product-image.repository.interface';
import { ProductRepository } from '../../ports/product.repository.interface';
import { Result } from '@/shared/domain';
import { Product } from '../../../domain/entities/product.entity';
import { Money } from '../../../domain/value-objects/money.vo';

describe('UploadProductImageUseCase', () => {
  let useCase: UploadProductImageUseCase;
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
  let mockProductRepository: {
    findById: Mock;
    findByCreatorId: Mock;
    save: Mock;
    delete: Mock;
    countByCreatorId: Mock;
    findVariantsByProductId: Mock;
    saveVariant: Mock;
    deleteVariant: Mock;
  };
  let mockProduct: Product;

  beforeEach(() => {
    // Create mock product
    const priceResult = Money.create(29.99);
    const productResult = Product.create({
      creatorId: 'creator-123',
      name: 'Test Product',
      price: priceResult.value!,
    });
    mockProduct = productResult.value!;

    // Create mocks
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

    mockProductRepository = {
      findById: vi.fn(),
      findByCreatorId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      countByCreatorId: vi.fn(),
      findVariantsByProductId: vi.fn(),
      saveVariant: vi.fn(),
      deleteVariant: vi.fn(),
    };

    useCase = new UploadProductImageUseCase(
      mockImageUploadService as ImageUploadService,
      mockProductImageRepository as ProductImageRepository,
      mockProductRepository as ProductRepository
    );
  });

  describe('execute', () => {
    it('should upload an image successfully', async () => {
      // Arrange
      const file = Buffer.from('fake image data');
      const input = {
        productId: mockProduct.idString,
        file,
        filename: 'product-image.jpg',
        alt: 'Product front view',
      };

      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockProductImageRepository.countByProductId.mockResolvedValue(0);
      mockImageUploadService.upload.mockResolvedValue(
        Result.ok('https://cdn.example.com/uploads/product-image.jpg')
      );
      mockProductImageRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.url).toBe('https://cdn.example.com/uploads/product-image.jpg');
      expect(result.value!.alt).toBe('Product front view');
      expect(result.value!.position).toBe(0); // First image should be position 0
      expect(mockImageUploadService.upload).toHaveBeenCalledWith(file, 'product-image.jpg');
      expect(mockProductImageRepository.save).toHaveBeenCalled();
    });

    it('should set position based on existing images count', async () => {
      // Arrange
      const file = Buffer.from('fake image data');
      const input = {
        productId: mockProduct.idString,
        file,
        filename: 'second-image.jpg',
        alt: 'Side view',
      };

      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockProductImageRepository.countByProductId.mockResolvedValue(2); // Already 2 images
      mockImageUploadService.upload.mockResolvedValue(
        Result.ok('https://cdn.example.com/uploads/second-image.jpg')
      );
      mockProductImageRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.position).toBe(2); // Third position
    });

    it('should fail when product is not found', async () => {
      // Arrange
      const input = {
        productId: 'non-existent-product',
        file: Buffer.from('data'),
        filename: 'image.jpg',
        alt: 'Alt text',
      };

      mockProductRepository.findById.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Produit non trouvé');
    });

    it('should fail when upload service fails', async () => {
      // Arrange
      const input = {
        productId: mockProduct.idString,
        file: Buffer.from('data'),
        filename: 'image.jpg',
        alt: 'Alt text',
      };

      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockProductImageRepository.countByProductId.mockResolvedValue(0);
      mockImageUploadService.upload.mockResolvedValue(
        Result.fail('Erreur lors de l\'upload du fichier')
      );

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('upload');
    });

    it('should fail when file is empty', async () => {
      // Arrange
      const input = {
        productId: mockProduct.idString,
        file: Buffer.from(''),
        filename: 'image.jpg',
        alt: 'Alt text',
      };

      mockProductRepository.findById.mockResolvedValue(mockProduct);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('fichier');
    });

    it('should fail when filename is empty', async () => {
      // Arrange
      const input = {
        productId: mockProduct.idString,
        file: Buffer.from('data'),
        filename: '',
        alt: 'Alt text',
      };

      mockProductRepository.findById.mockResolvedValue(mockProduct);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nom du fichier');
    });

    it('should use empty alt text when not provided', async () => {
      // Arrange
      const input = {
        productId: mockProduct.idString,
        file: Buffer.from('data'),
        filename: 'image.jpg',
      };

      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockProductImageRepository.countByProductId.mockResolvedValue(0);
      mockImageUploadService.upload.mockResolvedValue(
        Result.ok('https://cdn.example.com/image.jpg')
      );
      mockProductImageRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.alt).toBe('');
    });
  });
});
