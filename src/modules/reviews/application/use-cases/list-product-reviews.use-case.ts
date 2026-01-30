import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application/use-case.interface';
import type { ReviewRepository, ReviewFilters, ReviewStats } from '../ports/review.repository.interface';

export interface ListProductReviewsInput {
  productId: string;
  page: number;
  pageSize: number;
  verifiedPurchaseOnly?: boolean;
  minRating?: number;
  maxRating?: number;
}

export interface ReviewDTO {
  id: string;
  productId: string;
  customerId: string;
  orderId: string;
  rating: number;
  title: string;
  content: string;
  verifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListProductReviewsOutput {
  reviews: ReviewDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  stats: ReviewStats;
}

/**
 * Use Case: List Product Reviews
 *
 * Returns paginated reviews for a product with statistics.
 */
export class ListProductReviewsUseCase
  implements UseCase<ListProductReviewsInput, ListProductReviewsOutput>
{
  private static readonly MAX_PAGE_SIZE = 100;

  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute(input: ListProductReviewsInput): Promise<Result<ListProductReviewsOutput>> {
    // Validate input
    if (!input.productId?.trim()) {
      return Result.fail('Product ID est requis');
    }

    if (input.page < 1) {
      return Result.fail('La page doit etre superieure ou egale a 1');
    }

    if (input.pageSize < 1) {
      return Result.fail('Le pageSize doit etre superieur ou egal a 1');
    }

    if (input.pageSize > ListProductReviewsUseCase.MAX_PAGE_SIZE) {
      return Result.fail(`Le pageSize ne peut pas depasser ${ListProductReviewsUseCase.MAX_PAGE_SIZE}`);
    }

    // Build filters
    const filters: ReviewFilters = {};
    if (input.verifiedPurchaseOnly) {
      filters.verifiedPurchase = true;
    }
    if (input.minRating !== undefined) {
      filters.minRating = input.minRating;
    }
    if (input.maxRating !== undefined) {
      filters.maxRating = input.maxRating;
    }

    // Calculate pagination
    const skip = (input.page - 1) * input.pageSize;

    // Fetch reviews and stats in parallel
    const [reviewsResult, stats] = await Promise.all([
      this.reviewRepository.findByProductId(
        input.productId,
        filters,
        { skip, take: input.pageSize }
      ),
      this.reviewRepository.getProductStats(input.productId),
    ]);

    // Map to DTOs
    const reviewDTOs: ReviewDTO[] = reviewsResult.reviews.map((review) => ({
      id: review.idString,
      productId: review.productId,
      customerId: review.customerId,
      orderId: review.orderId,
      rating: review.rating.value,
      title: review.title,
      content: review.content,
      verifiedPurchase: review.verifiedPurchase,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(reviewsResult.total / input.pageSize);
    const hasNextPage = input.page < totalPages;

    return Result.ok({
      reviews: reviewDTOs,
      total: reviewsResult.total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages,
      hasNextPage,
      stats,
    });
  }
}
