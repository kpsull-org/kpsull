import { describe, it, expect, beforeEach } from 'vitest';
import { GetSubscriptionUseCase } from '../get-subscription.use-case';
import { TestSubscriptionRepository } from '../../../__tests__/helpers/test-subscription.repository';
import { createTestSubscription } from '../../../__tests__/helpers/subscription.factory';

describe('GetSubscription Use Case', () => {
  let useCase: GetSubscriptionUseCase;
  let mockRepository: TestSubscriptionRepository;

  beforeEach(() => {
    mockRepository = new TestSubscriptionRepository();
    useCase = new GetSubscriptionUseCase(mockRepository);
  });

  describe('execute', () => {
    it('should return subscription with usage details for ESSENTIEL plan', async () => {
      mockRepository.set('user-123', createTestSubscription({
        id: 'sub-123', userId: 'user-123', creatorId: 'creator-123',
        productsUsed: 3, pinnedProductsUsed: 1,
      }));

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual({
        id: 'sub-123',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'year',
        limits: { productLimit: 10, pinnedProductsLimit: 3 },
        usage: { productsUsed: 3, pinnedProductsUsed: 1 },
        pricing: { monthlyPrice: 2900, yearlyPrice: 29000, commissionRate: 0.05 },
        features: expect.objectContaining({
          basicDashboard: true,
          advancedAnalytics: false,
          exportReports: false,
        }),
        trial: { isTrialing: false, trialStart: null, trialEnd: null },
        canAddProduct: true,
        canPinProduct: true,
        isNearProductLimit: false,
        currentPeriodEnd: expect.any(Date),
      });
    });

    it('should return correct limits for STUDIO plan', async () => {
      mockRepository.set('user-123', createTestSubscription({
        userId: 'user-123', plan: 'STUDIO', productsUsed: 3, pinnedProductsUsed: 1,
      }));

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.limits.productLimit).toBe(20);
      expect(result.value?.limits.pinnedProductsLimit).toBe(5);
      expect(result.value?.pricing.commissionRate).toBe(0.04);
      expect(result.value?.pricing.monthlyPrice).toBe(7900);
      expect(result.value?.pricing.yearlyPrice).toBe(79000);
    });

    it('should return correct limits for ATELIER plan (unlimited)', async () => {
      mockRepository.set('user-123', createTestSubscription({
        userId: 'user-123', plan: 'ATELIER', productsUsed: 3, pinnedProductsUsed: 1,
      }));

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.limits.productLimit).toBe(-1);
      expect(result.value?.limits.pinnedProductsLimit).toBe(-1);
      expect(result.value?.pricing.commissionRate).toBe(0.03);
      expect(result.value?.pricing.monthlyPrice).toBe(9500);
      expect(result.value?.pricing.yearlyPrice).toBe(95000);
    });

    it('should indicate when near product limit', async () => {
      mockRepository.set('user-123', createTestSubscription({
        userId: 'user-123', productsUsed: 8,
      }));

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.isNearProductLimit).toBe(true);
    });

    it('should indicate when at product limit', async () => {
      mockRepository.set('user-123', createTestSubscription({
        userId: 'user-123', productsUsed: 10,
      }));

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.canAddProduct).toBe(false);
    });

    it('should indicate when at pinned products limit', async () => {
      mockRepository.set('user-123', createTestSubscription({
        userId: 'user-123', pinnedProductsUsed: 3,
      }));

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.canPinProduct).toBe(false);
    });

    it('should include trial information when trialing', async () => {
      const trialEnd = new Date('2026-02-11T10:00:00Z');
      const baseDate = new Date('2026-01-28T10:00:00Z');
      mockRepository.set('user-123', createTestSubscription({
        userId: 'user-123', plan: 'ATELIER',
        isTrialing: true, trialStart: baseDate, trialEnd,
      }));

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.trial.isTrialing).toBe(true);
      expect(result.value?.trial.trialEnd).toEqual(trialEnd);
    });

    it('should return correct billing interval for monthly subscription', async () => {
      mockRepository.set('user-123', createTestSubscription({
        userId: 'user-123', billingInterval: 'month',
      }));

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.billingInterval).toBe('month');
    });

    it('should fail when subscription not found', async () => {
      const result = await useCase.execute({ userId: 'user-unknown' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Abonnement non trouve');
    });

    it('should fail when userId is empty', async () => {
      const result = await useCase.execute({ userId: '' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('User ID est requis');
    });

    it('should include all features with availability status for ESSENTIEL', async () => {
      mockRepository.set('user-123', createTestSubscription({
        userId: 'user-123',
      }));

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.features).toEqual(
        expect.objectContaining({
          basicDashboard: true,
          productManagement: true,
          orderManagement: true,
          basicAnalytics: true,
          advancedAnalytics: false,
          exportReports: false,
          prioritySupport: false,
          customDomain: false,
          pinnedProducts: true,
          trialAvailable: false,
        })
      );
    });

    it('should include all features with availability status for ATELIER', async () => {
      mockRepository.set('user-123', createTestSubscription({
        userId: 'user-123', plan: 'ATELIER',
      }));

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.features).toEqual(
        expect.objectContaining({
          basicDashboard: true,
          productManagement: true,
          orderManagement: true,
          basicAnalytics: true,
          advancedAnalytics: true,
          exportReports: true,
          prioritySupport: true,
          customDomain: true,
          pinnedProducts: true,
          trialAvailable: true,
        })
      );
    });
  });
});
