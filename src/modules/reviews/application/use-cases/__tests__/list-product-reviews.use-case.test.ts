import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { ListProductReviewsUseCase } from '../list-product-reviews.use-case';
import type { ReviewRepository, ReviewStats } from '../../ports/review.repository.interface';
import { Review } from '../../../domain/entities/review.entity';

describe('ListProductReviews Use Case', () => {
  let useCase: ListProductReviewsUseCase;
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
      save: vi.fn(),
      findById: vi.fn(),
      findByCustomerAndProduct: vi.fn(),
      findByCustomerAndOrder: vi.fn(),
      findByProductId: vi.fn(),
      findByCustomerId: vi.fn(),
      getProductStats: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new ListProductReviewsUseCase(mockRepository as unknown as ReviewRepository);
  });

  describe('execute', () => {
    it('should return reviews with stats for a product', async () => {
      const reviews = [
        createTestReview('review-1', 'product-123', 5),
        createTestReview('review-2', 'product-123', 4),
      ];

      const stats: ReviewStats = {
        averageRating: 4.5,
        totalReviews: 2,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
      };

      mockRepository.findByProductId.mockResolvedValue({ reviews, total: 2 });
      mockRepository.getProductStats.mockResolvedValue(stats);

      const result = await useCase.execute({
        productId: 'product-123',
        page: 1,
        pageSize: 10,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.reviews).toHaveLength(2);
      expect(result.value.total).toBe(2);
      expect(result.value.stats.averageRating).toBe(4.5);
      expect(result.value.stats.totalReviews).toBe(2);
    });

    it('should return empty list when no reviews exist', async () => {
      const stats: ReviewStats = {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };

      mockRepository.findByProductId.mockResolvedValue({ reviews: [], total: 0 });
      mockRepository.getProductStats.mockResolvedValue(stats);

      const result = await useCase.execute({
        productId: 'product-123',
        page: 1,
        pageSize: 10,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.reviews).toHaveLength(0);
      expect(result.value.total).toBe(0);
      expect(result.value.stats.averageRating).toBe(0);
    });

    it('should apply pagination correctly', async () => {
      mockRepository.findByProductId.mockResolvedValue({ reviews: [], total: 0 });
      mockRepository.getProductStats.mockResolvedValue({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });

      await useCase.execute({
        productId: 'product-123',
        page: 2,
        pageSize: 10,
      });

      expect(mockRepository.findByProductId).toHaveBeenCalledWith(
        'product-123',
        {},
        { skip: 10, take: 10 }
      );
    });

    it('should apply filters correctly', async () => {
      mockRepository.findByProductId.mockResolvedValue({ reviews: [], total: 0 });
      mockRepository.getProductStats.mockResolvedValue({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });

      await useCase.execute({
        productId: 'product-123',
        page: 1,
        pageSize: 10,
        verifiedPurchaseOnly: true,
        minRating: 4,
      });

      expect(mockRepository.findByProductId).toHaveBeenCalledWith(
        'product-123',
        { verifiedPurchase: true, minRating: 4 },
        { skip: 0, take: 10 }
      );
    });

    it('should apply maxRating filter correctly', async () => {
      mockRepository.findByProductId.mockResolvedValue({ reviews: [], total: 0 });
      mockRepository.getProductStats.mockResolvedValue({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });

      await useCase.execute({
        productId: 'product-123',
        page: 1,
        pageSize: 10,
        maxRating: 3,
      });

      expect(mockRepository.findByProductId).toHaveBeenCalledWith(
        'product-123',
        { maxRating: 3 },
        { skip: 0, take: 10 }
      );
    });

    it('should fail when productId is missing', async () => {
      const result = await useCase.execute({
        productId: '',
        page: 1,
        pageSize: 10,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Product ID');
    });

    it('should fail when page is less than 1', async () => {
      const result = await useCase.execute({
        productId: 'product-123',
        page: 0,
        pageSize: 10,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('page');
    });

    it('should fail when pageSize is less than 1', async () => {
      const result = await useCase.execute({
        productId: 'product-123',
        page: 1,
        pageSize: 0,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('pageSize');
    });

    it('should fail when pageSize exceeds maximum', async () => {
      const result = await useCase.execute({
        productId: 'product-123',
        page: 1,
        pageSize: 101,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('100');
    });

    it('should calculate hasNextPage correctly', async () => {
      const reviews = [createTestReview('review-1', 'product-123', 5)];

      mockRepository.findByProductId.mockResolvedValue({ reviews, total: 25 });
      mockRepository.getProductStats.mockResolvedValue({
        averageRating: 5,
        totalReviews: 25,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 25 },
      });

      const result = await useCase.execute({
        productId: 'product-123',
        page: 2,
        pageSize: 10,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.hasNextPage).toBe(true);
      expect(result.value.totalPages).toBe(3);
    });

    it('should return hasNextPage false on last page', async () => {
      const reviews = [createTestReview('review-1', 'product-123', 5)];

      mockRepository.findByProductId.mockResolvedValue({ reviews, total: 15 });
      mockRepository.getProductStats.mockResolvedValue({
        averageRating: 5,
        totalReviews: 15,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 15 },
      });

      const result = await useCase.execute({
        productId: 'product-123',
        page: 2,
        pageSize: 10,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.hasNextPage).toBe(false);
      expect(result.value.totalPages).toBe(2);
    });

    it('should return rating distribution in stats', async () => {
      const stats: ReviewStats = {
        averageRating: 3.5,
        totalReviews: 10,
        ratingDistribution: { 1: 1, 2: 1, 3: 2, 4: 3, 5: 3 },
      };

      mockRepository.findByProductId.mockResolvedValue({ reviews: [], total: 10 });
      mockRepository.getProductStats.mockResolvedValue(stats);

      const result = await useCase.execute({
        productId: 'product-123',
        page: 1,
        pageSize: 10,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.stats.ratingDistribution).toEqual({
        1: 1,
        2: 1,
        3: 2,
        4: 3,
        5: 3,
      });
    });
  });
});

function createTestReview(id: string, productId: string, rating: number): Review {
  return Review.reconstitute({
    id,
    productId,
    customerId: 'customer-123',
    orderId: 'order-123',
    rating,
    title: `Review ${id}`,
    content: 'Test content',
    verifiedPurchase: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).value;
}
