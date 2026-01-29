import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
  ListPublicProductsUseCase,
  type ListPublicProductsInput,
  type PublicProductListRepository,
} from '../list-public-products.use-case';
import { Product } from '../../../../domain/entities/product.entity';
import { ProductImage } from '../../../../domain/entities/product-image.entity';
import { Money } from '../../../../domain/value-objects/money.vo';
import { ImageUrl } from '../../../../domain/value-objects/image-url.vo';

describe('ListPublicProductsUseCase', () => {
  let useCase: ListPublicProductsUseCase;
  let mockRepo: {
    findPublishedByCreatorSlugWithPagination: Mock;
    findMainImagesByProductIds: Mock;
  };

  const createMockProduct = (id: string, name: string, priceAmount: number) => {
    const price = Money.create(priceAmount).value!;
    const product = Product.create({
      creatorId: 'creator-123',
      projectId: 'project-1',
      name,
      description: `Description de ${name}`,
      price,
    }).value!;

    // Force the product to be published
    product.publish();

    // We need to mock the idString since it's auto-generated
    Object.defineProperty(product, 'idString', { value: id });

    return product;
  };

  const createMockImage = (productId: string) => {
    const imageUrl = ImageUrl.create('https://example.com/image.jpg', 'product').value!;
    return ProductImage.create({
      productId,
      url: imageUrl,
      alt: 'Image produit',
      position: 0,
    }).value!;
  };

  beforeEach(() => {
    mockRepo = {
      findPublishedByCreatorSlugWithPagination: vi.fn(),
      findMainImagesByProductIds: vi.fn(),
    };
    useCase = new ListPublicProductsUseCase(mockRepo as unknown as PublicProductListRepository);
  });

  describe('execute', () => {
    it('should return published products with pagination', async () => {
      // Arrange
      const product1 = createMockProduct('prod-1', 'Produit A', 29.99);
      const product2 = createMockProduct('prod-2', 'Produit B', 49.99);
      const image1 = createMockImage('prod-1');
      const image2 = createMockImage('prod-2');

      mockRepo.findPublishedByCreatorSlugWithPagination.mockResolvedValue({
        products: [product1, product2],
        total: 2,
      });
      mockRepo.findMainImagesByProductIds.mockResolvedValue([image1, image2]);

      const input: ListPublicProductsInput = {
        creatorSlug: 'my-shop',
        page: 1,
        limit: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.products).toHaveLength(2);
      expect(result.value!.total).toBe(2);
      expect(result.value!.pages).toBe(1);
      expect(mockRepo.findPublishedByCreatorSlugWithPagination).toHaveBeenCalledWith(
        'my-shop',
        expect.objectContaining({
          skip: 0,
          take: 10,
        })
      );
    });

    it('should not expose creatorId in product list', async () => {
      // Arrange
      const product = createMockProduct('prod-1', 'Produit A', 29.99);

      mockRepo.findPublishedByCreatorSlugWithPagination.mockResolvedValue({
        products: [product],
        total: 1,
      });
      mockRepo.findMainImagesByProductIds.mockResolvedValue([]);

      const input: ListPublicProductsInput = {
        creatorSlug: 'my-shop',
        page: 1,
        limit: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect('creatorId' in result.value!.products[0]!).toBe(false);
    });

    it('should include main image URL for each product', async () => {
      // Arrange
      const product1 = createMockProduct('prod-1', 'Produit A', 29.99);
      const product2 = createMockProduct('prod-2', 'Produit B', 49.99);
      const image1 = createMockImage('prod-1');
      // Product 2 has no image

      mockRepo.findPublishedByCreatorSlugWithPagination.mockResolvedValue({
        products: [product1, product2],
        total: 2,
      });
      mockRepo.findMainImagesByProductIds.mockResolvedValue([image1]);

      const input: ListPublicProductsInput = {
        creatorSlug: 'my-shop',
        page: 1,
        limit: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.products[0]!.mainImageUrl).toBe('https://example.com/image.jpg');
      expect(result.value!.products[1]!.mainImageUrl).toBeUndefined();
    });

    it('should calculate pagination correctly', async () => {
      // Arrange
      const products = Array.from({ length: 5 }, (_, i) =>
        createMockProduct(`prod-${i}`, `Produit ${i}`, 29.99 + i)
      );

      mockRepo.findPublishedByCreatorSlugWithPagination.mockResolvedValue({
        products: products.slice(0, 2),
        total: 5,
      });
      mockRepo.findMainImagesByProductIds.mockResolvedValue([]);

      const input: ListPublicProductsInput = {
        creatorSlug: 'my-shop',
        page: 1,
        limit: 2,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.products).toHaveLength(2);
      expect(result.value!.total).toBe(5);
      expect(result.value!.pages).toBe(3);
    });

    it('should filter by projectId when provided', async () => {
      // Arrange
      mockRepo.findPublishedByCreatorSlugWithPagination.mockResolvedValue({
        products: [],
        total: 0,
      });
      mockRepo.findMainImagesByProductIds.mockResolvedValue([]);

      const input: ListPublicProductsInput = {
        creatorSlug: 'my-shop',
        projectId: 'project-123',
        page: 1,
        limit: 10,
      };

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockRepo.findPublishedByCreatorSlugWithPagination).toHaveBeenCalledWith(
        'my-shop',
        expect.objectContaining({
          projectId: 'project-123',
        })
      );
    });

    it('should search by name when search term provided', async () => {
      // Arrange
      mockRepo.findPublishedByCreatorSlugWithPagination.mockResolvedValue({
        products: [],
        total: 0,
      });
      mockRepo.findMainImagesByProductIds.mockResolvedValue([]);

      const input: ListPublicProductsInput = {
        creatorSlug: 'my-shop',
        search: 'chemise',
        page: 1,
        limit: 10,
      };

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockRepo.findPublishedByCreatorSlugWithPagination).toHaveBeenCalledWith(
        'my-shop',
        expect.objectContaining({
          search: 'chemise',
        })
      );
    });

    it('should fail when creatorSlug is empty', async () => {
      // Arrange
      const input: ListPublicProductsInput = {
        creatorSlug: '',
        page: 1,
        limit: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator slug est requis');
    });

    it('should return empty list when no products found', async () => {
      // Arrange
      mockRepo.findPublishedByCreatorSlugWithPagination.mockResolvedValue({
        products: [],
        total: 0,
      });
      mockRepo.findMainImagesByProductIds.mockResolvedValue([]);

      const input: ListPublicProductsInput = {
        creatorSlug: 'my-shop',
        page: 1,
        limit: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.products).toHaveLength(0);
      expect(result.value!.total).toBe(0);
      expect(result.value!.pages).toBe(0);
    });

    it('should include display price from Money value object', async () => {
      // Arrange
      const product = createMockProduct('prod-1', 'Produit A', 29.99);

      mockRepo.findPublishedByCreatorSlugWithPagination.mockResolvedValue({
        products: [product],
        total: 1,
      });
      mockRepo.findMainImagesByProductIds.mockResolvedValue([]);

      const input: ListPublicProductsInput = {
        creatorSlug: 'my-shop',
        page: 1,
        limit: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.products[0]!.price).toBe(29.99);
      expect(result.value!.products[0]!.priceCurrency).toBe('EUR');
    });
  });
});
