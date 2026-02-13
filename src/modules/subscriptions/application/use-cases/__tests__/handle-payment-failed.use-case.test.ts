import { describe, it, expect, beforeEach } from 'vitest';
import { HandlePaymentFailedUseCase } from '../handle-payment-failed.use-case';
import { TestSubscriptionRepository } from '../../../__tests__/helpers/test-subscription.repository';
import { createTestSubscription } from '../../../__tests__/helpers/subscription.factory';

describe('HandlePaymentFailedUseCase', () => {
  let useCase: HandlePaymentFailedUseCase;
  let mockRepo: TestSubscriptionRepository;

  beforeEach(() => {
    mockRepo = new TestSubscriptionRepository();
    useCase = new HandlePaymentFailedUseCase(mockRepo);
  });

  describe('execute', () => {
    it('should mark STUDIO subscription as PAST_DUE', async () => {
      mockRepo.set('creator-1', createTestSubscription({
        plan: 'STUDIO', productsUsed: 15, pinnedProductsUsed: 3,
      }));

      const result = await useCase.execute({ stripeSubscriptionId: 'sub_stripe_123', failedAt: new Date() });

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('PAST_DUE');
      expect(result.value.gracePeriodStart).toBeDefined();
      expect(mockRepo.savedSubscription).not.toBeNull();
    });

    it('should mark ATELIER subscription as PAST_DUE', async () => {
      mockRepo.set('creator-1', createTestSubscription({
        plan: 'ATELIER', productsUsed: 100, pinnedProductsUsed: 50,
        stripeSubscriptionId: 'sub_stripe_456', stripeCustomerId: 'cus_456', stripePriceId: 'price_456',
      }));

      const result = await useCase.execute({ stripeSubscriptionId: 'sub_stripe_456', failedAt: new Date() });

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('PAST_DUE');
    });

    it('should mark ESSENTIEL subscription as PAST_DUE', async () => {
      mockRepo.set('creator-1', createTestSubscription({
        billingInterval: 'month',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        productsUsed: 5, pinnedProductsUsed: 2,
        stripeSubscriptionId: 'sub_stripe_789', stripeCustomerId: 'cus_789', stripePriceId: 'price_789',
      }));

      const result = await useCase.execute({ stripeSubscriptionId: 'sub_stripe_789', failedAt: new Date() });

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('PAST_DUE');
      expect(result.value.gracePeriodStart).toBeDefined();
    });

    it('should fail if subscription not found', async () => {
      const result = await useCase.execute({ stripeSubscriptionId: 'non_existent', failedAt: new Date() });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvé');
    });

    it('should fail if stripeSubscriptionId is empty', async () => {
      const result = await useCase.execute({ stripeSubscriptionId: '', failedAt: new Date() });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Stripe subscription ID');
    });

    it('should not change status if already PAST_DUE', async () => {
      mockRepo.set('creator-1', createTestSubscription({
        plan: 'STUDIO', status: 'PAST_DUE',
        productsUsed: 10, pinnedProductsUsed: 3,
        gracePeriodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      }));

      const result = await useCase.execute({ stripeSubscriptionId: 'sub_stripe_123', failedAt: new Date() });

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('PAST_DUE');
    });

    it('should handle monthly billing interval subscriptions', async () => {
      mockRepo.set('creator-1', createTestSubscription({
        billingInterval: 'month',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        productsUsed: 5, pinnedProductsUsed: 1,
        stripeSubscriptionId: 'sub_stripe_monthly', stripeCustomerId: 'cus_monthly', stripePriceId: 'price_monthly',
      }));

      const result = await useCase.execute({ stripeSubscriptionId: 'sub_stripe_monthly', failedAt: new Date() });

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('PAST_DUE');
    });
  });
});
