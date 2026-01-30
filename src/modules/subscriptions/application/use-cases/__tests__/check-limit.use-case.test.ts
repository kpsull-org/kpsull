import { describe, it, expect, beforeEach } from 'vitest';
import { CheckLimitUseCase, LimitStatus } from '../check-limit.use-case';
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

describe('CheckLimitUseCase', () => {
  let useCase: CheckLimitUseCase;
  let mockRepo: MockSubscriptionRepository;

  beforeEach(() => {
    mockRepo = new MockSubscriptionRepository();
    useCase = new CheckLimitUseCase(mockRepo);
  });

  describe('checkProductLimit', () => {
    it('should return BLOCKED when product limit is reached (ESSENTIEL: 10/10)', async () => {
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
      const result = await useCase.checkProductLimit('creator-1');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.BLOCKED);
      expect(result.value!.current).toBe(10);
      expect(result.value!.limit).toBe(10);
      expect(result.value!.message).toContain('Limite de produits atteinte');
    });

    it('should return WARNING when at last available product slot (ESSENTIEL: 9/10)', async () => {
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
      const result = await useCase.checkProductLimit('creator-1');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.WARNING);
      expect(result.value!.current).toBe(9);
      expect(result.value!.limit).toBe(10);
      expect(result.value!.message).toContain("plus qu'un emplacement");
    });

    it('should return OK when under limit (ESSENTIEL: 5/10)', async () => {
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
      const result = await useCase.checkProductLimit('creator-1');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.OK);
      expect(result.value!.current).toBe(5);
      expect(result.value!.limit).toBe(10);
      expect(result.value!.message).toBeUndefined();
    });

    it('should return BLOCKED when STUDIO limit reached (20/20)', async () => {
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
      const result = await useCase.checkProductLimit('creator-1');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.BLOCKED);
      expect(result.value!.current).toBe(20);
      expect(result.value!.limit).toBe(20);
    });

    it('should return OK for ATELIER plan (unlimited)', async () => {
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
      const result = await useCase.checkProductLimit('creator-1');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.OK);
      expect(result.value!.limit).toBe(-1);
    });

    it('should fail when subscription not found', async () => {
      // Act
      const result = await useCase.checkProductLimit('non-existent');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouve');
    });

    it('should fail when creatorId is empty', async () => {
      // Act
      const result = await useCase.checkProductLimit('');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });
  });

  describe('checkPinnedProductsLimit', () => {
    it('should return BLOCKED when pinned products limit is reached (ESSENTIEL: 3/3)', async () => {
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
      const result = await useCase.checkPinnedProductsLimit('creator-1');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.BLOCKED);
      expect(result.value!.current).toBe(3);
      expect(result.value!.limit).toBe(3);
      expect(result.value!.message).toContain('Limite de produits mis en avant');
    });

    it('should return WARNING when approaching pinned products limit (ESSENTIEL: 2/3)', async () => {
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
      const result = await useCase.checkPinnedProductsLimit('creator-1');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.WARNING);
      expect(result.value!.current).toBe(2);
      expect(result.value!.limit).toBe(3);
      expect(result.value!.message).toContain('mise en avant disponible');
    });

    it('should return OK when under limit (ESSENTIEL: 1/3)', async () => {
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
      const result = await useCase.checkPinnedProductsLimit('creator-1');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.OK);
      expect(result.value!.current).toBe(1);
      expect(result.value!.limit).toBe(3);
    });

    it('should return OK for ATELIER plan (unlimited pinned products)', async () => {
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
        pinnedProductsUsed: 50,
        commissionRate: 0.03,
        stripeSubscriptionId: 'sub_stripe_123',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.checkPinnedProductsLimit('creator-1');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.OK);
      expect(result.value!.limit).toBe(-1);
    });

    it('should return correct limit for STUDIO plan (5 pinned products)', async () => {
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
      const result = await useCase.checkPinnedProductsLimit('creator-1');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.BLOCKED);
      expect(result.value!.current).toBe(5);
      expect(result.value!.limit).toBe(5);
    });

    it('should fail when subscription not found', async () => {
      // Act
      const result = await useCase.checkPinnedProductsLimit('non-existent');

      // Assert
      expect(result.isFailure).toBe(true);
    });
  });

  describe('checkBothLimits', () => {
    it('should return combined limit status', async () => {
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
      const result = await useCase.checkBothLimits('creator-1');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.products.status).toBe(LimitStatus.BLOCKED);
      expect(result.value!.pinnedProducts.status).toBe(LimitStatus.WARNING);
    });

    it('should return worst status for hasBlockingLimit', async () => {
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
      const result = await useCase.checkBothLimits('creator-1');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.hasBlockingLimit).toBe(true);
      expect(result.value!.hasWarning).toBe(true);
    });

    it('should return no blocking for ATELIER plan', async () => {
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
        productsUsed: 1000,
        pinnedProductsUsed: 500,
        commissionRate: 0.03,
        stripeSubscriptionId: 'sub_stripe_123',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.checkBothLimits('creator-1');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.hasBlockingLimit).toBe(false);
      expect(result.value!.hasWarning).toBe(false);
    });
  });

  describe('getUpgradeRecommendation', () => {
    it('should return recommendation for ESSENTIEL plan', () => {
      const recommendation = useCase.getUpgradeRecommendation('ESSENTIEL');
      expect(recommendation).toContain('Studio');
      expect(recommendation).toContain('Atelier');
    });

    it('should return recommendation for STUDIO plan', () => {
      const recommendation = useCase.getUpgradeRecommendation('STUDIO');
      expect(recommendation).toContain('Atelier');
      expect(recommendation).toContain('3%');
    });

    it('should return null for ATELIER plan', () => {
      const recommendation = useCase.getUpgradeRecommendation('ATELIER');
      expect(recommendation).toBeNull();
    });
  });
});
