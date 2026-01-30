import { Result } from '@/shared/domain/result';
import {
  IStripeConnectService,
  CreateConnectAccountResult,
  StripeAccountStatus,
} from '../../application/ports/stripe-connect.service.interface';

/**
 * Mock Stripe Connect Service
 *
 * Used for development and testing without real Stripe API calls.
 * Simulates Stripe Connect behavior with predictable test data.
 */
export class MockStripeConnectService implements IStripeConnectService {
  private readonly mockDelay = 500; // Simulate API latency

  // Track created accounts for testing
  private accounts: Map<
    string,
    { email: string; businessName: string; isOnboarded: boolean }
  > = new Map();

  async createConnectAccount(
    email: string,
    businessName: string
  ): Promise<Result<CreateConnectAccountResult>> {
    await this.delay();

    // Generate a mock account ID
    const accountId = `acct_mock_${Date.now()}`;

    // Store the account
    this.accounts.set(accountId, {
      email,
      businessName,
      isOnboarded: false,
    });

    return Result.ok({
      accountId,
      onboardingUrl: `https://connect.stripe.com/mock-onboarding?account=${accountId}`,
    });
  }

  async createAccountLink(accountId: string): Promise<Result<string>> {
    await this.delay();

    if (!this.accounts.has(accountId) && !accountId.startsWith('acct_')) {
      return Result.fail('Compte Stripe introuvable');
    }

    return Result.ok(
      `https://connect.stripe.com/mock-onboarding/continue?account=${accountId}`
    );
  }

  async checkAccountStatus(
    accountId: string
  ): Promise<Result<StripeAccountStatus>> {
    await this.delay();

    const account = this.accounts.get(accountId);

    // For mock accounts we created
    if (account) {
      return Result.ok({
        chargesEnabled: account.isOnboarded,
        payoutsEnabled: account.isOnboarded,
        detailsSubmitted: account.isOnboarded,
        isFullyOnboarded: account.isOnboarded,
      });
    }

    // For existing accounts (from database), assume not fully onboarded
    // unless they contain 'onboarded' in the ID (for testing)
    if (accountId.includes('onboarded')) {
      return Result.ok({
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
        isFullyOnboarded: true,
      });
    }

    return Result.ok({
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      isFullyOnboarded: false,
    });
  }

  /**
   * Test helper: Mark an account as fully onboarded
   */
  markAsOnboarded(accountId: string): void {
    const account = this.accounts.get(accountId);
    if (account) {
      account.isOnboarded = true;
    }
  }

  private delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.mockDelay));
  }
}
