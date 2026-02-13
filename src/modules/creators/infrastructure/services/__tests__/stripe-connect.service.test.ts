import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StripeConnectService } from '../stripe-connect.service';
import type Stripe from 'stripe';

// Mock the stripe client
vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    accounts: {
      create: vi.fn(),
      retrieve: vi.fn(),
    },
    accountLinks: {
      create: vi.fn(),
    },
  },
}));

import { stripe } from '@/lib/stripe/client';

const mockStripe = stripe as unknown as {
  accounts: {
    create: ReturnType<typeof vi.fn>;
    retrieve: ReturnType<typeof vi.fn>;
  };
  accountLinks: {
    create: ReturnType<typeof vi.fn>;
  };
};

describe('StripeConnectService', () => {
  let service: StripeConnectService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new StripeConnectService();
  });

  describe('createConnectAccount', () => {
    it('should create a Stripe Connect Express account successfully', async () => {
      const mockAccount = {
        id: 'acct_test123',
        type: 'express',
      } as Stripe.Account;

      const mockAccountLink = {
        url: 'https://connect.stripe.com/onboarding/test',
      } as Stripe.AccountLink;

      mockStripe.accounts.create.mockResolvedValue(mockAccount);
      mockStripe.accountLinks.create.mockResolvedValue(mockAccountLink);

      const result = await service.createConnectAccount(
        'test@example.com',
        'Test Brand'
      );

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual({
        accountId: 'acct_test123',
        onboardingUrl: 'https://connect.stripe.com/onboarding/test',
      });

      expect(mockStripe.accounts.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'express',
          country: 'FR',
          email: 'test@example.com',
          business_type: 'individual',
          business_profile: expect.objectContaining({
            name: 'Test Brand',
          }),
        })
      );
    });

    it('should return failure when Stripe account creation fails', async () => {
      mockStripe.accounts.create.mockRejectedValue(new Error('Stripe error'));

      const result = await service.createConnectAccount(
        'test@example.com',
        'Test Brand'
      );

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Erreur Stripe: Stripe error');
    });

    it('should return failure when account link creation fails', async () => {
      const mockAccount = { id: 'acct_test123' } as Stripe.Account;
      mockStripe.accounts.create.mockResolvedValue(mockAccount);
      mockStripe.accountLinks.create.mockRejectedValue(
        new Error('Link creation failed')
      );

      const result = await service.createConnectAccount(
        'test@example.com',
        'Test Brand'
      );

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Erreur Stripe: Link creation failed');
    });
  });

  describe('createAccountLink', () => {
    it('should create account link for existing account', async () => {
      const mockAccountLink = {
        url: 'https://connect.stripe.com/onboarding/continue',
      } as Stripe.AccountLink;

      mockStripe.accountLinks.create.mockResolvedValue(mockAccountLink);

      const result = await service.createAccountLink('acct_existing123');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(
        'https://connect.stripe.com/onboarding/continue'
      );

      expect(mockStripe.accountLinks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          account: 'acct_existing123',
          type: 'account_onboarding',
        })
      );
    });

    it('should return failure when account link creation fails', async () => {
      mockStripe.accountLinks.create.mockRejectedValue(
        new Error('Invalid account')
      );

      const result = await service.createAccountLink('acct_invalid');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Erreur Stripe: Invalid account');
    });
  });

  describe('checkAccountStatus', () => {
    it('should return fully onboarded status when all capabilities enabled', async () => {
      const mockAccount = {
        id: 'acct_test123',
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
      } as Stripe.Account;

      mockStripe.accounts.retrieve.mockResolvedValue(mockAccount);

      const result = await service.checkAccountStatus('acct_test123');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual({
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
        isFullyOnboarded: true,
      });
    });

    it('should return not fully onboarded when charges not enabled', async () => {
      const mockAccount = {
        id: 'acct_test123',
        charges_enabled: false,
        payouts_enabled: true,
        details_submitted: true,
      } as Stripe.Account;

      mockStripe.accounts.retrieve.mockResolvedValue(mockAccount);

      const result = await service.checkAccountStatus('acct_test123');

      expect(result.isSuccess).toBe(true);
      expect(result.value?.isFullyOnboarded).toBe(false);
    });

    it('should return not fully onboarded when payouts not enabled', async () => {
      const mockAccount = {
        id: 'acct_test123',
        charges_enabled: true,
        payouts_enabled: false,
        details_submitted: true,
      } as Stripe.Account;

      mockStripe.accounts.retrieve.mockResolvedValue(mockAccount);

      const result = await service.checkAccountStatus('acct_test123');

      expect(result.isSuccess).toBe(true);
      expect(result.value?.isFullyOnboarded).toBe(false);
    });

    it('should return not fully onboarded when details not submitted', async () => {
      const mockAccount = {
        id: 'acct_test123',
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: false,
      } as Stripe.Account;

      mockStripe.accounts.retrieve.mockResolvedValue(mockAccount);

      const result = await service.checkAccountStatus('acct_test123');

      expect(result.isSuccess).toBe(true);
      expect(result.value?.isFullyOnboarded).toBe(false);
    });

    it('should return failure when account retrieval fails', async () => {
      mockStripe.accounts.retrieve.mockRejectedValue(
        new Error('Account not found')
      );

      const result = await service.checkAccountStatus('acct_invalid');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Erreur Stripe: Account not found');
    });
  });
});
