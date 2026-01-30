import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application/use-case.interface';
import type { ReviewRepository } from '../ports/review.repository.interface';
import { Review } from '../../domain/entities/review.entity';
import { Rating } from '../../domain/value-objects/rating.vo';

export interface CreateReviewInput {
  productId: string;
  customerId: string;
  orderId: string;
  rating: number;
  title: string;
  content: string;
  verifiedPurchase: boolean;
}

export interface CreateReviewOutput {
  id: string;
  productId: string;
  customerId: string;
  orderId: string;
  rating: number;
  title: string;
  content: string;
  verifiedPurchase: boolean;
  createdAt: Date;
}

/**
 * Use Case: Create Review
 *
 * Creates a new review for a product.
 * A customer can only have one review per product.
 */
export class CreateReviewUseCase
  implements UseCase<CreateReviewInput, CreateReviewOutput>
{
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute(input: CreateReviewInput): Promise<Result<CreateReviewOutput>> {
    // Validate input
    if (!input.productId?.trim()) {
      return Result.fail('Product ID est requis');
    }

    if (!input.customerId?.trim()) {
      return Result.fail('Customer ID est requis');
    }

    if (!input.orderId?.trim()) {
      return Result.fail('Order ID est requis');
    }

    // Validate rating
    const ratingResult = Rating.create(input.rating);
    if (ratingResult.isFailure) {
      return Result.fail(ratingResult.error!);
    }

    // Check if customer already reviewed this product
    const existingReview = await this.reviewRepository.findByCustomerAndProduct(
      input.customerId,
      input.productId
    );

    if (existingReview) {
      return Result.fail('Vous avez deja laisse un avis pour ce produit');
    }

    // Create review
    const reviewResult = Review.create({
      productId: input.productId,
      customerId: input.customerId,
      orderId: input.orderId,
      rating: ratingResult.value,
      title: input.title,
      content: input.content,
      verifiedPurchase: input.verifiedPurchase,
    });

    if (reviewResult.isFailure) {
      return Result.fail(reviewResult.error!);
    }

    const review = reviewResult.value;

    // Save review
    await this.reviewRepository.save(review);

    return Result.ok({
      id: review.idString,
      productId: review.productId,
      customerId: review.customerId,
      orderId: review.orderId,
      rating: review.rating.value,
      title: review.title,
      content: review.content,
      verifiedPurchase: review.verifiedPurchase,
      createdAt: review.createdAt,
    });
  }
}
