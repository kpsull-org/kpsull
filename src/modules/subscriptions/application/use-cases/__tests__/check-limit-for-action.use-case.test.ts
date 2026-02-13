import { describe, it, expect, beforeEach } from 'vitest';
import { CheckLimitForActionUseCase } from '../check-limit-for-action.use-case';
import { LimitStatus } from '../check-limit.use-case';
import { TestSubscriptionRepository } from '../../../__tests__/helpers/test-subscription.repository';
import { createTestSubscription } from '../../../__tests__/helpers/subscription.factory';

describe('CheckLimitForActionUseCase', () => {
  let useCase: CheckLimitForActionUseCase;
  let mockRepo: TestSubscriptionRepository;

  beforeEach(() => {
    mockRepo = new TestSubscriptionRepository();
    useCase = new CheckLimitForActionUseCase(mockRepo);
  });

  describe('publish_product action', () => {
    it('should allow publishing when under limit (ESSENTIEL: 5/10)', async () => {
      mockRepo.set('creator-1', createTestSubscription({ productsUsed: 5 }));

      const result = await useCase.execute({ creatorId: 'creator-1', action: 'publish_product' });

      expect(result.isSuccess).toBe(true);
      expect(result.value.allowed).toBe(true);
      expect(result.value.status).toBe(LimitStatus.OK);
    });

    it('should allow with warning when at last slot (ESSENTIEL: 9/10)', async () => {
      mockRepo.set('creator-1', createTestSubscription({ productsUsed: 9 }));

      const result = await useCase.execute({ creatorId: 'creator-1', action: 'publish_product' });

      expect(result.isSuccess).toBe(true);
      expect(result.value.allowed).toBe(true);
      expect(result.value.status).toBe(LimitStatus.WARNING);
      expect(result.value.message).toContain('dernier');
    });

    it('should block when limit reached (ESSENTIEL: 10/10)', async () => {
      mockRepo.set('creator-1', createTestSubscription({ productsUsed: 10 }));

      const result = await useCase.execute({ creatorId: 'creator-1', action: 'publish_product' });

      expect(result.isSuccess).toBe(true);
      expect(result.value.allowed).toBe(false);
      expect(result.value.status).toBe(LimitStatus.BLOCKED);
      expect(result.value.message).toContain('Impossible de publier');
    });

    it('should block when STUDIO limit reached (20/20)', async () => {
      mockRepo.set('creator-1', createTestSubscription({ plan: 'STUDIO', productsUsed: 20 }));

      const result = await useCase.execute({ creatorId: 'creator-1', action: 'publish_product' });

      expect(result.isSuccess).toBe(true);
      expect(result.value.allowed).toBe(false);
      expect(result.value.status).toBe(LimitStatus.BLOCKED);
      expect(result.value.message).toContain('Atelier');
    });

    it('should always allow for ATELIER plan', async () => {
      mockRepo.set('creator-1', createTestSubscription({ plan: 'ATELIER', productsUsed: 100 }));

      const result = await useCase.execute({ creatorId: 'creator-1', action: 'publish_product' });

      expect(result.isSuccess).toBe(true);
      expect(result.value.allowed).toBe(true);
      expect(result.value.limit).toBe(-1);
    });
  });

  describe('pin_product action', () => {
    it('should allow pinning when under limit (ESSENTIEL: 1/3)', async () => {
      mockRepo.set('creator-1', createTestSubscription({ pinnedProductsUsed: 1 }));

      const result = await useCase.execute({ creatorId: 'creator-1', action: 'pin_product' });

      expect(result.isSuccess).toBe(true);
      expect(result.value.allowed).toBe(true);
      expect(result.value.status).toBe(LimitStatus.OK);
    });

    it('should allow with warning when at last slot (ESSENTIEL: 2/3)', async () => {
      mockRepo.set('creator-1', createTestSubscription({ pinnedProductsUsed: 2 }));

      const result = await useCase.execute({ creatorId: 'creator-1', action: 'pin_product' });

      expect(result.isSuccess).toBe(true);
      expect(result.value.allowed).toBe(true);
      expect(result.value.status).toBe(LimitStatus.WARNING);
      expect(result.value.message).toContain('dernier');
    });

    it('should block when pinned products limit reached (ESSENTIEL: 3/3)', async () => {
      mockRepo.set('creator-1', createTestSubscription({ pinnedProductsUsed: 3 }));

      const result = await useCase.execute({ creatorId: 'creator-1', action: 'pin_product' });

      expect(result.isSuccess).toBe(true);
      expect(result.value.allowed).toBe(false);
      expect(result.value.status).toBe(LimitStatus.BLOCKED);
      expect(result.value.message).toContain('mettre en avant');
    });

    it('should block when STUDIO pinned limit reached (5/5)', async () => {
      mockRepo.set('creator-1', createTestSubscription({ plan: 'STUDIO', pinnedProductsUsed: 5 }));

      const result = await useCase.execute({ creatorId: 'creator-1', action: 'pin_product' });

      expect(result.isSuccess).toBe(true);
      expect(result.value.allowed).toBe(false);
      expect(result.value.status).toBe(LimitStatus.BLOCKED);
    });

    it('should always allow for ATELIER plan (unlimited pins)', async () => {
      mockRepo.set('creator-1', createTestSubscription({ plan: 'ATELIER', pinnedProductsUsed: 100 }));

      const result = await useCase.execute({ creatorId: 'creator-1', action: 'pin_product' });

      expect(result.isSuccess).toBe(true);
      expect(result.value.allowed).toBe(true);
      expect(result.value.limit).toBe(-1);
    });
  });

  describe('validation', () => {
    it('should fail when creatorId is empty', async () => {
      const result = await useCase.execute({ creatorId: '', action: 'publish_product' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should fail when subscription not found', async () => {
      const result = await useCase.execute({ creatorId: 'non-existent', action: 'publish_product' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouve');
    });

    it('should fail when action is missing', async () => {
      const result = await useCase.execute({ creatorId: 'creator-1', action: '' as any });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Action');
    });
  });
});
