import { describe, it, expect, beforeEach } from 'vitest';
import { UpgradeToProUseCase } from '../upgrade-to-pro.use-case';
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

  async save(subscription: Subscription): Promise<void> {
    this.savedSubscription = subscription;
    this.subscriptions.set(subscription.creatorId, subscription);
  }

  async existsByUserId(): Promise<boolean> {
    return false;
  }
}

describe('UpgradeToProUseCase', () => {
  let useCase: UpgradeToProUseCase;
  let mockRepo: MockSubscriptionRepository;

  beforeEach(() => {
    mockRepo = new MockSubscriptionRepository();
    useCase = new UpgradeToProUseCase(mockRepo);
  });

  describe('execute', () => {
    it('should upgrade a FREE subscription to PRO', async () => {
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

      const input = {
        creatorId: 'creator-1',
        stripeSubscriptionId: 'sub_stripe_123',
        stripeCustomerId: 'cus_stripe_456',
        periodStart: new Date('2026-01-28'),
        periodEnd: new Date('2026-02-28'),
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.plan).toBe('PRO');
      expect(result.value!.stripeSubscriptionId).toBe('sub_stripe_123');
      expect(mockRepo.savedSubscription).not.toBeNull();
      expect(mockRepo.savedSubscription!.plan.isPro).toBe(true);
    });

    it('should fail if subscription not found', async () => {
      // Act
      const result = await useCase.execute({
        creatorId: 'non-existent',
        stripeSubscriptionId: 'sub_stripe_123',
        stripeCustomerId: 'cus_stripe_456',
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvé');
    });

    it('should fail if already PRO', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'PRO',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        productsUsed: 50,
        salesUsed: 100,
        stripeSubscriptionId: 'sub_existing',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-1',
        stripeSubscriptionId: 'sub_stripe_123',
        stripeCustomerId: 'cus_stripe_456',
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('déjà');
    });

    it('should fail if creatorId is empty', async () => {
      // Act
      const result = await useCase.execute({
        creatorId: '',
        stripeSubscriptionId: 'sub_stripe_123',
        stripeCustomerId: 'cus_stripe_456',
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should fail if stripeSubscriptionId is empty', async () => {
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
      const result = await useCase.execute({
        creatorId: 'creator-1',
        stripeSubscriptionId: '',
        stripeCustomerId: 'cus_stripe_456',
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Stripe subscription ID');
    });
  });
});
