import { describe, it, expect, beforeEach } from 'vitest';
import { UnpublishProductUseCase } from '../products/unpublish-product.use-case';
import { Product } from '../../../domain/entities/product.entity';
import { Money } from '../../../domain/value-objects/money.vo';
import { TestProductRepository } from '../../../__tests__/helpers/test-product.repository';
import { TestSubscriptionService } from '../../../__tests__/helpers/test-subscription.service';

function createPublishedProduct(id = 'product-123', creatorId = 'creator-123'): Product {
  return Product.reconstitute({
    id,
    creatorId,
    name: 'Mon Produit',
    priceAmount: 2999,
    priceCurrency: 'EUR',
    status: 'PUBLISHED',
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }).value;
}

describe('UnpublishProductUseCase', () => {
  let useCase: UnpublishProductUseCase;
  let mockProductRepo: TestProductRepository;
  let mockSubscriptionService: TestSubscriptionService;

  beforeEach(() => {
    mockProductRepo = new TestProductRepository();
    mockSubscriptionService = new TestSubscriptionService();
    useCase = new UnpublishProductUseCase(mockProductRepo, mockSubscriptionService);
  });

  describe('execute', () => {
    it('should unpublish a published product successfully', async () => {
      mockProductRepo.set(createPublishedProduct());

      const result = await useCase.execute({
        productId: 'product-123',
        creatorId: 'creator-123',
      });

      expect(result.isSuccess).toBe(true);
      expect(mockProductRepo.savedProduct!.isDraft).toBe(true);
      expect(mockSubscriptionService.productCountDecremented).toBe(true);
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
      mockProductRepo.set(createPublishedProduct());

      const result = await useCase.execute({
        productId: 'product-123',
        creatorId: 'other-creator',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('autorisé');
    });

    it('should fail when product is already a draft', async () => {
      const price = Money.create(29.99).value;
      const product = Product.create({
        creatorId: 'creator-123',
        name: 'Mon Produit',
        price,
      }).value;
      mockProductRepo.set(product);

      const result = await useCase.execute({
        productId: product.idString,
        creatorId: 'creator-123',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('brouillon');
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
