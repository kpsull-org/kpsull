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
    it('should mark STUDIO subscription as PAST_DUE', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'STUDIO',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        productsUsed: 15,
        pinnedProductsUsed: 3,
        commissionRate: 0.04,
        stripeSubscriptionId: 'sub_stripe_123',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_123',
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

    it('should mark ATELIER subscription as PAST_DUE', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'ATELIER',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        productsUsed: 100,
        pinnedProductsUsed: 50,
        commissionRate: 0.03,
        stripeSubscriptionId: 'sub_stripe_456',
        stripeCustomerId: 'cus_456',
        stripePriceId: 'price_456',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.execute({
        stripeSubscriptionId: 'sub_stripe_456',
        failedAt: new Date(),
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe('PAST_DUE');
    });

    it('should mark ESSENTIEL subscription as PAST_DUE', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'month',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        productsUsed: 5,
        pinnedProductsUsed: 2,
        commissionRate: 0.05,
        stripeSubscriptionId: 'sub_stripe_789',
        stripeCustomerId: 'cus_789',
        stripePriceId: 'price_789',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.execute({
        stripeSubscriptionId: 'sub_stripe_789',
        failedAt: new Date(),
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe('PAST_DUE');
      expect(result.value!.gracePeriodStart).toBeDefined();
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
        plan: 'STUDIO',
        status: 'PAST_DUE',
        billingInterval: 'year',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        productsUsed: 10,
        pinnedProductsUsed: 3,
        commissionRate: 0.04,
        stripeSubscriptionId: 'sub_stripe_123',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_123',
        gracePeriodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
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

    it('should handle monthly billing interval subscriptions', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'month',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        productsUsed: 5,
        pinnedProductsUsed: 1,
        commissionRate: 0.05,
        stripeSubscriptionId: 'sub_stripe_monthly',
        stripeCustomerId: 'cus_monthly',
        stripePriceId: 'price_monthly',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.execute({
        stripeSubscriptionId: 'sub_stripe_monthly',
        failedAt: new Date(),
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe('PAST_DUE');
    });
  });
});
