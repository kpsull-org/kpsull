import { describe, it, expect, beforeEach } from 'vitest';
import {
  ListSubscriptionsUseCase,
  AdminSubscriptionRepository,
  SubscriptionListItem,
} from '../list-subscriptions.use-case';
import { SubscriptionStatus } from '../../../domain/entities/subscription.entity';
import { PlanType } from '../../../domain/value-objects/plan.vo';
import { BillingInterval } from '../../../domain/plan-features';

// Extended interface for tests with new model fields
interface ExtendedSubscriptionListItem extends Omit<SubscriptionListItem, 'salesUsed'> {
  pinnedProductsUsed: number;
  commissionRate: number;
  billingInterval: BillingInterval;
}

// Mock repository with list support
class MockAdminSubscriptionRepository implements AdminSubscriptionRepository {
  private subscriptions: ExtendedSubscriptionListItem[] = [];

  setSubscriptions(subscriptions: ExtendedSubscriptionListItem[]): void {
    this.subscriptions = subscriptions;
  }

  async findAll(filters?: {
    plan?: PlanType;
    status?: SubscriptionStatus;
  }): Promise<SubscriptionListItem[]> {
    let result = [...this.subscriptions];

    if (filters?.plan) {
      result = result.filter((s) => s.plan === filters.plan);
    }

    if (filters?.status) {
      result = result.filter((s) => s.status === filters.status);
    }

    // Map to SubscriptionListItem (legacy format with salesUsed for compatibility)
    return result.map((s) => ({
      id: s.id,
      userId: s.userId,
      creatorId: s.creatorId,
      plan: s.plan,
      status: s.status,
      currentPeriodEnd: s.currentPeriodEnd,
      productsUsed: s.productsUsed,
      salesUsed: 0, // Legacy field - no longer used
      stripeSubscriptionId: s.stripeSubscriptionId,
    }));
  }
}

describe('ListSubscriptionsUseCase', () => {
  let useCase: ListSubscriptionsUseCase;
  let mockRepo: MockAdminSubscriptionRepository;

  beforeEach(() => {
    mockRepo = new MockAdminSubscriptionRepository();
    useCase = new ListSubscriptionsUseCase(mockRepo);

    // Set up test subscriptions with new 3-tier model
    const subscriptions: ExtendedSubscriptionListItem[] = [
      {
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        productsUsed: 5,
        pinnedProductsUsed: 2,
        commissionRate: 0.05,
        billingInterval: 'year',
        stripeSubscriptionId: 'sub_stripe_essentiel',
      },
      {
        id: 'sub-2',
        userId: 'user-2',
        creatorId: 'creator-2',
        plan: 'STUDIO',
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        productsUsed: 15,
        pinnedProductsUsed: 4,
        commissionRate: 0.04,
        billingInterval: 'year',
        stripeSubscriptionId: 'sub_stripe_studio',
      },
      {
        id: 'sub-3',
        userId: 'user-3',
        creatorId: 'creator-3',
        plan: 'ATELIER',
        status: 'PAST_DUE',
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        productsUsed: 50,
        pinnedProductsUsed: 20,
        commissionRate: 0.03,
        billingInterval: 'year',
        stripeSubscriptionId: 'sub_stripe_atelier',
      },
    ];

    mockRepo.setSubscriptions(subscriptions);
  });

  describe('execute', () => {
    it('should return all subscriptions without filters', async () => {
      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.subscriptions).toHaveLength(3);
      expect(result.value.total).toBe(3);
    });

    it('should filter by plan ESSENTIEL', async () => {
      // Act
      const result = await useCase.execute({ plan: 'ESSENTIEL' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.subscriptions).toHaveLength(1);
      expect(result.value?.subscriptions[0]?.plan).toBe('ESSENTIEL');
    });

    it('should filter by plan STUDIO', async () => {
      // Act
      const result = await useCase.execute({ plan: 'STUDIO' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.subscriptions).toHaveLength(1);
      expect(result.value?.subscriptions[0]?.plan).toBe('STUDIO');
    });

    it('should filter by plan ATELIER', async () => {
      // Act
      const result = await useCase.execute({ plan: 'ATELIER' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.subscriptions).toHaveLength(1);
      expect(result.value?.subscriptions[0]?.plan).toBe('ATELIER');
    });

    it('should filter by status PAST_DUE', async () => {
      // Act
      const result = await useCase.execute({ status: 'PAST_DUE' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.subscriptions).toHaveLength(1);
      expect(result.value?.subscriptions[0]?.status).toBe('PAST_DUE');
    });

    it('should filter by status ACTIVE', async () => {
      // Act
      const result = await useCase.execute({ status: 'ACTIVE' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.subscriptions).toHaveLength(2);
    });

    it('should filter by both plan and status', async () => {
      // Act
      const result = await useCase.execute({ plan: 'STUDIO', status: 'ACTIVE' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.subscriptions).toHaveLength(1);
      expect(result.value?.subscriptions[0]?.plan).toBe('STUDIO');
      expect(result.value?.subscriptions[0]?.status).toBe('ACTIVE');
    });

    it('should return empty list when no subscriptions match filters', async () => {
      // Act
      const result = await useCase.execute({ plan: 'ESSENTIEL', status: 'PAST_DUE' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.subscriptions).toHaveLength(0);
      expect(result.value.total).toBe(0);
    });
  });
});
