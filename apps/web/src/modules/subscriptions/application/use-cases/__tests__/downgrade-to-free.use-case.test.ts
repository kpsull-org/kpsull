import { describe, it, expect, beforeEach } from 'vitest';
import { DowngradeToFreeUseCase } from '../downgrade-to-free.use-case';
import { SubscriptionRepository } from '../../ports/subscription.repository.interface';
import { Subscription } from '../../../domain/entities/subscription.entity';

// Mock repository
class MockSubscriptionRepository implements SubscriptionRepository {
  private subscriptions: Map<string, Subscription> = new Map();
  public savedSubscription: Subscription | null = null;

  setSubscription(creatorId: string, subscription: Subscription): void {
    this.subscriptions.set(creatorId, subscription);
  }

  async findById(): Promise<Subscription | null> {
    return null;
  }

  async findByUserId(): Promise<Subscription | null> {
    return null;
  }

  async findByCreatorId(creatorId: string): Promise<Subscription | null> {
    return this.subscriptions.get(creatorId) ?? null;
  }

  async findByStripeSubscriptionId(): Promise<Subscription | null> {
    return null;
  }

  async findAllPastDue(): Promise<Subscription[]> {
    return [];
  }

  async save(subscription: Subscription): Promise<void> {
    this.savedSubscription = subscription;
  }

  async existsByUserId(): Promise<boolean> {
    return false;
  }
}

describe('DowngradeToFreeUseCase', () => {
  let useCase: DowngradeToFreeUseCase;
  let mockRepo: MockSubscriptionRepository;

  beforeEach(() => {
    mockRepo = new MockSubscriptionRepository();
    useCase = new DowngradeToFreeUseCase(mockRepo);
  });

  describe('execute', () => {
    it('should downgrade a PRO subscription to FREE', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'PRO',
        status: 'PAST_DUE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        productsUsed: 10,
        salesUsed: 50,
        stripeSubscriptionId: 'sub_stripe_123',
        stripeCustomerId: 'cus_123',
        gracePeriodStart: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.execute({ creatorId: 'creator-1' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.plan).toBe('FREE');
      expect(result.value!.status).toBe('CANCELLED');
      expect(mockRepo.savedSubscription).not.toBeNull();
      expect(mockRepo.savedSubscription!.plan.isFree).toBe(true);
    });

    it('should fail if subscription not found', async () => {
      // Act
      const result = await useCase.execute({ creatorId: 'non-existent' });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvé');
    });

    it('should fail if already FREE', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        productsUsed: 3,
        salesUsed: 5,
        stripeSubscriptionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.execute({ creatorId: 'creator-1' });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('déjà FREE');
    });

    it('should fail if creatorId is empty', async () => {
      // Act
      const result = await useCase.execute({ creatorId: '' });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });
  });
});
