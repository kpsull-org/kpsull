import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
  ListPublicProductsUseCase,
  type ListPublicProductsInput,
  type PublicProductListRepository,
} from '../list-public-products.use-case';
import { Product } from '../../../../domain/entities/product.entity';
import { Money } from '../../../../domain/value-objects/money.vo';

describe('ListPublicProductsUseCase', () => {
  let useCase: ListPublicProductsUseCase;
  let mockRepo: {
    findPublishedByCreatorSlugWithPagination: Mock;
    findFirstVariantImagesByProductIds: Mock;
  };

  const createMockProduct = (id: string, name: string, priceAmount: number) => {
    const price = Money.create(priceAmount).value;
    const product = Product.create({
      creatorId: 'creator-123',
      projectId: 'project-1',
      name,
      description: `Description de ${name}`,
      price,
    }).value;

    // Force the product to be published
    product.publish();

    // We need to mock the idString since it's auto-generated
    Object.defineProperty(product, 'idString', { value: id });

    return product;
  };

  beforeEach(() => {
    mockRepo = {
      findPublishedByCreatorSlugWithPagination: vi.fn(),
      findFirstVariantImagesByProductIds: vi.fn().mockResolvedValue([]),
    };
    useCase = new ListPublicProductsUseCase(mockRepo as unknown as PublicProductListRepository);
  });

  describe('execute', () => {
    it('should return published products with pagination', async () => {
      // Arrange
      const product1 = createMockProduct('prod-1', 'Produit A', 29.99);
      const product2 = createMockProduct('prod-2', 'Produit B', 49.99);

      mockRepo.findPublishedByCreatorSlugWithPagination.mockResolvedValue({
        products: [product1, product2],
        total: 2,
      });
      mockRepo.findFirstVariantImagesByProductIds.mockResolvedValue([
        { productId: 'prod-1', url: 'https://example.com/image1.jpg' },
        { productId: 'prod-2', url: 'https://example.com/image2.jpg' },
      ]);

      const input: ListPublicProductsInput = {
        creatorSlug: 'my-shop',
        page: 1,
        limit: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.products).toHaveLength(2);
      expect(result.value.total).toBe(2);
      expect(result.value.pages).toBe(1);
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

      const input: ListPublicProductsInput = {
        creatorSlug: 'my-shop',
        page: 1,
        limit: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect('creatorId' in result.value.products[0]!).toBe(false);
    });

    it('should include main image URL for each product', async () => {
      // Arrange
      const product1 = createMockProduct('prod-1', 'Produit A', 29.99);
      const product2 = createMockProduct('prod-2', 'Produit B', 49.99);

      mockRepo.findPublishedByCreatorSlugWithPagination.mockResolvedValue({
        products: [product1, product2],
        total: 2,
      });
      // Only product1 has an image
      mockRepo.findFirstVariantImagesByProductIds.mockResolvedValue([
        { productId: 'prod-1', url: 'https://example.com/image.jpg' },
      ]);

      const input: ListPublicProductsInput = {
        creatorSlug: 'my-shop',
        page: 1,
        limit: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.products[0]!.mainImageUrl).toBe('https://example.com/image.jpg');
      expect(result.value.products[1]!.mainImageUrl).toBeUndefined();
    });

    it('should calculate pagination correctly', async () => {
      // Arrange
      const products = Array.from({ length: 2 }, (_, i) =>
        createMockProduct(`prod-${i}`, `Produit ${i}`, 29.99 + i)
      );

      mockRepo.findPublishedByCreatorSlugWithPagination.mockResolvedValue({
        products: products.slice(0, 2),
        total: 5,
      });

      const input: ListPublicProductsInput = {
        creatorSlug: 'my-shop',
        page: 1,
        limit: 2,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.pages).toBe(3);
    });

    it('should return empty result when no products found', async () => {
      // Arrange
      mockRepo.findPublishedByCreatorSlugWithPagination.mockResolvedValue({
        products: [],
        total: 0,
      });

      const input: ListPublicProductsInput = {
        creatorSlug: 'empty-shop',
        page: 1,
        limit: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.products).toHaveLength(0);
      expect(result.value.total).toBe(0);
      expect(result.value.pages).toBe(0);
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

    it('should pass search filter to repository', async () => {
      // Arrange
      mockRepo.findPublishedByCreatorSlugWithPagination.mockResolvedValue({
        products: [],
        total: 0,
      });

      const input: ListPublicProductsInput = {
        creatorSlug: 'my-shop',
        search: 'jean',
        page: 1,
        limit: 10,
      };

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockRepo.findPublishedByCreatorSlugWithPagination).toHaveBeenCalledWith(
        'my-shop',
        expect.objectContaining({ search: 'jean' })
      );
    });
  });
});
