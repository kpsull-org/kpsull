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
}

describe('CheckLimitForActionUseCase', () => {
  let useCase: CheckLimitForActionUseCase;
  let mockRepo: MockSubscriptionRepository;

  beforeEach(() => {
    mockRepo = new MockSubscriptionRepository();
    useCase = new CheckLimitForActionUseCase(mockRepo);
  });

  describe('publish_product action', () => {
    it('should allow publishing when under limit (FREE: 3/5)', async () => {
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
      const result = await useCase.execute({
        creatorId: 'creator-1',
        action: 'publish_product',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.allowed).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.OK);
    });

    it('should allow with warning when at last slot (FREE: 4/5)', async () => {
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
      const result = await useCase.execute({
        creatorId: 'creator-1',
        action: 'publish_product',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.allowed).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.WARNING);
      expect(result.value!.message).toContain('dernier produit');
    });

    it('should block when limit reached (FREE: 5/5)', async () => {
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

    it('should always allow for PRO plan', async () => {
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

  describe('make_sale action', () => {
    it('should allow sale when under limit (FREE: 5/10)', async () => {
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
      const result = await useCase.execute({
        creatorId: 'creator-1',
        action: 'make_sale',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.allowed).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.OK);
    });

    it('should allow with warning when at last sale (FREE: 9/10)', async () => {
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
      const result = await useCase.execute({
        creatorId: 'creator-1',
        action: 'make_sale',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.allowed).toBe(true);
      expect(result.value!.status).toBe(LimitStatus.WARNING);
      expect(result.value!.message).toContain('dernier');
    });

    it('should block when sales limit reached (FREE: 10/10)', async () => {
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
      const result = await useCase.execute({
        creatorId: 'creator-1',
        action: 'make_sale',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.allowed).toBe(false);
      expect(result.value!.status).toBe(LimitStatus.BLOCKED);
      expect(result.value!.message).toContain('Impossible de accepter');
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
      expect(result.error).toContain('non trouvé');
    });
  });
});
