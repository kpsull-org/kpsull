import { stripe } from '@/lib/stripe/client';
import { Result } from '@/shared/domain/result';
import {
  IStripeConnectService,
  CreateConnectAccountResult,
  StripeAccountStatus,
} from '../../application/ports/stripe-connect.service.interface';

/**
 * Stripe Connect Service Implementation
 *
 * Handles all Stripe Connect operations for creator onboarding.
 * Creates Express accounts for French creators.
 */
export class StripeConnectService implements IStripeConnectService {
  private get baseUrl(): string {
    return process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  }

  async createConnectAccount(
    email: string,
    businessName: string
  ): Promise<Result<CreateConnectAccountResult>> {
    try {
      // Create Stripe Connect Express account
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'FR',
        email,
        business_type: 'individual',
        business_profile: {
          name: businessName,
          product_description: 'Créateur sur Kpsull - Marketplace artisanale',
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      // Create onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${this.baseUrl}/onboarding/creator/step/3?refresh=true`,
        return_url: `${this.baseUrl}/onboarding/creator/step/3?success=true`,
        type: 'account_onboarding',
      });

      return Result.ok({
        accountId: account.id,
        onboardingUrl: accountLink.url,
      });
    } catch (error) {
      console.error('Stripe Connect account creation error:', error);
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      return Result.fail(`Erreur Stripe: ${message}`);
    }
  }

  async createAccountLink(accountId: string): Promise<Result<string>> {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${this.baseUrl}/onboarding/creator/step/3?refresh=true`,
        return_url: `${this.baseUrl}/onboarding/creator/step/3?success=true`,
        type: 'account_onboarding',
      });

      return Result.ok(accountLink.url);
    } catch (error) {
      console.error('Stripe account link creation error:', error);
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      return Result.fail(`Erreur Stripe: ${message}`);
    }
  }

  async checkAccountStatus(
    accountId: string
  ): Promise<Result<StripeAccountStatus>> {
    try {
      const account = await stripe.accounts.retrieve(accountId);

      const chargesEnabled = account.charges_enabled ?? false;
      const payoutsEnabled = account.payouts_enabled ?? false;
      const detailsSubmitted = account.details_submitted ?? false;

      return Result.ok({
        chargesEnabled,
        payoutsEnabled,
        detailsSubmitted,
        isFullyOnboarded: chargesEnabled && payoutsEnabled && detailsSubmitted,
      });
    } catch (error) {
      console.error('Stripe account status check error:', error);
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      return Result.fail(`Erreur Stripe: ${message}`);
    }
  }
}
