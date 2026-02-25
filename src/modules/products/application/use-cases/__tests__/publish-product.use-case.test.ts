import { describe, it, expect, beforeEach } from 'vitest';
import { PublishProductUseCase } from '../products/publish-product.use-case';
import { Product } from '../../../domain/entities/product.entity';
import { Money } from '../../../domain/value-objects/money.vo';
import { TestProductRepository } from '../../../__tests__/helpers/test-product.repository';
import { TestSubscriptionService } from '../../../__tests__/helpers/test-subscription.service';

function createDraftProduct(creatorId = 'creator-123'): Product {
  const price = Money.create(29.99).value;
  return Product.create({ creatorId, name: 'Mon Produit', price }).value;
}

describe('PublishProductUseCase', () => {
  let useCase: PublishProductUseCase;
  let mockProductRepo: TestProductRepository;
  let mockSubscriptionService: TestSubscriptionService;

  beforeEach(() => {
    mockProductRepo = new TestProductRepository();
    mockSubscriptionService = new TestSubscriptionService();
    useCase = new PublishProductUseCase(mockProductRepo, mockSubscriptionService);
  });

  describe('execute', () => {
    it('should publish a draft product successfully', async () => {
      const product = createDraftProduct();
      mockProductRepo.set(product);

      const result = await useCase.execute({
        productId: product.idString,
        creatorId: 'creator-123',
      });

      expect(result.isSuccess).toBe(true);
      expect(mockProductRepo.savedProduct!.isPublished).toBe(true);
      expect(mockProductRepo.savedProduct!.publishedAt).toBeDefined();
      expect(mockSubscriptionService.productCountIncremented).toBe(true);
    });

    it('should fail when product not found', async () => {
      const result = await useCase.execute({
        productId: 'non-existent',
        creatorId: 'creator-123',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvé');
    });

    it('should fail when creator does not own the product', async () => {
      const product = createDraftProduct();
      mockProductRepo.set(product);

      const result = await useCase.execute({
        productId: product.idString,
        creatorId: 'other-creator',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('autorisé');
    });

    it('should fail when product is already published', async () => {
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
      }).value;

      mockProductRepo.set(product);

      const result = await useCase.execute({
        productId: 'product-123',
        creatorId: 'creator-123',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('déjà publié');
    });

    it('should fail when product limit is reached (FREE plan)', async () => {
      const product = createDraftProduct();
      mockProductRepo.set(product);
      mockSubscriptionService.setLimitResult({
        status: 'BLOCKED',
        current: 5,
        limit: 5,
        message: 'Limite de produits atteinte.',
      });

      const result = await useCase.execute({
        productId: product.idString,
        creatorId: 'creator-123',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Limite');
    });

    it('should publish when limit status is WARNING', async () => {
      const product = createDraftProduct();
      mockProductRepo.set(product);
      mockSubscriptionService.setLimitResult({
        status: 'WARNING',
        current: 4,
        limit: 5,
        message: 'Plus qu\'un emplacement disponible',
      });

      const result = await useCase.execute({
        productId: product.idString,
        creatorId: 'creator-123',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.limitWarning).toBeDefined();
    });

    it('should fail when productId is empty', async () => {
      const result = await useCase.execute({
        productId: '',
        creatorId: 'creator-123',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Product ID');
    });

    it('should fail when creatorId is empty', async () => {
      const result = await useCase.execute({
        productId: 'product-123',
        creatorId: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });
  });
});
