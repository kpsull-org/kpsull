import { Result } from '@/shared/domain/result';

/**
 * Result of creating a Stripe Connect account
 */
export interface CreateConnectAccountResult {
  accountId: string;
  onboardingUrl: string;
}

/**
 * Stripe Connect account status
 */
export interface StripeAccountStatus {
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  isFullyOnboarded: boolean;
}

/**
 * Port for Stripe Connect operations
 *
 * This interface defines the contract for interacting with Stripe Connect.
 * The actual implementation can be the real Stripe API or a mock for testing.
 */
export interface IStripeConnectService {
  /**
   * Create a new Stripe Connect Express account
   *
   * @param email User's email
   * @param businessName Business/brand name
   * @returns Account ID and onboarding URL
   */
  createConnectAccount(
    email: string,
    businessName: string
  ): Promise<Result<CreateConnectAccountResult>>;

  /**
   * Create a new account link for onboarding continuation
   *
   * @param accountId Existing Stripe account ID
   * @returns Onboarding URL
   */
  createAccountLink(accountId: string): Promise<Result<string>>;

  /**
   * Check the status of a Stripe Connect account
   *
   * @param accountId Stripe account ID
   * @returns Account status including charges/payouts enabled
   */
  checkAccountStatus(accountId: string): Promise<Result<StripeAccountStatus>>;
}
