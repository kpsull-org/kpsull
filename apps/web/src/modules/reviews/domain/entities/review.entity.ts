import { Entity, UniqueId, Result } from '@/shared/domain';
import { Rating } from '../value-objects/rating.vo';

interface ReviewProps {
  productId: string;
  customerId: string;
  orderId: string;
  rating: Rating;
  title: string;
  content: string;
  verifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateReviewProps {
  productId: string;
  customerId: string;
  orderId: string;
  rating: Rating;
  title: string;
  content: string;
  verifiedPurchase: boolean;
}

interface ReconstituteReviewProps {
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

/**
 * Review Entity
 *
 * Represents a customer review for a product.
 * Reviews can only be created by customers who have purchased the product.
 */
export class Review extends Entity<ReviewProps> {
  private static readonly MAX_TITLE_LENGTH = 255;
  private static readonly MAX_CONTENT_LENGTH = 5000;

  private constructor(props: ReviewProps, id?: UniqueId) {
    super(props, id);
  }

  get idString(): string {
    return this._id.toString();
  }

  get productId(): string {
    return this.props.productId;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get orderId(): string {
    return this.props.orderId;
  }

  get rating(): Rating {
    return this.props.rating;
  }

  get title(): string {
    return this.props.title;
  }

  get content(): string {
    return this.props.content;
  }

  get verifiedPurchase(): boolean {
    return this.props.verifiedPurchase;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Update the review's title, content and rating
   */
  update(title: string, content: string, rating: Rating): Result<void> {
    const titleValidation = Review.validateTitle(title);
    if (titleValidation.isFailure) {
      return titleValidation;
    }

    const contentValidation = Review.validateContent(content);
    if (contentValidation.isFailure) {
      return contentValidation;
    }

    this.props.title = title.trim();
    this.props.content = content.trim();
    this.props.rating = rating;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  private static validateTitle(title: string): Result<void> {
    if (!title?.trim()) {
      return Result.fail('Le titre est requis');
    }

    if (title.trim().length > Review.MAX_TITLE_LENGTH) {
      return Result.fail(`Le titre ne peut pas depasser ${Review.MAX_TITLE_LENGTH} caracteres`);
    }

    return Result.ok();
  }

  private static validateContent(content: string): Result<void> {
    if (!content?.trim()) {
      return Result.fail('Le contenu est requis');
    }

    if (content.trim().length > Review.MAX_CONTENT_LENGTH) {
      return Result.fail(`Le contenu ne peut pas depasser ${Review.MAX_CONTENT_LENGTH} caracteres`);
    }

    return Result.ok();
  }

  static create(props: CreateReviewProps): Result<Review> {
    if (!props.productId?.trim()) {
      return Result.fail('Product ID est requis');
    }

    if (!props.customerId?.trim()) {
      return Result.fail('Customer ID est requis');
    }

    if (!props.orderId?.trim()) {
      return Result.fail('Order ID est requis');
    }

    const titleValidation = Review.validateTitle(props.title);
    if (titleValidation.isFailure) {
      return Result.fail(titleValidation.error!);
    }

    const contentValidation = Review.validateContent(props.content);
    if (contentValidation.isFailure) {
      return Result.fail(contentValidation.error!);
    }

    const now = new Date();

    return Result.ok(
      new Review({
        productId: props.productId,
        customerId: props.customerId,
        orderId: props.orderId,
        rating: props.rating,
        title: props.title.trim(),
        content: props.content.trim(),
        verifiedPurchase: props.verifiedPurchase,
        createdAt: now,
        updatedAt: now,
      })
    );
  }

  static reconstitute(props: ReconstituteReviewProps): Result<Review> {
    const ratingResult = Rating.create(props.rating);
    if (ratingResult.isFailure) {
      return Result.fail(ratingResult.error!);
    }

    return Result.ok(
      new Review(
        {
          productId: props.productId,
          customerId: props.customerId,
          orderId: props.orderId,
          rating: ratingResult.value,
          title: props.title,
          content: props.content,
          verifiedPurchase: props.verifiedPurchase,
          createdAt: props.createdAt,
          updatedAt: props.updatedAt,
        },
        UniqueId.fromString(props.id)
      )
    );
  }
}
