import { describe, it, expect, beforeEach } from 'vitest';
import { CancelSubscriptionUseCase } from '../cancel-subscription.use-case';
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
    this.subscriptions.set(subscription.creatorId, subscription);
  }

  async existsByUserId(): Promise<boolean> {
    return false;
  }
}

describe('CancelSubscriptionUseCase', () => {
  let useCase: CancelSubscriptionUseCase;
  let mockRepo: MockSubscriptionRepository;

  beforeEach(() => {
    mockRepo = new MockSubscriptionRepository();
    useCase = new CancelSubscriptionUseCase(mockRepo);
  });

  describe('execute', () => {
    it('should cancel ESSENTIEL subscription immediately', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: new Date('2025-01-28'),
        currentPeriodEnd: new Date('2026-01-28'),
        productsUsed: 5,
        pinnedProductsUsed: 2,
        commissionRate: 0.05,
        stripeSubscriptionId: 'sub_stripe_123',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-1',
        reason: 'User request',
        immediate: true,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe('CANCELLED');
      expect(result.value!.plan).toBe('ESSENTIEL');
      expect(result.value!.canceledAt).toBeDefined();
      expect(result.value!.effectiveDate).toEqual(result.value!.canceledAt);
      expect(mockRepo.savedSubscription).not.toBeNull();
    });

    it('should cancel STUDIO subscription at period end', async () => {
      // Arrange
      const periodEnd = new Date('2026-06-15');
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'STUDIO',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: new Date('2025-06-15'),
        currentPeriodEnd: periodEnd,
        productsUsed: 15,
        pinnedProductsUsed: 4,
        commissionRate: 0.04,
        stripeSubscriptionId: 'sub_stripe_456',
        stripeCustomerId: 'cus_456',
        stripePriceId: 'price_456',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-1',
        reason: 'Switching to competitor',
        immediate: false,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe('CANCELLED');
      expect(result.value!.plan).toBe('STUDIO');
      expect(result.value!.effectiveDate).toEqual(periodEnd);
    });

    it('should cancel ATELIER subscription successfully', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'ATELIER',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: new Date('2025-03-01'),
        currentPeriodEnd: new Date('2026-03-01'),
        productsUsed: 100,
        pinnedProductsUsed: 50,
        commissionRate: 0.03,
        stripeSubscriptionId: 'sub_stripe_789',
        stripeCustomerId: 'cus_789',
        stripePriceId: 'price_789',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-1',
        immediate: true,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe('CANCELLED');
      expect(result.value!.plan).toBe('ATELIER');
    });

    it('should cancel monthly subscription at period end by default', async () => {
      // Arrange
      const periodEnd = new Date('2026-02-15');
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'month',
        currentPeriodStart: new Date('2026-01-15'),
        currentPeriodEnd: periodEnd,
        productsUsed: 3,
        pinnedProductsUsed: 1,
        commissionRate: 0.05,
        stripeSubscriptionId: 'sub_monthly',
        stripeCustomerId: 'cus_monthly',
        stripePriceId: 'price_monthly',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-1',
        immediate: false,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.effectiveDate).toEqual(periodEnd);
    });

    it('should cancel PAST_DUE subscription', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'STUDIO',
        status: 'PAST_DUE',
        billingInterval: 'year',
        currentPeriodStart: new Date('2025-01-28'),
        currentPeriodEnd: new Date('2026-01-28'),
        productsUsed: 10,
        pinnedProductsUsed: 3,
        commissionRate: 0.04,
        stripeSubscriptionId: 'sub_past_due',
        stripeCustomerId: 'cus_past_due',
        stripePriceId: 'price_past_due',
        gracePeriodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-1',
        reason: 'Grace period expired',
        immediate: true,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe('CANCELLED');
    });

    it('should fail when creatorId is empty', async () => {
      // Act
      const result = await useCase.execute({
        creatorId: '',
        immediate: true,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should fail when subscription not found', async () => {
      // Act
      const result = await useCase.execute({
        creatorId: 'non-existent',
        immediate: true,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouve');
    });

    it('should fail when subscription is already cancelled', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'ESSENTIEL',
        status: 'CANCELLED',
        billingInterval: 'year',
        currentPeriodStart: new Date('2025-01-28'),
        currentPeriodEnd: new Date('2026-01-28'),
        productsUsed: 5,
        pinnedProductsUsed: 2,
        commissionRate: 0.05,
        stripeSubscriptionId: null,
        stripeCustomerId: 'cus_123',
        stripePriceId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-1',
        immediate: true,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('deja annule');
    });

    it('should clear stripeSubscriptionId on cancellation', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'STUDIO',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: new Date('2025-01-28'),
        currentPeriodEnd: new Date('2026-01-28'),
        productsUsed: 10,
        pinnedProductsUsed: 3,
        commissionRate: 0.04,
        stripeSubscriptionId: 'sub_to_clear',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-1',
        immediate: true,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockRepo.savedSubscription!.stripeSubscriptionId).toBeNull();
    });

    it('should return subscriptionId in output', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-unique-id',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'month',
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        productsUsed: 2,
        pinnedProductsUsed: 1,
        commissionRate: 0.05,
        stripeSubscriptionId: 'sub_stripe_test',
        stripeCustomerId: 'cus_test',
        stripePriceId: 'price_test',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-1',
        reason: 'Testing',
        immediate: true,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.subscriptionId).toBe('sub-unique-id');
    });

    it('should handle cancel without reason', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'ATELIER',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: new Date('2025-01-28'),
        currentPeriodEnd: new Date('2026-01-28'),
        productsUsed: 50,
        pinnedProductsUsed: 20,
        commissionRate: 0.03,
        stripeSubscriptionId: 'sub_atelier',
        stripeCustomerId: 'cus_atelier',
        stripePriceId: 'price_atelier',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act - no reason provided
      const result = await useCase.execute({
        creatorId: 'creator-1',
        immediate: true,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe('CANCELLED');
    });
  });
});
