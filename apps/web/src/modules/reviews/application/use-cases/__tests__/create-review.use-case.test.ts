import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { CreateReviewUseCase } from '../create-review.use-case';
import type { ReviewRepository } from '../../ports/review.repository.interface';
import { Review } from '../../../domain/entities/review.entity';
import { Rating } from '../../../domain/value-objects/rating.vo';

describe('CreateReview Use Case', () => {
  let useCase: CreateReviewUseCase;
  let mockRepository: {
    save: Mock;
    findById: Mock;
    findByCustomerAndProduct: Mock;
    findByCustomerAndOrder: Mock;
    findByProductId: Mock;
    findByCustomerId: Mock;
    getProductStats: Mock;
    delete: Mock;
  };

  beforeEach(() => {
    mockRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findByCustomerAndProduct: vi.fn(),
      findByCustomerAndOrder: vi.fn(),
      findByProductId: vi.fn(),
      findByCustomerId: vi.fn(),
      getProductStats: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new CreateReviewUseCase(mockRepository as unknown as ReviewRepository);
  });

  describe('execute', () => {
    it('should create a review successfully', async () => {
      mockRepository.findByCustomerAndProduct.mockResolvedValue(null);

      const result = await useCase.execute({
        productId: 'product-123',
        customerId: 'customer-123',
        orderId: 'order-123',
        rating: 5,
        title: 'Excellent produit',
        content: 'Je suis tres satisfait de cet achat.',
        verifiedPurchase: true,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.productId).toBe('product-123');
      expect(result.value.customerId).toBe('customer-123');
      expect(result.value.orderId).toBe('order-123');
      expect(result.value.rating).toBe(5);
      expect(result.value.title).toBe('Excellent produit');
      expect(result.value.verifiedPurchase).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should fail when productId is missing', async () => {
      const result = await useCase.execute({
        productId: '',
        customerId: 'customer-123',
        orderId: 'order-123',
        rating: 5,
        title: 'Titre',
        content: 'Contenu',
        verifiedPurchase: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Product ID');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when customerId is missing', async () => {
      const result = await useCase.execute({
        productId: 'product-123',
        customerId: '',
        orderId: 'order-123',
        rating: 5,
        title: 'Titre',
        content: 'Contenu',
        verifiedPurchase: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Customer ID');
    });

    it('should fail when orderId is missing', async () => {
      const result = await useCase.execute({
        productId: 'product-123',
        customerId: 'customer-123',
        orderId: '',
        rating: 5,
        title: 'Titre',
        content: 'Contenu',
        verifiedPurchase: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Order ID');
    });

    it('should fail when rating is invalid', async () => {
      const result = await useCase.execute({
        productId: 'product-123',
        customerId: 'customer-123',
        orderId: 'order-123',
        rating: 10,
        title: 'Titre',
        content: 'Contenu',
        verifiedPurchase: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('entre 1 et 5');
    });

    it('should fail when title is missing', async () => {
      const result = await useCase.execute({
        productId: 'product-123',
        customerId: 'customer-123',
        orderId: 'order-123',
        rating: 5,
        title: '',
        content: 'Contenu',
        verifiedPurchase: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('titre');
    });

    it('should fail when content is missing', async () => {
      const result = await useCase.execute({
        productId: 'product-123',
        customerId: 'customer-123',
        orderId: 'order-123',
        rating: 5,
        title: 'Titre',
        content: '',
        verifiedPurchase: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('contenu');
    });

    it('should fail when customer already reviewed the product', async () => {
      const existingReview = Review.create({
        productId: 'product-123',
        customerId: 'customer-123',
        orderId: 'order-123',
        rating: Rating.create(5).value,
        title: 'Ancien avis',
        content: 'Ancien contenu',
        verifiedPurchase: true,
      }).value;

      mockRepository.findByCustomerAndProduct.mockResolvedValue(existingReview);

      const result = await useCase.execute({
        productId: 'product-123',
        customerId: 'customer-123',
        orderId: 'order-123',
        rating: 4,
        title: 'Nouvel avis',
        content: 'Nouveau contenu',
        verifiedPurchase: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('deja');
    });

    it('should accept all valid ratings (1-5)', async () => {
      mockRepository.findByCustomerAndProduct.mockResolvedValue(null);

      for (let rating = 1; rating <= 5; rating++) {
        mockRepository.save.mockClear();

        const result = await useCase.execute({
          productId: `product-${rating}`,
          customerId: 'customer-123',
          orderId: 'order-123',
          rating,
          title: 'Titre',
          content: 'Contenu',
          verifiedPurchase: true,
        });

        expect(result.isSuccess).toBe(true);
        expect(result.value.rating).toBe(rating);
      }
    });
  });
});
