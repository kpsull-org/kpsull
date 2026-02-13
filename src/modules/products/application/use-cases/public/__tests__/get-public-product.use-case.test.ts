import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
  GetPublicProductUseCase,
  type GetPublicProductInput,
  type PublicProductRepository,
} from '../get-public-product.use-case';
import { Product } from '../../../../domain/entities/product.entity';
import { ProductVariant } from '../../../../domain/entities/product-variant.entity';
import { ProductImage } from '../../../../domain/entities/product-image.entity';
import { Money } from '../../../../domain/value-objects/money.vo';
import { ImageUrl } from '../../../../domain/value-objects/image-url.vo';

describe('GetPublicProductUseCase', () => {
  let useCase: GetPublicProductUseCase;
  let mockRepo: {
    findPublishedById: Mock;
    findVariantsByProductId: Mock;
    findImagesByProductId: Mock;
  };

  const createMockProduct = (isPublished = true) => {
    const price = Money.create(29.99).value;
    const product = Product.create({
      creatorId: 'creator-123',
      projectId: 'project-1',
      name: 'Mon Produit',
      description: 'Description du produit',
      price,
    }).value;

    if (isPublished) {
      product.publish();
    }

    return product;
  };

  const createMockVariant = (productId: string, stock = 10, priceOverride?: Money) => {
    return ProductVariant.create({
      productId,
      name: 'Taille M',
      sku: 'SKU-M',
      priceOverride,
      stock,
    }).value;
  };

  const createMockImage = (productId: string, position = 0) => {
    const imageUrl = ImageUrl.create('https://example.com/image.jpg', 'product').value;
    return ProductImage.create({
      productId,
      url: imageUrl,
      alt: 'Image produit',
      position,
    }).value;
  };

  beforeEach(() => {
    mockRepo = {
      findPublishedById: vi.fn(),
      findVariantsByProductId: vi.fn(),
      findImagesByProductId: vi.fn(),
    };
    useCase = new GetPublicProductUseCase(mockRepo as unknown as PublicProductRepository);
  });

  describe('execute', () => {
    it('should return a published product with variants and images', async () => {
      // Arrange
      const product = createMockProduct(true);
      const variant1 = createMockVariant(product.idString, 10);
      const variant2 = createMockVariant(product.idString, 5);
      const image1 = createMockImage(product.idString, 0);
      const image2 = createMockImage(product.idString, 1);

      mockRepo.findPublishedById.mockResolvedValue(product);
      mockRepo.findVariantsByProductId.mockResolvedValue([variant1, variant2]);
      mockRepo.findImagesByProductId.mockResolvedValue([image1, image2]);

      const input: GetPublicProductInput = {
        productId: product.idString,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBe(product.idString);
      expect(result.value.name).toBe('Mon Produit');
      expect(result.value.description).toBe('Description du produit');
      expect(result.value.price).toBe(29.99);
      expect(result.value.priceCurrency).toBe('EUR');
      expect(result.value.variants).toHaveLength(2);
      expect(result.value.images).toHaveLength(2);
    });

    it('should not expose creatorId in public response', async () => {
      // Arrange
      const product = createMockProduct(true);
      mockRepo.findPublishedById.mockResolvedValue(product);
      mockRepo.findVariantsByProductId.mockResolvedValue([]);
      mockRepo.findImagesByProductId.mockResolvedValue([]);

      const input: GetPublicProductInput = {
        productId: product.idString,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect('creatorId' in result.value).toBe(false);
    });

    it('should return only available variants (stock > 0)', async () => {
      // Arrange
      const product = createMockProduct(true);
      const availableVariant = createMockVariant(product.idString, 10);
      const outOfStockVariant = createMockVariant(product.idString, 0);

      mockRepo.findPublishedById.mockResolvedValue(product);
      mockRepo.findVariantsByProductId.mockResolvedValue([availableVariant, outOfStockVariant]);
      mockRepo.findImagesByProductId.mockResolvedValue([]);

      const input: GetPublicProductInput = {
        productId: product.idString,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.variants).toHaveLength(1);
      expect(result.value.variants[0]!.isAvailable).toBe(true);
    });

    it('should include variant price override when present', async () => {
      // Arrange
      const product = createMockProduct(true);
      const priceOverride = Money.create(39.99).value;
      const variantWithOverride = createMockVariant(product.idString, 10, priceOverride);

      mockRepo.findPublishedById.mockResolvedValue(product);
      mockRepo.findVariantsByProductId.mockResolvedValue([variantWithOverride]);
      mockRepo.findImagesByProductId.mockResolvedValue([]);

      const input: GetPublicProductInput = {
        productId: product.idString,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.variants[0]!.priceOverride).toBe(39.99);
    });

    it('should return images sorted by position', async () => {
      // Arrange
      const product = createMockProduct(true);
      const image1 = createMockImage(product.idString, 2);
      const image2 = createMockImage(product.idString, 0);
      const image3 = createMockImage(product.idString, 1);

      mockRepo.findPublishedById.mockResolvedValue(product);
      mockRepo.findVariantsByProductId.mockResolvedValue([]);
      mockRepo.findImagesByProductId.mockResolvedValue([image1, image2, image3]);

      const input: GetPublicProductInput = {
        productId: product.idString,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.images).toHaveLength(3);
      expect(result.value.images[0]!.position).toBe(0);
      expect(result.value.images[1]!.position).toBe(1);
      expect(result.value.images[2]!.position).toBe(2);
    });

    it('should fail when product not found', async () => {
      // Arrange
      mockRepo.findPublishedById.mockResolvedValue(null);

      const input: GetPublicProductInput = {
        productId: 'non-existent',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Produit non trouve');
    });

    it('should fail when productId is empty', async () => {
      // Arrange
      const input: GetPublicProductInput = {
        productId: '',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Product ID est requis');
    });

    it('should include main image URL in response', async () => {
      // Arrange
      const product = createMockProduct(true);
      const mainImage = createMockImage(product.idString, 0);

      mockRepo.findPublishedById.mockResolvedValue(product);
      mockRepo.findVariantsByProductId.mockResolvedValue([]);
      mockRepo.findImagesByProductId.mockResolvedValue([mainImage]);

      const input: GetPublicProductInput = {
        productId: product.idString,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.mainImageUrl).toBe('https://example.com/image.jpg');
    });

    it('should return undefined mainImageUrl when no images', async () => {
      // Arrange
      const product = createMockProduct(true);

      mockRepo.findPublishedById.mockResolvedValue(product);
      mockRepo.findVariantsByProductId.mockResolvedValue([]);
      mockRepo.findImagesByProductId.mockResolvedValue([]);

      const input: GetPublicProductInput = {
        productId: product.idString,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.mainImageUrl).toBeUndefined();
    });

    it('should include projectId for display purposes', async () => {
      // Arrange
      const product = createMockProduct(true);

      mockRepo.findPublishedById.mockResolvedValue(product);
      mockRepo.findVariantsByProductId.mockResolvedValue([]);
      mockRepo.findImagesByProductId.mockResolvedValue([]);

      const input: GetPublicProductInput = {
        productId: product.idString,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.projectId).toBe('project-1');
    });
  });
});
