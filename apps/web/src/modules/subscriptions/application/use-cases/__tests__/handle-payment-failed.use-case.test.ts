import { describe, it, expect, beforeEach } from 'vitest';
import { HandlePaymentFailedUseCase } from '../handle-payment-failed.use-case';
import { SubscriptionRepository } from '../../ports/subscription.repository.interface';
import { Subscription } from '../../../domain/entities/subscription.entity';

// Mock repository
class MockSubscriptionRepository implements SubscriptionRepository {
  private subscriptions: Map<string, Subscription> = new Map();
  public savedSubscription: Subscription | null = null;

  setSubscription(key: string, subscription: Subscription): void {
    this.subscriptions.set(key, subscription);
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

  async findByStripeSubscriptionId(stripeId: string): Promise<Subscription | null> {
    for (const sub of this.subscriptions.values()) {
      if (sub.stripeSubscriptionId === stripeId) {
        return sub;
      }
    }
    return null;
  }

  async save(subscription: Subscription): Promise<void> {
    this.savedSubscription = subscription;
    this.subscriptions.set(subscription.creatorId, subscription);
  }

  async existsByUserId(): Promise<boolean> {
    return false;
  }

  async findAllPastDue(): Promise<Subscription[]> {
    return [];
  }
}

describe('HandlePaymentFailedUseCase', () => {
  let useCase: HandlePaymentFailedUseCase;
  let mockRepo: MockSubscriptionRepository;

  beforeEach(() => {
    mockRepo = new MockSubscriptionRepository();
    useCase = new HandlePaymentFailedUseCase(mockRepo);
  });

  describe('execute', () => {
    it('should mark subscription as PAST_DUE', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'PRO',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        productsUsed: 10,
        salesUsed: 50,
        stripeSubscriptionId: 'sub_stripe_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.execute({
        stripeSubscriptionId: 'sub_stripe_123',
        failedAt: new Date(),
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe('PAST_DUE');
      expect(result.value!.gracePeriodStart).toBeDefined();
      expect(mockRepo.savedSubscription).not.toBeNull();
    });

    it('should fail if subscription not found', async () => {
      // Act
      const result = await useCase.execute({
        stripeSubscriptionId: 'non_existent',
        failedAt: new Date(),
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvé');
    });

    it('should fail if stripeSubscriptionId is empty', async () => {
      // Act
      const result = await useCase.execute({
        stripeSubscriptionId: '',
        failedAt: new Date(),
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Stripe subscription ID');
    });

    it('should not change status if already PAST_DUE', async () => {
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
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.execute({
        stripeSubscriptionId: 'sub_stripe_123',
        failedAt: new Date(),
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe('PAST_DUE');
    });
  });
});
