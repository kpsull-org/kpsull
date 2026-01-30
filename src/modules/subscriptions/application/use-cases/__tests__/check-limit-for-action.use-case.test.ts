import { describe, it, expect, beforeEach } from 'vitest';
import { CheckLimitForActionUseCase } from '../check-limit-for-action.use-case';
import { LimitStatus } from '../check-limit.use-case';
import { SubscriptionRepository } from '../../ports/subscription.repository.interface';
import { Subscription } from '../../../domain/entities/subscription.entity';

// Mock repository
class MockSubscriptionRepository implements SubscriptionRepository {
  private subscriptions: Map<string, Subscription> = new Map();

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

describe('CheckLimitForActionUseCase', () => {
  let useCase: CheckLimitForActionUseCase;
  let mockRepo: MockSubscriptionRepository;

  beforeEach(() => {
    mockRepo = new MockSubscriptionRepository();
    useCase = new CheckLimitForActionUseCase(mockRepo);
  });

  describe('publish_product action', () => {
    it('should allow publishing when under limit (ESSENTIEL: 5/10)', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        productsUsed: 5,
        pinnedProductsUsed: 0,
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
        action: 'publish_product',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.allowed).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.OK);
    });

    it('should allow with warning when at last slot (ESSENTIEL: 9/10)', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        productsUsed: 9,
        pinnedProductsUsed: 0,
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
        action: 'publish_product',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.allowed).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.WARNING);
      expect(result.value!.message).toContain('dernier');
    });

    it('should block when limit reached (ESSENTIEL: 10/10)', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        productsUsed: 10,
        pinnedProductsUsed: 0,
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
        action: 'publish_product',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.allowed).toBe(false);
      expect(result.value!.status).toBe(LimitStatus.BLOCKED);
      expect(result.value!.message).toContain('Impossible de publier');
    });

    it('should block when STUDIO limit reached (20/20)', async () => {
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
        productsUsed: 20,
        pinnedProductsUsed: 0,
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
        creatorId: 'creator-1',
        action: 'publish_product',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.allowed).toBe(false);
      expect(result.value!.status).toBe(LimitStatus.BLOCKED);
      expect(result.value!.message).toContain('Atelier');
    });

    it('should always allow for ATELIER plan', async () => {
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
        pinnedProductsUsed: 0,
        commissionRate: 0.03,
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
        action: 'publish_product',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.allowed).toBe(true);
      expect(result.value!.limit).toBe(-1);
    });
  });

  describe('pin_product action', () => {
    it('should allow pinning when under limit (ESSENTIEL: 1/3)', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        productsUsed: 0,
        pinnedProductsUsed: 1,
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
        action: 'pin_product',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.allowed).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.OK);
    });

    it('should allow with warning when at last slot (ESSENTIEL: 2/3)', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        productsUsed: 0,
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
        action: 'pin_product',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.allowed).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.WARNING);
      expect(result.value!.message).toContain('dernier');
    });

    it('should block when pinned products limit reached (ESSENTIEL: 3/3)', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        productsUsed: 0,
        pinnedProductsUsed: 3,
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
        action: 'pin_product',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.allowed).toBe(false);
      expect(result.value!.status).toBe(LimitStatus.BLOCKED);
      expect(result.value!.message).toContain('mettre en avant');
    });

    it('should block when STUDIO pinned limit reached (5/5)', async () => {
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
        productsUsed: 0,
        pinnedProductsUsed: 5,
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
        creatorId: 'creator-1',
        action: 'pin_product',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.allowed).toBe(false);
      expect(result.value!.status).toBe(LimitStatus.BLOCKED);
    });

    it('should always allow for ATELIER plan (unlimited pins)', async () => {
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
        productsUsed: 0,
        pinnedProductsUsed: 100,
        commissionRate: 0.03,
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
        action: 'pin_product',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.allowed).toBe(true);
      expect(result.value!.limit).toBe(-1);
    });
  });

  describe('validation', () => {
    it('should fail when creatorId is empty', async () => {
      const result = await useCase.execute({
        creatorId: '',
        action: 'publish_product',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should fail when subscription not found', async () => {
      const result = await useCase.execute({
        creatorId: 'non-existent',
        action: 'publish_product',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouve');
    });
  });
});
