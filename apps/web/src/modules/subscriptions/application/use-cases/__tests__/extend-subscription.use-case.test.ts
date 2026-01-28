import { describe, it, expect, beforeEach } from 'vitest';
import { ExtendSubscriptionUseCase } from '../extend-subscription.use-case';
import { SubscriptionRepository } from '../../ports/subscription.repository.interface';
import { Subscription } from '../../../domain/entities/subscription.entity';

// Mock repository
class MockSubscriptionRepository implements SubscriptionRepository {
  private subscriptions: Map<string, Subscription> = new Map();
  public savedSubscription: Subscription | null = null;

  setSubscription(id: string, subscription: Subscription): void {
    this.subscriptions.set(id, subscription);
  }

  async findById(id: string): Promise<Subscription | null> {
    return this.subscriptions.get(id) ?? null;
  }

  async findByUserId(): Promise<Subscription | null> {
    return null;
  }

  async findByCreatorId(): Promise<Subscription | null> {
    return null;
  }

  async findByStripeSubscriptionId(): Promise<Subscription | null> {
    return null;
  }

  async findAllPastDue(): Promise<Subscription[]> {
    return [];
  }

  async save(subscription: Subscription): Promise<void> {
    this.savedSubscription = subscription;
    this.subscriptions.set(subscription.idString, subscription);
  }

  async existsByUserId(): Promise<boolean> {
    return false;
  }
}

describe('ExtendSubscriptionUseCase', () => {
  let useCase: ExtendSubscriptionUseCase;
  let mockRepo: MockSubscriptionRepository;

  beforeEach(() => {
    mockRepo = new MockSubscriptionRepository();
    useCase = new ExtendSubscriptionUseCase(mockRepo);
  });

  describe('execute', () => {
    it('should extend subscription by given number of days', async () => {
      // Arrange
      const originalEndDate = new Date('2026-02-01');
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'PRO',
        status: 'ACTIVE',
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: originalEndDate,
        productsUsed: 10,
        salesUsed: 50,
        stripeSubscriptionId: 'sub_stripe_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('sub-1', subscription);

      // Act
      const result = await useCase.execute({
        subscriptionId: 'sub-1',
        days: 30,
        adminId: 'admin-1',
        reason: 'Geste commercial',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.previousEndDate).toEqual(originalEndDate);
      const expectedNewEnd = new Date(originalEndDate);
      expectedNewEnd.setDate(expectedNewEnd.getDate() + 30);
      expect(result.value!.newEndDate.toDateString()).toBe(expectedNewEnd.toDateString());
      expect(mockRepo.savedSubscription).not.toBeNull();
    });

    it('should fail if subscription not found', async () => {
      // Act
      const result = await useCase.execute({
        subscriptionId: 'non-existent',
        days: 30,
        adminId: 'admin-1',
        reason: 'Test',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvé');
    });

    it('should fail if days is not positive', async () => {
      // Act
      const result = await useCase.execute({
        subscriptionId: 'sub-1',
        days: 0,
        adminId: 'admin-1',
        reason: 'Test',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('jours');
    });

    it('should fail if subscriptionId is empty', async () => {
      // Act
      const result = await useCase.execute({
        subscriptionId: '',
        days: 30,
        adminId: 'admin-1',
        reason: 'Test',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Subscription ID');
    });
  });
});
