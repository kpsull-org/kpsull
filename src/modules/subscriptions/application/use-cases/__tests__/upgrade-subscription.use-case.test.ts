import { describe, it, expect, beforeEach } from 'vitest';
import { UpgradeSubscriptionUseCase } from '../upgrade-subscription.use-case';
import { TestSubscriptionRepository } from '../../../__tests__/helpers/test-subscription.repository';
import { createTestSubscription } from '../../../__tests__/helpers/subscription.factory';

describe('UpgradeSubscriptionUseCase', () => {
  let useCase: UpgradeSubscriptionUseCase;
  let mockRepo: TestSubscriptionRepository;

  const periodStart = new Date('2026-01-28');
  const periodEnd = new Date('2027-01-28');

  const defaultInput = {
    creatorId: 'creator-1',
    targetPlan: 'STUDIO' as const,
    billingInterval: 'year' as const,
    stripeSubscriptionId: 'sub_new_123',
    stripeCustomerId: 'cus_123',
    stripePriceId: 'price_studio_year',
    periodStart,
    periodEnd,
  };

  beforeEach(() => {
    mockRepo = new TestSubscriptionRepository();
    useCase = new UpgradeSubscriptionUseCase(mockRepo);
  });

  describe('execute', () => {
    describe('successful upgrades', () => {
      it.each([
        {
          label: 'ESSENTIEL to STUDIO',
          existing: { productsUsed: 8, pinnedProductsUsed: 2, stripeSubscriptionId: 'sub_old_123' },
          input: { ...defaultInput } as typeof defaultInput & { targetPlan: 'STUDIO' | 'ATELIER' },
          expected: { plan: 'STUDIO', previousPlan: 'ESSENTIEL', commissionRate: 0.04, stripeSubscriptionId: 'sub_new_123' },
        },
        {
          label: 'ESSENTIEL to ATELIER',
          existing: { productsUsed: 5, pinnedProductsUsed: 1, stripeSubscriptionId: 'sub_old_123' },
          input: { ...defaultInput, targetPlan: 'ATELIER' as const, stripeSubscriptionId: 'sub_new_456', stripePriceId: 'price_atelier_year' },
          expected: { plan: 'ATELIER', previousPlan: 'ESSENTIEL', commissionRate: 0.03 },
        },
        {
          label: 'STUDIO to ATELIER',
          existing: { plan: 'STUDIO' as const, productsUsed: 18, pinnedProductsUsed: 4, stripeSubscriptionId: 'sub_studio_123', stripeCustomerId: 'cus_456' },
          input: { ...defaultInput, targetPlan: 'ATELIER' as const, stripeSubscriptionId: 'sub_new_789', stripeCustomerId: 'cus_456', stripePriceId: 'price_atelier_year' },
          expected: { plan: 'ATELIER', previousPlan: 'STUDIO', commissionRate: 0.03 },
        },
      ])('should upgrade $label successfully', async ({ existing, input, expected }) => {
        mockRepo.set('creator-1', createTestSubscription(existing));

        const result = await useCase.execute(input);

        expect(result.isSuccess).toBe(true);
        expect(result.value.plan).toBe(expected.plan);
        expect(result.value.previousPlan).toBe(expected.previousPlan);
        expect(result.value.commissionRate).toBe(expected.commissionRate);
        if ('stripeSubscriptionId' in expected) {
          expect(result.value.stripeSubscriptionId).toBe(expected.stripeSubscriptionId);
        }
        expect(mockRepo.savedSubscription).not.toBeNull();
      });
    });

    it('should change billing interval from monthly to yearly', async () => {
      mockRepo.set('creator-1', createTestSubscription({
        billingInterval: 'month', productsUsed: 3, pinnedProductsUsed: 1,
        stripeSubscriptionId: 'sub_monthly_123',
      }));

      const result = await useCase.execute({
        ...defaultInput,
        stripeSubscriptionId: 'sub_yearly_456',
        stripePriceId: 'price_studio_year',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.billingInterval).toBe('year');
    });

    it('should not change billing interval when it matches the current one', async () => {
      mockRepo.set('creator-1', createTestSubscription({
        billingInterval: 'year', productsUsed: 3, pinnedProductsUsed: 1,
        stripeSubscriptionId: 'sub_yearly_123',
      }));

      const result = await useCase.execute({
        ...defaultInput,
        stripeSubscriptionId: 'sub_new_456',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.billingInterval).toBe('year');
    });

    it('should update period dates on upgrade', async () => {
      mockRepo.set('creator-1', createTestSubscription({
        productsUsed: 5, pinnedProductsUsed: 2,
        stripeSubscriptionId: 'sub_old_123',
      }));

      const result = await useCase.execute(defaultInput);

      expect(result.isSuccess).toBe(true);
      expect(result.value.currentPeriodEnd).toEqual(periodEnd);
    });

    describe('downgrade attempts', () => {
      it.each([
        {
          label: 'STUDIO to ESSENTIEL',
          plan: 'STUDIO' as const,
          targetPlan: 'ESSENTIEL' as const,
          productsUsed: 15,
          pinnedProductsUsed: 4,
          stripePriceId: 'price_essentiel_year',
        },
        {
          label: 'ATELIER to STUDIO',
          plan: 'ATELIER' as const,
          targetPlan: 'STUDIO' as const,
          productsUsed: 50,
          pinnedProductsUsed: 20,
          stripePriceId: 'price_studio_year',
        },
        {
          label: 'same plan STUDIO to STUDIO',
          plan: 'STUDIO' as const,
          targetPlan: 'STUDIO' as const,
          productsUsed: 10,
          pinnedProductsUsed: 3,
          stripePriceId: 'price_studio_year',
        },
      ])('should fail when trying to downgrade: $label', async ({ plan, targetPlan, productsUsed, pinnedProductsUsed, stripePriceId }) => {
        mockRepo.set('creator-1', createTestSubscription({ plan, productsUsed, pinnedProductsUsed }));

        const result = await useCase.execute({ ...defaultInput, targetPlan, stripePriceId });

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain("n'est pas une mise a niveau");
      });
    });

    describe('input validation failures', () => {
      it.each([
        { field: 'creatorId', input: { ...defaultInput, creatorId: '' }, expectedError: 'Creator ID' },
        { field: 'stripeSubscriptionId', input: { ...defaultInput, stripeSubscriptionId: '' }, expectedError: 'Stripe subscription ID' },
        { field: 'stripeCustomerId', input: { ...defaultInput, stripeCustomerId: '' }, expectedError: 'Stripe customer ID' },
        { field: 'stripePriceId', input: { ...defaultInput, stripePriceId: '' }, expectedError: 'Stripe price ID' },
        { field: 'targetPlan', input: { ...defaultInput, targetPlan: '' as never }, expectedError: 'Target plan' },
      ])('should fail when $field is empty', async ({ input, expectedError }) => {
        const result = await useCase.execute(input);

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain(expectedError);
      });

      it('should fail when subscription not found', async () => {
        const result = await useCase.execute({ ...defaultInput, creatorId: 'non-existent' });

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('non trouve');
      });
    });
  });
});
