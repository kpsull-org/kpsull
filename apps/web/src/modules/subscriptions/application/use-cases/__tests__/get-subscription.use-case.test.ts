import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetSubscriptionUseCase } from '../get-subscription.use-case';
import { SubscriptionRepository } from '../../ports/subscription.repository.interface';
import { Subscription } from '../../../domain/entities/subscription.entity';

describe('GetSubscription Use Case', () => {
  let useCase: GetSubscriptionUseCase;
  let mockRepository: SubscriptionRepository;

  const baseDate = new Date('2026-01-28T10:00:00Z');

  function createMockSubscription(overrides: Partial<{
    plan: 'FREE' | 'PRO';
    productsUsed: number;
    salesUsed: number;
  }> = {}): Subscription {
    return Subscription.reconstitute({
      id: 'sub-123',
      userId: 'user-123',
      creatorId: 'creator-123',
      plan: overrides.plan ?? 'FREE',
      status: 'ACTIVE',
      currentPeriodStart: baseDate,
      currentPeriodEnd: new Date('2026-02-28T10:00:00Z'),
      productsUsed: overrides.productsUsed ?? 3,
      salesUsed: overrides.salesUsed ?? 5,
      stripeSubscriptionId: null,
      createdAt: baseDate,
      updatedAt: baseDate,
    }).value!;
  }

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByCreatorId: vi.fn(),
      save: vi.fn(),
      existsByUserId: vi.fn(),
      findByStripeSubscriptionId: vi.fn(),
      findAllPastDue: vi.fn(),
    };

    useCase = new GetSubscriptionUseCase(mockRepository);
  });

  describe('execute', () => {
    it('should return subscription with usage details', async () => {
      const mockSubscription = createMockSubscription();
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockSubscription);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual({
        id: 'sub-123',
        plan: 'FREE',
        status: 'ACTIVE',
        limits: {
          productLimit: 5,
          salesLimit: 10,
        },
        usage: {
          productsUsed: 3,
          salesUsed: 5,
        },
        features: expect.any(Object),
        canAddProduct: true,
        canMakeSale: true,
        isNearProductLimit: false,
        isNearSalesLimit: false,
        currentPeriodEnd: expect.any(Date),
      });
    });

    it('should return correct limits for PRO plan', async () => {
      const mockSubscription = createMockSubscription({ plan: 'PRO' });
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockSubscription);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.limits.productLimit).toBe(-1);
      expect(result.value?.limits.salesLimit).toBe(-1);
    });

    it('should indicate when near product limit', async () => {
      const mockSubscription = createMockSubscription({ productsUsed: 4 }); // 80% of 5
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockSubscription);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.isNearProductLimit).toBe(true);
    });

    it('should indicate when at product limit', async () => {
      const mockSubscription = createMockSubscription({ productsUsed: 5 });
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockSubscription);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.canAddProduct).toBe(false);
    });

    it('should indicate when at sales limit', async () => {
      const mockSubscription = createMockSubscription({ salesUsed: 10 });
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockSubscription);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.canMakeSale).toBe(false);
    });

    it('should fail when subscription not found', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(null);

      const result = await useCase.execute({ userId: 'user-unknown' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Abonnement non trouvé');
    });

    it('should fail when userId is empty', async () => {
      const result = await useCase.execute({ userId: '' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('User ID est requis');
    });

    it('should include all features with availability status', async () => {
      const mockSubscription = createMockSubscription({ plan: 'FREE' });
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockSubscription);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.features).toEqual(
        expect.objectContaining({
          basicDashboard: true,
          advancedAnalytics: false,
          exportReports: false,
        })
      );
    });
  });
});
