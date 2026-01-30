import { Result } from '@/shared/domain';

export type LimitStatus = 'OK' | 'WARNING' | 'BLOCKED';

export interface LimitCheckResult {
  status: LimitStatus;
  current: number;
  limit: number;
  message?: string;
}

/**
 * Interface for subscription service operations related to products.
 * This is a port that the infrastructure layer will implement.
 */
export interface SubscriptionService {
  /**
   * Check if the creator can publish more products
   */
  checkProductLimit(creatorId: string): Promise<Result<LimitCheckResult>>;

  /**
   * Increment the product count after publishing
   */
  incrementProductCount(creatorId: string): Promise<Result<void>>;

  /**
   * Decrement the product count after unpublishing
   */
  decrementProductCount(creatorId: string): Promise<Result<void>>;
}
