import { Subscription } from '../../domain/entities/subscription.entity';

/**
 * Subscription Repository Interface (Port)
 *
 * Defines the contract for subscription persistence operations.
 */
export interface SubscriptionRepository {
  /**
   * Find subscription by ID
   */
  findById(id: string): Promise<Subscription | null>;

  /**
   * Find subscription by user ID
   */
  findByUserId(userId: string): Promise<Subscription | null>;

  /**
   * Find subscription by creator ID
   */
  findByCreatorId(creatorId: string): Promise<Subscription | null>;

  /**
   * Save subscription (create or update)
   */
  save(subscription: Subscription): Promise<void>;

  /**
   * Check if user has a subscription
   */
  existsByUserId(userId: string): Promise<boolean>;

  /**
   * Find subscription by Stripe subscription ID
   */
  findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null>;

  /**
   * Find all subscriptions with PAST_DUE status
   */
  findAllPastDue(): Promise<Subscription[]>;
}
