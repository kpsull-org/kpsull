import { describe, it, expect, beforeEach } from 'vitest';
import { CancelSubscriptionUseCase } from '../cancel-subscription.use-case';
import { TestSubscriptionRepository } from '../../../__tests__/helpers/test-subscription.repository';
import { createTestSubscription } from '../../../__tests__/helpers/subscription.factory';

describe('CancelSubscriptionUseCase', () => {
  let useCase: CancelSubscriptionUseCase;
  let mockRepo: TestSubscriptionRepository;

  beforeEach(() => {
    mockRepo = new TestSubscriptionRepository();
    useCase = new CancelSubscriptionUseCase(mockRepo);
  });

  describe('execute', () => {
    it('should cancel ESSENTIEL subscription immediately', async () => {
      mockRepo.set('creator-1', createTestSubscription({ productsUsed: 5, pinnedProductsUsed: 2 }));

      const result = await useCase.execute({ creatorId: 'creator-1', reason: 'User request', immediate: true });

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('CANCELLED');
      expect(result.value.plan).toBe('ESSENTIEL');
      expect(result.value.canceledAt).toBeDefined();
      expect(result.value.effectiveDate).toEqual(result.value.canceledAt);
      expect(mockRepo.savedSubscription).not.toBeNull();
    });

    it('should cancel STUDIO subscription at period end', async () => {
      const periodEnd = new Date('2026-06-15');
      mockRepo.set('creator-1', createTestSubscription({
        plan: 'STUDIO', currentPeriodEnd: periodEnd,
        productsUsed: 15, pinnedProductsUsed: 4,
        stripeSubscriptionId: 'sub_stripe_456', stripeCustomerId: 'cus_456', stripePriceId: 'price_456',
      }));

      const result = await useCase.execute({ creatorId: 'creator-1', reason: 'Switching to competitor', immediate: false });

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('CANCELLED');
      expect(result.value.plan).toBe('STUDIO');
      expect(result.value.effectiveDate).toEqual(periodEnd);
    });

    it('should cancel ATELIER subscription successfully', async () => {
      mockRepo.set('creator-1', createTestSubscription({
        plan: 'ATELIER', productsUsed: 100, pinnedProductsUsed: 50,
        stripeSubscriptionId: 'sub_stripe_789', stripeCustomerId: 'cus_789', stripePriceId: 'price_789',
      }));

      const result = await useCase.execute({ creatorId: 'creator-1', immediate: true });

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('CANCELLED');
      expect(result.value.plan).toBe('ATELIER');
    });

    it('should cancel monthly subscription at period end by default', async () => {
      const periodEnd = new Date('2026-02-15');
      mockRepo.set('creator-1', createTestSubscription({
        billingInterval: 'month', currentPeriodEnd: periodEnd,
        productsUsed: 3, pinnedProductsUsed: 1,
        stripeSubscriptionId: 'sub_monthly', stripeCustomerId: 'cus_monthly', stripePriceId: 'price_monthly',
      }));

      const result = await useCase.execute({ creatorId: 'creator-1', immediate: false });

      expect(result.isSuccess).toBe(true);
      expect(result.value.effectiveDate).toEqual(periodEnd);
    });

    it('should cancel PAST_DUE subscription', async () => {
      mockRepo.set('creator-1', createTestSubscription({
        plan: 'STUDIO', status: 'PAST_DUE',
        productsUsed: 10, pinnedProductsUsed: 3,
        stripeSubscriptionId: 'sub_past_due', stripeCustomerId: 'cus_past_due', stripePriceId: 'price_past_due',
        gracePeriodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      }));

      const result = await useCase.execute({ creatorId: 'creator-1', reason: 'Grace period expired', immediate: true });

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('CANCELLED');
    });

    it('should fail when creatorId is empty', async () => {
      const result = await useCase.execute({ creatorId: '', immediate: true });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should fail when subscription not found', async () => {
      const result = await useCase.execute({ creatorId: 'non-existent', immediate: true });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouve');
    });

    it('should fail when subscription is already cancelled', async () => {
      mockRepo.set('creator-1', createTestSubscription({
        status: 'CANCELLED', productsUsed: 5, pinnedProductsUsed: 2,
        stripeSubscriptionId: null, stripePriceId: null,
      }));

      const result = await useCase.execute({ creatorId: 'creator-1', immediate: true });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('deja annule');
    });

    it('should clear stripeSubscriptionId on cancellation', async () => {
      mockRepo.set('creator-1', createTestSubscription({
        plan: 'STUDIO', productsUsed: 10, pinnedProductsUsed: 3,
        stripeSubscriptionId: 'sub_to_clear',
      }));

      const result = await useCase.execute({ creatorId: 'creator-1', immediate: true });

      expect(result.isSuccess).toBe(true);
      expect(mockRepo.savedSubscription!.stripeSubscriptionId).toBeNull();
    });

    it('should return subscriptionId in output', async () => {
      mockRepo.set('creator-1', createTestSubscription({
        id: 'sub-unique-id', billingInterval: 'month',
        productsUsed: 2, pinnedProductsUsed: 1,
        stripeSubscriptionId: 'sub_stripe_test', stripeCustomerId: 'cus_test', stripePriceId: 'price_test',
      }));

      const result = await useCase.execute({ creatorId: 'creator-1', reason: 'Testing', immediate: true });

      expect(result.isSuccess).toBe(true);
      expect(result.value.subscriptionId).toBe('sub-unique-id');
    });

    it('should handle cancel without reason', async () => {
      mockRepo.set('creator-1', createTestSubscription({
        plan: 'ATELIER', productsUsed: 50, pinnedProductsUsed: 20,
        stripeSubscriptionId: 'sub_atelier', stripeCustomerId: 'cus_atelier', stripePriceId: 'price_atelier',
      }));

      const result = await useCase.execute({ creatorId: 'creator-1', immediate: true });

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('CANCELLED');
    });
  });
});
