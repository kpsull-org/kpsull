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
}

describe('CheckLimitUseCase', () => {
  let useCase: CheckLimitUseCase;
  let mockRepo: MockSubscriptionRepository;

  beforeEach(() => {
    mockRepo = new MockSubscriptionRepository();
    useCase = new CheckLimitUseCase(mockRepo);
  });

  describe('checkProductLimit', () => {
    it('should return BLOCKED when product limit is reached (FREE: 5/5)', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        productsUsed: 5,
        salesUsed: 0,
        stripeSubscriptionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.checkProductLimit('creator-1');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.BLOCKED);
      expect(result.value!.current).toBe(5);
      expect(result.value!.limit).toBe(5);
      expect(result.value!.message).toContain('Limite de produits atteinte');
    });

    it('should return WARNING when at last available product slot (FREE: 4/5)', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        productsUsed: 4,
        salesUsed: 0,
        stripeSubscriptionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.checkProductLimit('creator-1');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.WARNING);
      expect(result.value!.current).toBe(4);
      expect(result.value!.limit).toBe(5);
      expect(result.value!.message).toContain('plus qu\'un emplacement');
    });

    it('should return OK when under limit (FREE: 3/5)', async () => {
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
        salesUsed: 0,
        stripeSubscriptionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.checkProductLimit('creator-1');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.OK);
      expect(result.value!.current).toBe(3);
      expect(result.value!.limit).toBe(5);
      expect(result.value!.message).toBeUndefined();
    });

    it('should return OK for PRO plan (unlimited)', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'PRO',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        productsUsed: 100,
        salesUsed: 0,
        stripeSubscriptionId: 'sub_stripe_123',
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
      expect(result.error).toContain('non trouvé');
    });

    it('should fail when creatorId is empty', async () => {
      // Act
      const result = await useCase.checkProductLimit('');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });
  });

  describe('checkSalesLimit', () => {
    it('should return BLOCKED when sales limit is reached (FREE: 10/10)', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        productsUsed: 0,
        salesUsed: 10,
        stripeSubscriptionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.checkSalesLimit('creator-1');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.BLOCKED);
      expect(result.value!.current).toBe(10);
      expect(result.value!.limit).toBe(10);
      expect(result.value!.message).toContain('limite de ventes');
    });

    it('should return WARNING when approaching sales limit (FREE: 9/10)', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        productsUsed: 0,
        salesUsed: 9,
        stripeSubscriptionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.checkSalesLimit('creator-1');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.WARNING);
      expect(result.value!.current).toBe(9);
      expect(result.value!.limit).toBe(10);
      expect(result.value!.message).toContain('plus qu\'une vente');
    });

    it('should return OK when under limit (FREE: 5/10)', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        productsUsed: 0,
        salesUsed: 5,
        stripeSubscriptionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.checkSalesLimit('creator-1');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.OK);
      expect(result.value!.current).toBe(5);
      expect(result.value!.limit).toBe(10);
    });

    it('should return OK for PRO plan (unlimited)', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'PRO',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        productsUsed: 0,
        salesUsed: 500,
        stripeSubscriptionId: 'sub_stripe_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.checkSalesLimit('creator-1');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.OK);
      expect(result.value!.limit).toBe(-1);
    });

    it('should fail when subscription not found', async () => {
      // Act
      const result = await useCase.checkSalesLimit('non-existent');

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
        plan: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        productsUsed: 5,
        salesUsed: 9,
        stripeSubscriptionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.checkBothLimits('creator-1');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.products.status).toBe(LimitStatus.BLOCKED);
      expect(result.value!.sales.status).toBe(LimitStatus.WARNING);
    });

    it('should return worst status for hasBlockingLimit', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        productsUsed: 5,
        salesUsed: 10,
        stripeSubscriptionId: null,
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
  });
});
