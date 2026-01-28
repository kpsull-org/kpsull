import { CreatorOnboarding } from '../../domain/entities/creator-onboarding.entity';

/**
 * CreatorOnboarding Repository Interface (Port)
 *
 * This interface defines the contract for creator onboarding persistence operations.
 */
export interface CreatorOnboardingRepository {
  /**
   * Finds a creator onboarding by its unique ID
   * @param id - The onboarding's unique identifier
   * @returns The onboarding if found, null otherwise
   */
  findById(id: string): Promise<CreatorOnboarding | null>;

  /**
   * Finds a creator onboarding by user ID
   * @param userId - The user's unique identifier
   * @returns The onboarding if found, null otherwise
   */
  findByUserId(userId: string): Promise<CreatorOnboarding | null>;

  /**
   * Saves a creator onboarding (creates or updates)
   * @param onboarding - The onboarding entity to save
   */
  save(onboarding: CreatorOnboarding): Promise<void>;

  /**
   * Checks if a user already has an onboarding record
   * @param userId - The user ID to check
   * @returns True if an onboarding exists for this user
   */
  existsByUserId(userId: string): Promise<boolean>;

  /**
   * Deletes a creator onboarding by ID
   * @param id - The onboarding's unique identifier
   */
  delete(id: string): Promise<void>;

  /**
   * Finds a creator onboarding by Stripe account ID
   * @param stripeAccountId - The Stripe Connect account ID
   * @returns The onboarding if found, null otherwise
   */
  findByStripeAccountId(stripeAccountId: string): Promise<CreatorOnboarding | null>;
}
