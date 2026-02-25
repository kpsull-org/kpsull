import { describe, it, expect, beforeEach } from 'vitest';
import { UpgradeSubscriptionUseCase } from '../upgrade-subscription.use-case';
import { TestSubscriptionRepository } from '../../../__tests__/helpers/test-subscription.repository';
import { createTestSubscription } from '../../../__tests__/helpers/subscription.factory';

describe('UpgradeSubscriptionUseCase', () => {
  let useCase: UpgradeSubscriptionUseCase;
  let mockRepo: TestSubscriptionRepository;

  const periodStart = new Date('2026-01-28');
  const periodEnd = new Date('2027-01-28');

  beforeEach(() => {
    mockRepo = new TestSubscriptionRepository();
    useCase = new UpgradeSubscriptionUseCase(mockRepo);
  });

  describe('execute', () => {
    it('should upgrade ESSENTIEL to STUDIO successfully', async () => {
      mockRepo.set('creator-1', createTestSubscription({
        productsUsed: 8, pinnedProductsUsed: 2,
        stripeSubscriptionId: 'sub_old_123',
      }));

      const result = await useCase.execute({
        creatorId: 'creator-1', targetPlan: 'STUDIO', billingInterval: 'year',
        stripeSubscriptionId: 'sub_new_123', stripeCustomerId: 'cus_123', stripePriceId: 'price_studio_year',
        periodStart, periodEnd,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.plan).toBe('STUDIO');
      expect(result.value.previousPlan).toBe('ESSENTIEL');
      expect(result.value.commissionRate).toBe(0.04);
      expect(result.value.stripeSubscriptionId).toBe('sub_new_123');
      expect(mockRepo.savedSubscription).not.toBeNull();
    });

    it('should upgrade ESSENTIEL to ATELIER successfully', async () => {
      mockRepo.set('creator-1', createTestSubscription({
        productsUsed: 5, pinnedProductsUsed: 1,
        stripeSubscriptionId: 'sub_old_123',
      }));

      const result = await useCase.execute({
        creatorId: 'creator-1', targetPlan: 'ATELIER', billingInterval: 'year',
        stripeSubscriptionId: 'sub_new_456', stripeCustomerId: 'cus_123', stripePriceId: 'price_atelier_year',
        periodStart, periodEnd,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.plan).toBe('ATELIER');
      expect(result.value.previousPlan).toBe('ESSENTIEL');
      expect(result.value.commissionRate).toBe(0.03);
    });

    it('should upgrade STUDIO to ATELIER successfully', async () => {
      mockRepo.set('creator-1', createTestSubscription({
        plan: 'STUDIO', productsUsed: 18, pinnedProductsUsed: 4,
        stripeSubscriptionId: 'sub_studio_123', stripeCustomerId: 'cus_456',
      }));

      const result = await useCase.execute({
        creatorId: 'creator-1', targetPlan: 'ATELIER', billingInterval: 'year',
        stripeSubscriptionId: 'sub_new_789', stripeCustomerId: 'cus_456', stripePriceId: 'price_atelier_year',
        periodStart, periodEnd,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.plan).toBe('ATELIER');
      expect(result.value.previousPlan).toBe('STUDIO');
      expect(result.value.commissionRate).toBe(0.03);
    });

    it('should change billing interval from monthly to yearly', async () => {
      mockRepo.set('creator-1', createTestSubscription({
        billingInterval: 'month', productsUsed: 3, pinnedProductsUsed: 1,
        stripeSubscriptionId: 'sub_monthly_123',
      }));

      const result = await useCase.execute({
        creatorId: 'creator-1', targetPlan: 'STUDIO', billingInterval: 'year',
        stripeSubscriptionId: 'sub_yearly_456', stripeCustomerId: 'cus_123', stripePriceId: 'price_studio_year',
        periodStart, periodEnd,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.billingInterval).toBe('year');
    });

    it('should fail when trying to downgrade STUDIO to ESSENTIEL', async () => {
      mockRepo.set('creator-1', createTestSubscription({
        plan: 'STUDIO', productsUsed: 15, pinnedProductsUsed: 4,
      }));

      const result = await useCase.execute({
        creatorId: 'creator-1', targetPlan: 'ESSENTIEL', billingInterval: 'year',
        stripeSubscriptionId: 'sub_new_123', stripeCustomerId: 'cus_123', stripePriceId: 'price_essentiel_year',
        periodStart, periodEnd,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("n'est pas une mise a niveau");
    });

    it('should fail when trying to downgrade ATELIER to STUDIO', async () => {
      mockRepo.set('creator-1', createTestSubscription({
        plan: 'ATELIER', productsUsed: 50, pinnedProductsUsed: 20,
      }));

      const result = await useCase.execute({
        creatorId: 'creator-1', targetPlan: 'STUDIO', billingInterval: 'year',
        stripeSubscriptionId: 'sub_new_123', stripeCustomerId: 'cus_123', stripePriceId: 'price_studio_year',
        periodStart, periodEnd,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("n'est pas une mise a niveau");
    });

    it('should fail when upgrading to the same plan', async () => {
      mockRepo.set('creator-1', createTestSubscription({
        plan: 'STUDIO', productsUsed: 10, pinnedProductsUsed: 3,
      }));

      const result = await useCase.execute({
        creatorId: 'creator-1', targetPlan: 'STUDIO', billingInterval: 'year',
        stripeSubscriptionId: 'sub_new_123', stripeCustomerId: 'cus_123', stripePriceId: 'price_studio_year',
        periodStart, periodEnd,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("n'est pas une mise a niveau");
    });

    it('should fail when creatorId is empty', async () => {
      const result = await useCase.execute({
        creatorId: '', targetPlan: 'STUDIO', billingInterval: 'year',
        stripeSubscriptionId: 'sub_123', stripeCustomerId: 'cus_123', stripePriceId: 'price_123',
        periodStart, periodEnd,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should fail when stripeSubscriptionId is empty', async () => {
      const result = await useCase.execute({
        creatorId: 'creator-1', targetPlan: 'STUDIO', billingInterval: 'year',
        stripeSubscriptionId: '', stripeCustomerId: 'cus_123', stripePriceId: 'price_123',
        periodStart, periodEnd,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Stripe subscription ID');
    });

    it('should fail when stripeCustomerId is empty', async () => {
      const result = await useCase.execute({
        creatorId: 'creator-1', targetPlan: 'STUDIO', billingInterval: 'year',
        stripeSubscriptionId: 'sub_123', stripeCustomerId: '', stripePriceId: 'price_123',
        periodStart, periodEnd,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Stripe customer ID');
    });

    it('should fail when stripePriceId is empty', async () => {
      const result = await useCase.execute({
        creatorId: 'creator-1', targetPlan: 'STUDIO', billingInterval: 'year',
        stripeSubscriptionId: 'sub_123', stripeCustomerId: 'cus_123', stripePriceId: '',
        periodStart, periodEnd,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Stripe price ID');
    });

    it('should fail when subscription not found', async () => {
      const result = await useCase.execute({
        creatorId: 'non-existent', targetPlan: 'STUDIO', billingInterval: 'year',
        stripeSubscriptionId: 'sub_123', stripeCustomerId: 'cus_123', stripePriceId: 'price_123',
        periodStart, periodEnd,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouve');
    });

    it('should fail when targetPlan is missing', async () => {
      const result = await useCase.execute({
        creatorId: 'creator-1', targetPlan: '' as never, billingInterval: 'year',
        stripeSubscriptionId: 'sub_123', stripeCustomerId: 'cus_123', stripePriceId: 'price_123',
        periodStart, periodEnd,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Target plan');
    });

    it('should update period dates on upgrade', async () => {
      mockRepo.set('creator-1', createTestSubscription({
        productsUsed: 5, pinnedProductsUsed: 2,
        stripeSubscriptionId: 'sub_old_123',
      }));

      const result = await useCase.execute({
        creatorId: 'creator-1', targetPlan: 'STUDIO', billingInterval: 'year',
        stripeSubscriptionId: 'sub_new_123', stripeCustomerId: 'cus_123', stripePriceId: 'price_studio_year',
        periodStart, periodEnd,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.currentPeriodEnd).toEqual(periodEnd);
    });
  });
});
