import { describe, it, expect, beforeEach } from 'vitest';
import { ExtendSubscriptionUseCase } from '../extend-subscription.use-case';
import { IAuthorizationService } from '../../ports/authorization.service.interface';
import { TestSubscriptionRepository } from '../../../__tests__/helpers/test-subscription.repository';
import { createTestSubscription } from '../../../__tests__/helpers/subscription.factory';

class MockAuthorizationService implements IAuthorizationService {
  private adminIds = new Set<string>();

  setAdmin(userId: string): void {
    this.adminIds.add(userId);
  }

  async isAdmin(userId: string): Promise<boolean> {
    return this.adminIds.has(userId);
  }
}

describe('ExtendSubscriptionUseCase', () => {
  let useCase: ExtendSubscriptionUseCase;
  let mockRepo: TestSubscriptionRepository;
  let mockAuthService: MockAuthorizationService;

  beforeEach(() => {
    mockRepo = new TestSubscriptionRepository();
    mockAuthService = new MockAuthorizationService();
    useCase = new ExtendSubscriptionUseCase(mockRepo, mockAuthService);
  });

  describe('execute', () => {
    it('should extend STUDIO subscription by given number of days when user is admin', async () => {
      const originalEndDate = new Date('2026-02-01');
      mockRepo.set('sub-1', createTestSubscription({
        plan: 'STUDIO', currentPeriodEnd: originalEndDate,
        productsUsed: 15, pinnedProductsUsed: 4,
      }));
      mockAuthService.setAdmin('admin-1');

      const result = await useCase.execute({
        subscriptionId: 'sub-1', days: 30, adminId: 'admin-1', reason: 'Geste commercial',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.previousEndDate).toEqual(originalEndDate);
      const expectedNewEnd = new Date(originalEndDate);
      expectedNewEnd.setDate(expectedNewEnd.getDate() + 30);
      expect(result.value.newEndDate.toDateString()).toBe(expectedNewEnd.toDateString());
      expect(mockRepo.savedSubscription).not.toBeNull();
    });

    it('should extend ATELIER subscription by given number of days', async () => {
      const originalEndDate = new Date('2026-03-15');
      mockRepo.set('sub-2', createTestSubscription({
        id: 'sub-2', userId: 'user-2', creatorId: 'creator-2',
        plan: 'ATELIER', currentPeriodEnd: originalEndDate,
        productsUsed: 50, pinnedProductsUsed: 20,
        stripeSubscriptionId: 'sub_stripe_456', stripeCustomerId: 'cus_456', stripePriceId: 'price_456',
      }));
      mockAuthService.setAdmin('admin-1');

      const result = await useCase.execute({
        subscriptionId: 'sub-2', days: 14, adminId: 'admin-1', reason: 'Compensation suite a un incident',
      });

      expect(result.isSuccess).toBe(true);
      const expectedNewEnd = new Date(originalEndDate);
      expectedNewEnd.setDate(expectedNewEnd.getDate() + 14);
      expect(result.value.newEndDate.toDateString()).toBe(expectedNewEnd.toDateString());
    });

    it('should extend ESSENTIEL subscription by given number of days', async () => {
      const originalEndDate = new Date('2026-04-01');
      mockRepo.set('sub-3', createTestSubscription({
        id: 'sub-3', userId: 'user-3', creatorId: 'creator-3',
        billingInterval: 'month', currentPeriodEnd: originalEndDate,
        productsUsed: 5, pinnedProductsUsed: 2,
        stripeSubscriptionId: 'sub_stripe_789', stripeCustomerId: 'cus_789', stripePriceId: 'price_789',
      }));
      mockAuthService.setAdmin('admin-1');

      const result = await useCase.execute({
        subscriptionId: 'sub-3', days: 7, adminId: 'admin-1', reason: 'Geste commercial',
      });

      expect(result.isSuccess).toBe(true);
      const expectedNewEnd = new Date(originalEndDate);
      expectedNewEnd.setDate(expectedNewEnd.getDate() + 7);
      expect(result.value.newEndDate.toDateString()).toBe(expectedNewEnd.toDateString());
    });

    it('should fail if user is not an admin', async () => {
      mockRepo.set('sub-1', createTestSubscription({
        plan: 'STUDIO', productsUsed: 10, pinnedProductsUsed: 3,
      }));

      const result = await useCase.execute({
        subscriptionId: 'sub-1', days: 30, adminId: 'not-admin-user', reason: 'Geste commercial',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('administrateurs');
      expect(mockRepo.savedSubscription).toBeNull();
    });

    it('should fail if subscription not found', async () => {
      mockAuthService.setAdmin('admin-1');

      const result = await useCase.execute({
        subscriptionId: 'non-existent', days: 30, adminId: 'admin-1', reason: 'Test',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvé');
    });

    it('should fail if days is not positive', async () => {
      mockAuthService.setAdmin('admin-1');

      const result = await useCase.execute({
        subscriptionId: 'sub-1', days: 0, adminId: 'admin-1', reason: 'Test',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('jours');
    });

    it('should fail if days is negative', async () => {
      mockAuthService.setAdmin('admin-1');

      const result = await useCase.execute({
        subscriptionId: 'sub-1', days: -5, adminId: 'admin-1', reason: 'Test',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('jours');
    });

    it('should fail if subscriptionId is empty', async () => {
      mockAuthService.setAdmin('admin-1');

      const result = await useCase.execute({
        subscriptionId: '', days: 30, adminId: 'admin-1', reason: 'Test',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Subscription ID');
    });

    it('should fail if subscriptionId is whitespace only', async () => {
      mockAuthService.setAdmin('admin-1');

      const result = await useCase.execute({
        subscriptionId: '   ', days: 30, adminId: 'admin-1', reason: 'Test',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Subscription ID');
    });

    it('should fail if adminId is empty', async () => {
      const result = await useCase.execute({
        subscriptionId: 'sub-1', days: 30, adminId: '', reason: 'Test',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Admin ID');
    });

    it('should fail if adminId is whitespace only', async () => {
      const result = await useCase.execute({
        subscriptionId: 'sub-1', days: 30, adminId: '   ', reason: 'Test',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Admin ID');
    });

    it('should validate admin before checking subscription existence', async () => {
      const result = await useCase.execute({
        subscriptionId: 'sub-1', days: 30, adminId: 'not-admin', reason: 'Test',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('administrateurs');
    });

    it('should handle subscription with monthly billing interval', async () => {
      const originalEndDate = new Date('2026-02-15');
      mockRepo.set('sub-monthly', createTestSubscription({
        id: 'sub-monthly', billingInterval: 'month', currentPeriodEnd: originalEndDate,
        productsUsed: 3, pinnedProductsUsed: 1,
        stripeSubscriptionId: 'sub_stripe_monthly', stripeCustomerId: 'cus_monthly', stripePriceId: 'price_monthly',
      }));
      mockAuthService.setAdmin('admin-1');

      const result = await useCase.execute({
        subscriptionId: 'sub-monthly', days: 15, adminId: 'admin-1', reason: 'Extension exceptionnelle',
      });

      expect(result.isSuccess).toBe(true);
      const expectedNewEnd = new Date(originalEndDate);
      expectedNewEnd.setDate(expectedNewEnd.getDate() + 15);
      expect(result.value.newEndDate.toDateString()).toBe(expectedNewEnd.toDateString());
    });
  });
});
