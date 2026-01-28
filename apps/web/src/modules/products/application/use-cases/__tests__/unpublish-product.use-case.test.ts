import { describe, it, expect, beforeEach } from 'vitest';
import { UnpublishProductUseCase } from '../products/unpublish-product.use-case';
import { ProductRepository } from '../../ports/product.repository.interface';
import { SubscriptionService, LimitCheckResult } from '../../ports/subscription.service.interface';
import { Product } from '../../../domain/entities/product.entity';
import { Money } from '../../../domain/value-objects/money.vo';
import { Result } from '@/shared/domain';

// Mock repositories
class MockProductRepository implements ProductRepository {
  public savedProduct: Product | null = null;
  private products: Map<string, Product> = new Map();

  setProduct(product: Product): void {
    this.products.set(product.idString, product);
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.get(id) ?? null;
  }

  async findByCreatorId(): Promise<Product[]> {
    return [];
  }

  async save(product: Product): Promise<void> {
    this.savedProduct = product;
    this.products.set(product.idString, product);
  }

  async delete(): Promise<void> {}

  async countByCreatorId(): Promise<number> {
    return 0;
  }
}

class MockSubscriptionService implements SubscriptionService {
  public productCountDecremented = false;

  async checkProductLimit(): Promise<Result<LimitCheckResult>> {
    return Result.ok({ status: 'OK', current: 0, limit: 5 });
  }

  async incrementProductCount(): Promise<Result<void>> {
    return Result.ok();
  }

  async decrementProductCount(): Promise<Result<void>> {
    this.productCountDecremented = true;
    return Result.ok();
  }
}

describe('UnpublishProductUseCase', () => {
  let useCase: UnpublishProductUseCase;
  let mockProductRepo: MockProductRepository;
  let mockSubscriptionService: MockSubscriptionService;

  beforeEach(() => {
    mockProductRepo = new MockProductRepository();
    mockSubscriptionService = new MockSubscriptionService();
    useCase = new UnpublishProductUseCase(mockProductRepo, mockSubscriptionService);
  });

  describe('execute', () => {
    it('should unpublish a published product successfully', async () => {
      // Arrange
      const product = Product.reconstitute({
        id: 'product-123',
        creatorId: 'creator-123',
        name: 'Mon Produit',
        priceAmount: 2999,
        priceCurrency: 'EUR',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockProductRepo.setProduct(product);

      // Act
      const result = await useCase.execute({
        productId: 'product-123',
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockProductRepo.savedProduct!.isDraft).toBe(true);
      expect(mockSubscriptionService.productCountDecremented).toBe(true);
    });

    it('should fail when product not found', async () => {
      // Act
      const result = await useCase.execute({
        productId: 'non-existent',
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvé');
    });

    it('should fail when creator does not own the product', async () => {
      // Arrange
      const product = Product.reconstitute({
        id: 'product-123',
        creatorId: 'creator-123',
        name: 'Mon Produit',
        priceAmount: 2999,
        priceCurrency: 'EUR',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockProductRepo.setProduct(product);

      // Act
      const result = await useCase.execute({
        productId: 'product-123',
        creatorId: 'other-creator',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('autorisé');
    });

    it('should fail when product is already a draft', async () => {
      // Arrange
      const price = Money.create(29.99).value!;
      const product = Product.create({
        creatorId: 'creator-123',
        name: 'Mon Produit',
        price,
      }).value!;

      mockProductRepo.setProduct(product);

      // Act
      const result = await useCase.execute({
        productId: product.idString,
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('brouillon');
    });

    it('should fail when productId is empty', async () => {
      // Act
      const result = await useCase.execute({
        productId: '',
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Product ID');
    });

    it('should fail when creatorId is empty', async () => {
      // Act
      const result = await useCase.execute({
        productId: 'product-123',
        creatorId: '',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });
  });
});
