import { Result } from '@/shared/domain';

export interface CreateCheckoutSessionInput {
  customerId: string | null;
  email: string;
  userId: string;
  creatorId: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

/**
 * Stripe Billing Service Interface (Port)
 *
 * Defines the contract for Stripe subscription billing operations.
 */
export interface IStripeBillingService {
  /**
   * Create a Stripe Checkout Session for PRO plan upgrade
   */
  createCheckoutSession(
    input: CreateCheckoutSessionInput
  ): Promise<Result<CheckoutSessionResult>>;

  /**
   * Retrieve a Checkout Session by ID
   */
  getCheckoutSession(sessionId: string): Promise<Result<{
    subscriptionId: string;
    customerId: string;
    status: string;
    metadata: Record<string, string>;
  }>>;

  /**
   * Cancel a subscription
   */
  cancelSubscription(subscriptionId: string): Promise<Result<void>>;
}
