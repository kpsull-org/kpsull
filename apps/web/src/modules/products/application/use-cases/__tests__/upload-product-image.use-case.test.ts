import { describe, it, expect, beforeEach, type Mock, vi } from 'vitest';
import { UploadProductImageUseCase } from '../images/upload-product-image.use-case';
import { ImageUploadService } from '../../ports/image-upload.service.interface';
import { ProductImageRepository } from '../../ports/product-image.repository.interface';
import { ProductRepository } from '../../ports/product.repository.interface';
import { Result } from '@/shared/domain';
import { Product } from '../../../domain/entities/product.entity';
import { Money } from '../../../domain/value-objects/money.vo';
import { MAX_FILE_SIZE } from '@/lib/utils/file-validation';

/**
 * Helper to create a valid JPEG buffer with magic bytes
 */
function createValidJpegBuffer(size = 100): Buffer {
  const buffer = Buffer.alloc(size);
  // JPEG magic bytes: FF D8 FF
  buffer[0] = 0xff;
  buffer[1] = 0xd8;
  buffer[2] = 0xff;
  return buffer;
}

/**
 * Helper to create a valid PNG buffer with magic bytes
 */
function createValidPngBuffer(size = 100): Buffer {
  const buffer = Buffer.alloc(size);
  // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
  buffer.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  return buffer;
}

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
    it('should upload a valid JPEG image successfully', async () => {
      // Arrange
      const file = createValidJpegBuffer();
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

    it('should upload a valid PNG image successfully', async () => {
      // Arrange
      const file = createValidPngBuffer();
      const input = {
        productId: mockProduct.idString,
        file,
        filename: 'product-image.png',
        alt: 'Product PNG view',
      };

      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockProductImageRepository.countByProductId.mockResolvedValue(0);
      mockImageUploadService.upload.mockResolvedValue(
        Result.ok('https://cdn.example.com/uploads/product-image.png')
      );
      mockProductImageRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.url).toBe('https://cdn.example.com/uploads/product-image.png');
    });

    it('should set position based on existing images count', async () => {
      // Arrange
      const file = createValidJpegBuffer();
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
        file: createValidJpegBuffer(),
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
        file: createValidJpegBuffer(),
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

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('vide');
    });

    it('should fail when filename is empty', async () => {
      // Arrange
      const input = {
        productId: mockProduct.idString,
        file: createValidJpegBuffer(),
        filename: '',
        alt: 'Alt text',
      };

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
        file: createValidJpegBuffer(),
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

    describe('MIME type validation', () => {
      it('should reject files with invalid MIME type', async () => {
        // Arrange - Create a buffer with random bytes (not a valid image)
        const invalidBuffer = Buffer.alloc(100);
        invalidBuffer.set([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b], 0);

        const input = {
          productId: mockProduct.idString,
          file: invalidBuffer,
          filename: 'fake-image.jpg',
          alt: 'Alt text',
        };

        // Act
        const result = await useCase.execute(input);

        // Assert
        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('Type de fichier non reconnu');
      });

      it('should reject files where extension does not match content', async () => {
        // Arrange - Create a PNG buffer but with .jpg extension
        const pngBuffer = createValidPngBuffer();
        const input = {
          productId: mockProduct.idString,
          file: pngBuffer,
          filename: 'actually-png.jpg', // Wrong extension
          alt: 'Alt text',
        };

        // Act
        const result = await useCase.execute(input);

        // Assert
        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('ne correspond pas');
      });

      it('should reject disallowed file extensions', async () => {
        // Arrange
        const input = {
          productId: mockProduct.idString,
          file: createValidJpegBuffer(),
          filename: 'document.pdf',
          alt: 'Alt text',
        };

        // Act
        const result = await useCase.execute(input);

        // Assert
        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('Extension');
        expect(result.error).toContain('.pdf');
      });

      it('should reject executable files disguised as images', async () => {
        // Arrange - PE executable magic bytes (MZ)
        const exeBuffer = Buffer.alloc(100);
        exeBuffer.set([0x4d, 0x5a, 0x90, 0x00], 0);

        const input = {
          productId: mockProduct.idString,
          file: exeBuffer,
          filename: 'virus.jpg',
          alt: 'Alt text',
        };

        // Act
        const result = await useCase.execute(input);

        // Assert
        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('Type de fichier non reconnu');
      });
    });

    describe('file size validation', () => {
      it('should reject files exceeding maximum size', async () => {
        // Arrange - Create a buffer larger than MAX_FILE_SIZE
        const largeBuffer = createValidJpegBuffer(MAX_FILE_SIZE + 1);
        const input = {
          productId: mockProduct.idString,
          file: largeBuffer,
          filename: 'large-image.jpg',
          alt: 'Alt text',
        };

        // Act
        const result = await useCase.execute(input);

        // Assert
        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('volumineux');
        expect(result.error).toContain('10 MB');
      });

      it('should accept files at exactly maximum size', async () => {
        // Arrange
        const exactMaxBuffer = createValidJpegBuffer(MAX_FILE_SIZE);
        const input = {
          productId: mockProduct.idString,
          file: exactMaxBuffer,
          filename: 'max-size-image.jpg',
          alt: 'Alt text',
        };

        mockProductRepository.findById.mockResolvedValue(mockProduct);
        mockProductImageRepository.countByProductId.mockResolvedValue(0);
        mockImageUploadService.upload.mockResolvedValue(
          Result.ok('https://cdn.example.com/uploads/max-size-image.jpg')
        );
        mockProductImageRepository.save.mockResolvedValue(undefined);

        // Act
        const result = await useCase.execute(input);

        // Assert
        expect(result.isSuccess).toBe(true);
      });
    });
  });
});
