import { Review } from '../../domain/entities/review.entity';

export interface ReviewFilters {
  verifiedPurchase?: boolean;
  minRating?: number;
  maxRating?: number;
}

export interface PaginationOptions {
  skip: number;
  take: number;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ReviewRepository {
  /**
   * Save a review (create or update)
   */
  save(review: Review): Promise<void>;

  /**
   * Find a review by its ID
   */
  findById(id: string): Promise<Review | null>;

  /**
   * Find a review by customer and product
   * Used to check if a customer already reviewed a product
   */
  findByCustomerAndProduct(customerId: string, productId: string): Promise<Review | null>;

  /**
   * Find a review by customer and order
   * Used to verify the customer has an order for the product
   */
  findByCustomerAndOrder(customerId: string, orderId: string): Promise<Review | null>;

  /**
   * Find reviews by product ID with optional filters and pagination
   */
  findByProductId(
    productId: string,
    filters?: ReviewFilters,
    pagination?: PaginationOptions
  ): Promise<{ reviews: Review[]; total: number }>;

  /**
   * Find reviews by customer ID with pagination
   */
  findByCustomerId(
    customerId: string,
    pagination?: PaginationOptions
  ): Promise<{ reviews: Review[]; total: number }>;

  /**
   * Get review statistics for a product
   */
  getProductStats(productId: string): Promise<ReviewStats>;

  /**
   * Delete a review
   */
  delete(id: string): Promise<void>;
}
