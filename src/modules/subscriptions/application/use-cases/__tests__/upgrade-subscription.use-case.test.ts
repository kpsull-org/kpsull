import { describe, it, expect, beforeEach } from 'vitest';
import { UpgradeSubscriptionUseCase } from '../upgrade-subscription.use-case';
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

describe('UpgradeSubscriptionUseCase', () => {
  let useCase: UpgradeSubscriptionUseCase;
  let mockRepo: MockSubscriptionRepository;

  const periodStart = new Date('2026-01-28');
  const periodEnd = new Date('2027-01-28');

  beforeEach(() => {
    mockRepo = new MockSubscriptionRepository();
    useCase = new UpgradeSubscriptionUseCase(mockRepo);
  });

  describe('execute', () => {
    it('should upgrade ESSENTIEL to STUDIO successfully', async () => {
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
        productsUsed: 8,
        pinnedProductsUsed: 2,
        commissionRate: 0.05,
        stripeSubscriptionId: 'sub_old_123',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_old_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-1',
        targetPlan: 'STUDIO',
        billingInterval: 'year',
        stripeSubscriptionId: 'sub_new_123',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_studio_year',
        periodStart,
        periodEnd,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.plan).toBe('STUDIO');
      expect(result.value!.previousPlan).toBe('ESSENTIEL');
      expect(result.value!.commissionRate).toBe(0.04);
      expect(result.value!.stripeSubscriptionId).toBe('sub_new_123');
      expect(mockRepo.savedSubscription).not.toBeNull();
    });

    it('should upgrade ESSENTIEL to ATELIER successfully', async () => {
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
        pinnedProductsUsed: 1,
        commissionRate: 0.05,
        stripeSubscriptionId: 'sub_old_123',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_old_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-1',
        targetPlan: 'ATELIER',
        billingInterval: 'year',
        stripeSubscriptionId: 'sub_new_456',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_atelier_year',
        periodStart,
        periodEnd,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.plan).toBe('ATELIER');
      expect(result.value!.previousPlan).toBe('ESSENTIEL');
      expect(result.value!.commissionRate).toBe(0.03);
    });

    it('should upgrade STUDIO to ATELIER successfully', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'STUDIO',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: new Date('2025-06-15'),
        currentPeriodEnd: new Date('2026-06-15'),
        productsUsed: 18,
        pinnedProductsUsed: 4,
        commissionRate: 0.04,
        stripeSubscriptionId: 'sub_studio_123',
        stripeCustomerId: 'cus_456',
        stripePriceId: 'price_studio_year',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-1',
        targetPlan: 'ATELIER',
        billingInterval: 'year',
        stripeSubscriptionId: 'sub_new_789',
        stripeCustomerId: 'cus_456',
        stripePriceId: 'price_atelier_year',
        periodStart,
        periodEnd,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.plan).toBe('ATELIER');
      expect(result.value!.previousPlan).toBe('STUDIO');
      expect(result.value!.commissionRate).toBe(0.03);
    });

    it('should change billing interval from monthly to yearly', async () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'month',
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        productsUsed: 3,
        pinnedProductsUsed: 1,
        commissionRate: 0.05,
        stripeSubscriptionId: 'sub_monthly_123',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_essentiel_month',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-1',
        targetPlan: 'STUDIO',
        billingInterval: 'year',
        stripeSubscriptionId: 'sub_yearly_456',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_studio_year',
        periodStart,
        periodEnd,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.billingInterval).toBe('year');
    });

    it('should fail when trying to downgrade STUDIO to ESSENTIEL', async () => {
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
        productsUsed: 15,
        pinnedProductsUsed: 4,
        commissionRate: 0.04,
        stripeSubscriptionId: 'sub_studio_123',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_studio_year',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-1',
        targetPlan: 'ESSENTIEL',
        billingInterval: 'year',
        stripeSubscriptionId: 'sub_new_123',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_essentiel_year',
        periodStart,
        periodEnd,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("n'est pas une mise a niveau");
    });

    it('should fail when trying to downgrade ATELIER to STUDIO', async () => {
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
        stripeSubscriptionId: 'sub_atelier_123',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_atelier_year',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-1',
        targetPlan: 'STUDIO',
        billingInterval: 'year',
        stripeSubscriptionId: 'sub_new_123',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_studio_year',
        periodStart,
        periodEnd,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("n'est pas une mise a niveau");
    });

    it('should fail when upgrading to the same plan', async () => {
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
        stripeSubscriptionId: 'sub_studio_123',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_studio_year',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-1',
        targetPlan: 'STUDIO',
        billingInterval: 'year',
        stripeSubscriptionId: 'sub_new_123',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_studio_year',
        periodStart,
        periodEnd,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("n'est pas une mise a niveau");
    });

    it('should fail when creatorId is empty', async () => {
      // Act
      const result = await useCase.execute({
        creatorId: '',
        targetPlan: 'STUDIO',
        billingInterval: 'year',
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_123',
        periodStart,
        periodEnd,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should fail when stripeSubscriptionId is empty', async () => {
      // Act
      const result = await useCase.execute({
        creatorId: 'creator-1',
        targetPlan: 'STUDIO',
        billingInterval: 'year',
        stripeSubscriptionId: '',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_123',
        periodStart,
        periodEnd,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Stripe subscription ID');
    });

    it('should fail when stripeCustomerId is empty', async () => {
      // Act
      const result = await useCase.execute({
        creatorId: 'creator-1',
        targetPlan: 'STUDIO',
        billingInterval: 'year',
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: '',
        stripePriceId: 'price_123',
        periodStart,
        periodEnd,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Stripe customer ID');
    });

    it('should fail when stripePriceId is empty', async () => {
      // Act
      const result = await useCase.execute({
        creatorId: 'creator-1',
        targetPlan: 'STUDIO',
        billingInterval: 'year',
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        stripePriceId: '',
        periodStart,
        periodEnd,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Stripe price ID');
    });

    it('should fail when subscription not found', async () => {
      // Act
      const result = await useCase.execute({
        creatorId: 'non-existent',
        targetPlan: 'STUDIO',
        billingInterval: 'year',
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_123',
        periodStart,
        periodEnd,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouve');
    });

    it('should update period dates on upgrade', async () => {
      // Arrange
      const oldPeriodEnd = new Date('2026-01-28');
      const subscription = Subscription.reconstitute({
        id: 'sub-1',
        userId: 'user-1',
        creatorId: 'creator-1',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: new Date('2025-01-28'),
        currentPeriodEnd: oldPeriodEnd,
        productsUsed: 5,
        pinnedProductsUsed: 2,
        commissionRate: 0.05,
        stripeSubscriptionId: 'sub_old_123',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_old_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setSubscription('creator-1', subscription);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-1',
        targetPlan: 'STUDIO',
        billingInterval: 'year',
        stripeSubscriptionId: 'sub_new_123',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_studio_year',
        periodStart,
        periodEnd,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.currentPeriodEnd).toEqual(periodEnd);
    });
  });
});
