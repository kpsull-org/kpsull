import { describe, it, expect, beforeEach } from 'vitest';
import { PublishProductUseCase } from '../products/publish-product.use-case';
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
  private limitResult: LimitCheckResult = { status: 'OK', current: 0, limit: 5 };
  public productCountIncremented = false;

  setLimitResult(result: LimitCheckResult): void {
    this.limitResult = result;
  }

  async checkProductLimit(): Promise<Result<LimitCheckResult>> {
    return Result.ok(this.limitResult);
  }

  async incrementProductCount(): Promise<Result<void>> {
    this.productCountIncremented = true;
    return Result.ok();
  }

  async decrementProductCount(): Promise<Result<void>> {
    return Result.ok();
  }
}

describe('PublishProductUseCase', () => {
  let useCase: PublishProductUseCase;
  let mockProductRepo: MockProductRepository;
  let mockSubscriptionService: MockSubscriptionService;

  beforeEach(() => {
    mockProductRepo = new MockProductRepository();
    mockSubscriptionService = new MockSubscriptionService();
    useCase = new PublishProductUseCase(mockProductRepo, mockSubscriptionService);
  });

  describe('execute', () => {
    it('should publish a draft product successfully', async () => {
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
      expect(result.isSuccess).toBe(true);
      expect(mockProductRepo.savedProduct!.isPublished).toBe(true);
      expect(mockProductRepo.savedProduct!.publishedAt).toBeDefined();
      expect(mockSubscriptionService.productCountIncremented).toBe(true);
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
        creatorId: 'other-creator',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('autorisé');
    });

    it('should fail when product is already published', async () => {
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
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('déjà publié');
    });

    it('should fail when product limit is reached (FREE plan)', async () => {
      // Arrange
      const price = Money.create(29.99).value!;
      const product = Product.create({
        creatorId: 'creator-123',
        name: 'Mon Produit',
        price,
      }).value!;

      mockProductRepo.setProduct(product);
      mockSubscriptionService.setLimitResult({
        status: 'BLOCKED',
        current: 5,
        limit: 5,
        message: 'Limite de produits atteinte. Passez au plan PRO pour publier plus de produits.',
      });

      // Act
      const result = await useCase.execute({
        productId: product.idString,
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Limite');
    });

    it('should publish when limit status is WARNING', async () => {
      // Arrange
      const price = Money.create(29.99).value!;
      const product = Product.create({
        creatorId: 'creator-123',
        name: 'Mon Produit',
        price,
      }).value!;

      mockProductRepo.setProduct(product);
      mockSubscriptionService.setLimitResult({
        status: 'WARNING',
        current: 4,
        limit: 5,
        message: 'Plus qu\'un emplacement disponible',
      });

      // Act
      const result = await useCase.execute({
        productId: product.idString,
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.limitWarning).toBeDefined();
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
  });
});
