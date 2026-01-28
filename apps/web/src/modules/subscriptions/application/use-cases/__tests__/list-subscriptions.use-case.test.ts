import { describe, it, expect, beforeEach } from 'vitest';
import {
  ListSubscriptionsUseCase,
  AdminSubscriptionRepository,
  SubscriptionListItem,
} from '../list-subscriptions.use-case';
import { SubscriptionStatus } from '../../../domain/entities/subscription.entity';
import { PlanType } from '../../../domain/value-objects/plan.vo';

// Mock repository with list support
class MockAdminSubscriptionRepository implements AdminSubscriptionRepository {
  private subscriptions: SubscriptionListItem[] = [];

  setSubscriptions(subscriptions: SubscriptionListItem[]): void {
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

    return result;
  }
}

describe('ListSubscriptionsUseCase', () => {
  let useCase: ListSubscriptionsUseCase;
  let mockRepo: MockAdminSubscriptionRepository;

  beforeEach(() => {
    mockRepo = new MockAdminSubscriptionRepository();
    useCase = new ListSubscriptionsUseCase(mockRepo);

    // Set up test subscriptions
    const subscriptions: SubscriptionListItem[] = [
      {
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'FREE',
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        productsUsed: 3,
        salesUsed: 5,
        stripeSubscriptionId: null,
      },
      {
        id: 'sub-2',
        userId: 'user-2',
        creatorId: 'creator-2',
        plan: 'PRO',
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        productsUsed: 20,
        salesUsed: 50,
        stripeSubscriptionId: 'sub_stripe_123',
      },
      {
        id: 'sub-3',
        userId: 'user-3',
        creatorId: 'creator-3',
        plan: 'PRO',
        status: 'PAST_DUE',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        productsUsed: 10,
        salesUsed: 30,
        stripeSubscriptionId: 'sub_stripe_456',
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
      expect(result.value!.subscriptions).toHaveLength(3);
      expect(result.value!.total).toBe(3);
    });

    it('should filter by plan FREE', async () => {
      // Act
      const result = await useCase.execute({ plan: 'FREE' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.subscriptions).toHaveLength(1);
      expect(result.value?.subscriptions[0]?.plan).toBe('FREE');
    });

    it('should filter by plan PRO', async () => {
      // Act
      const result = await useCase.execute({ plan: 'PRO' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.subscriptions).toHaveLength(2);
    });

    it('should filter by status PAST_DUE', async () => {
      // Act
      const result = await useCase.execute({ status: 'PAST_DUE' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.subscriptions).toHaveLength(1);
      expect(result.value?.subscriptions[0]?.status).toBe('PAST_DUE');
    });

    it('should filter by both plan and status', async () => {
      // Act
      const result = await useCase.execute({ plan: 'PRO', status: 'ACTIVE' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.subscriptions).toHaveLength(1);
    });
  });
});
