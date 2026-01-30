import { describe, it, expect, beforeEach } from 'vitest';
import { GetSubscriptionUseCase } from '../get-subscription.use-case';
import { SubscriptionRepository } from '../../ports/subscription.repository.interface';
import { Subscription } from '../../../domain/entities/subscription.entity';

// Mock repository
class MockSubscriptionRepository implements SubscriptionRepository {
  private subscriptions: Map<string, Subscription> = new Map();

  setSubscription(userId: string, subscription: Subscription): void {
    this.subscriptions.set(userId, subscription);
  }

  clear(): void {
    this.subscriptions.clear();
  }

  async findById(): Promise<Subscription | null> {
    return null;
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    return this.subscriptions.get(userId) ?? null;
  }

  async findByCreatorId(): Promise<Subscription | null> {
    return null;
  }

  async save(): Promise<void> {}

  async existsByUserId(): Promise<boolean> {
    return false;
  }

  async findByStripeSubscriptionId(): Promise<Subscription | null> {
    return null;
  }

  async findAllPastDue(): Promise<Subscription[]> {
    return [];
  }
}

describe('GetSubscription Use Case', () => {
  let useCase: GetSubscriptionUseCase;
  let mockRepository: MockSubscriptionRepository;

  const baseDate = new Date('2026-01-28T10:00:00Z');

  function createMockSubscription(
    overrides: Partial<{
      plan: 'ESSENTIEL' | 'STUDIO' | 'ATELIER';
      productsUsed: number;
      pinnedProductsUsed: number;
      billingInterval: 'month' | 'year';
      isTrialing: boolean;
      trialEnd: Date | null;
    }> = {}
  ): Subscription {
    return Subscription.reconstitute({
      id: 'sub-123',
      userId: 'user-123',
      creatorId: 'creator-123',
      plan: overrides.plan ?? 'ESSENTIEL',
      status: 'ACTIVE',
      billingInterval: overrides.billingInterval ?? 'year',
      currentPeriodStart: baseDate,
      currentPeriodEnd: new Date('2027-01-28T10:00:00Z'),
      productsUsed: overrides.productsUsed ?? 3,
      pinnedProductsUsed: overrides.pinnedProductsUsed ?? 1,
      commissionRate: overrides.plan === 'ATELIER' ? 0.03 : overrides.plan === 'STUDIO' ? 0.04 : 0.05,
      trialStart: overrides.isTrialing ? baseDate : null,
      trialEnd: overrides.trialEnd ?? null,
      isTrialing: overrides.isTrialing ?? false,
      stripeSubscriptionId: 'sub_stripe_123',
      stripeCustomerId: 'cus_123',
      stripePriceId: 'price_123',
      createdAt: baseDate,
      updatedAt: baseDate,
    }).value!;
  }

  beforeEach(() => {
    mockRepository = new MockSubscriptionRepository();
    useCase = new GetSubscriptionUseCase(mockRepository);
  });

  describe('execute', () => {
    it('should return subscription with usage details for ESSENTIEL plan', async () => {
      const mockSubscription = createMockSubscription();
      mockRepository.setSubscription('user-123', mockSubscription);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual({
        id: 'sub-123',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'year',
        limits: {
          productLimit: 10,
          pinnedProductsLimit: 3,
        },
        usage: {
          productsUsed: 3,
          pinnedProductsUsed: 1,
        },
        pricing: {
          monthlyPrice: 2900,
          yearlyPrice: 29000,
          commissionRate: 0.05,
        },
        features: expect.objectContaining({
          basicDashboard: true,
          advancedAnalytics: false,
          exportReports: false,
        }),
        trial: {
          isTrialing: false,
          trialStart: null,
          trialEnd: null,
        },
        canAddProduct: true,
        canPinProduct: true,
        isNearProductLimit: false,
        currentPeriodEnd: expect.any(Date),
      });
    });

    it('should return correct limits for STUDIO plan', async () => {
      const mockSubscription = createMockSubscription({ plan: 'STUDIO' });
      mockRepository.setSubscription('user-123', mockSubscription);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.limits.productLimit).toBe(20);
      expect(result.value?.limits.pinnedProductsLimit).toBe(5);
      expect(result.value?.pricing.commissionRate).toBe(0.04);
      expect(result.value?.pricing.monthlyPrice).toBe(7900);
      expect(result.value?.pricing.yearlyPrice).toBe(79000);
    });

    it('should return correct limits for ATELIER plan (unlimited)', async () => {
      const mockSubscription = createMockSubscription({ plan: 'ATELIER' });
      mockRepository.setSubscription('user-123', mockSubscription);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.limits.productLimit).toBe(-1);
      expect(result.value?.limits.pinnedProductsLimit).toBe(-1);
      expect(result.value?.pricing.commissionRate).toBe(0.03);
      expect(result.value?.pricing.monthlyPrice).toBe(9500);
      expect(result.value?.pricing.yearlyPrice).toBe(95000);
    });

    it('should indicate when near product limit', async () => {
      const mockSubscription = createMockSubscription({ productsUsed: 8 }); // 80% of 10
      mockRepository.setSubscription('user-123', mockSubscription);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.isNearProductLimit).toBe(true);
    });

    it('should indicate when at product limit', async () => {
      const mockSubscription = createMockSubscription({ productsUsed: 10 });
      mockRepository.setSubscription('user-123', mockSubscription);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.canAddProduct).toBe(false);
    });

    it('should indicate when at pinned products limit', async () => {
      const mockSubscription = createMockSubscription({ pinnedProductsUsed: 3 });
      mockRepository.setSubscription('user-123', mockSubscription);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.canPinProduct).toBe(false);
    });

    it('should include trial information when trialing', async () => {
      const trialEnd = new Date('2026-02-11T10:00:00Z');
      const mockSubscription = createMockSubscription({
        plan: 'ATELIER',
        isTrialing: true,
        trialEnd,
      });
      mockRepository.setSubscription('user-123', mockSubscription);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.trial.isTrialing).toBe(true);
      expect(result.value?.trial.trialEnd).toEqual(trialEnd);
    });

    it('should return correct billing interval for monthly subscription', async () => {
      const mockSubscription = createMockSubscription({ billingInterval: 'month' });
      mockRepository.setSubscription('user-123', mockSubscription);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.billingInterval).toBe('month');
    });

    it('should fail when subscription not found', async () => {
      // No subscription set in repository

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
      const mockSubscription = createMockSubscription({ plan: 'ESSENTIEL' });
      mockRepository.setSubscription('user-123', mockSubscription);

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
      const mockSubscription = createMockSubscription({ plan: 'ATELIER' });
      mockRepository.setSubscription('user-123', mockSubscription);

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
