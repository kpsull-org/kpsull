import { describe, it, expect, beforeEach } from 'vitest';
import { CheckLimitUseCase, LimitStatus } from '../check-limit.use-case';
import { TestSubscriptionRepository } from '../../../__tests__/helpers/test-subscription.repository';
import { createTestSubscription } from '../../../__tests__/helpers/subscription.factory';

describe('CheckLimitUseCase', () => {
  let useCase: CheckLimitUseCase;
  let mockRepo: TestSubscriptionRepository;

  beforeEach(() => {
    mockRepo = new TestSubscriptionRepository();
    useCase = new CheckLimitUseCase(mockRepo);
  });

  describe('execute', () => {
    it('should delegate to checkProductLimit', async () => {
      mockRepo.set('creator-1', createTestSubscription({ productsUsed: 5 }));

      const result = await useCase.execute({ creatorId: 'creator-1' });

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe(LimitStatus.OK);
      expect(result.value.current).toBe(5);
    });
  });

  describe('checkProductLimit', () => {
    it('should return BLOCKED when product limit is reached (ESSENTIEL: 10/10)', async () => {
      mockRepo.set('creator-1', createTestSubscription({ productsUsed: 10 }));

      const result = await useCase.checkProductLimit('creator-1');

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe(LimitStatus.BLOCKED);
      expect(result.value.current).toBe(10);
      expect(result.value.limit).toBe(10);
      expect(result.value.message).toContain('Limite de produits atteinte');
    });

    it('should return WARNING when at last available product slot (ESSENTIEL: 9/10)', async () => {
      mockRepo.set('creator-1', createTestSubscription({ productsUsed: 9 }));

      const result = await useCase.checkProductLimit('creator-1');

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe(LimitStatus.WARNING);
      expect(result.value.current).toBe(9);
      expect(result.value.limit).toBe(10);
      expect(result.value.message).toContain("plus qu'un emplacement");
    });

    it('should return OK when under limit (ESSENTIEL: 5/10)', async () => {
      mockRepo.set('creator-1', createTestSubscription({ productsUsed: 5 }));

      const result = await useCase.checkProductLimit('creator-1');

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe(LimitStatus.OK);
      expect(result.value.current).toBe(5);
      expect(result.value.limit).toBe(10);
      expect(result.value.message).toBeUndefined();
    });

    it('should return BLOCKED when STUDIO limit reached (20/20)', async () => {
      mockRepo.set('creator-1', createTestSubscription({ plan: 'STUDIO', productsUsed: 20 }));

      const result = await useCase.checkProductLimit('creator-1');

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe(LimitStatus.BLOCKED);
      expect(result.value.current).toBe(20);
      expect(result.value.limit).toBe(20);
    });

    it('should return OK for ATELIER plan (unlimited)', async () => {
      mockRepo.set('creator-1', createTestSubscription({ plan: 'ATELIER', productsUsed: 100 }));

      const result = await useCase.checkProductLimit('creator-1');

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe(LimitStatus.OK);
      expect(result.value.limit).toBe(-1);
    });

    it('should fail when subscription not found', async () => {
      const result = await useCase.checkProductLimit('non-existent');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouve');
    });

    it('should fail when creatorId is empty', async () => {
      const result = await useCase.checkProductLimit('');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });
  });

  describe('checkPinnedProductsLimit', () => {
    it('should return BLOCKED when pinned products limit is reached (ESSENTIEL: 3/3)', async () => {
      mockRepo.set('creator-1', createTestSubscription({ pinnedProductsUsed: 3 }));

      const result = await useCase.checkPinnedProductsLimit('creator-1');

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe(LimitStatus.BLOCKED);
      expect(result.value.current).toBe(3);
      expect(result.value.limit).toBe(3);
      expect(result.value.message).toContain('Limite de produits mis en avant');
    });

    it('should return WARNING when approaching pinned products limit (ESSENTIEL: 2/3)', async () => {
      mockRepo.set('creator-1', createTestSubscription({ pinnedProductsUsed: 2 }));

      const result = await useCase.checkPinnedProductsLimit('creator-1');

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe(LimitStatus.WARNING);
      expect(result.value.current).toBe(2);
      expect(result.value.limit).toBe(3);
      expect(result.value.message).toContain('mise en avant disponible');
    });

    it('should return OK when under limit (ESSENTIEL: 1/3)', async () => {
      mockRepo.set('creator-1', createTestSubscription({ pinnedProductsUsed: 1 }));

      const result = await useCase.checkPinnedProductsLimit('creator-1');

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe(LimitStatus.OK);
      expect(result.value.current).toBe(1);
      expect(result.value.limit).toBe(3);
    });

    it('should return OK for ATELIER plan (unlimited pinned products)', async () => {
      mockRepo.set('creator-1', createTestSubscription({ plan: 'ATELIER', pinnedProductsUsed: 50 }));

      const result = await useCase.checkPinnedProductsLimit('creator-1');

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe(LimitStatus.OK);
      expect(result.value.limit).toBe(-1);
    });

    it('should return correct limit for STUDIO plan (5 pinned products)', async () => {
      mockRepo.set('creator-1', createTestSubscription({ plan: 'STUDIO', pinnedProductsUsed: 5 }));

      const result = await useCase.checkPinnedProductsLimit('creator-1');

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe(LimitStatus.BLOCKED);
      expect(result.value.current).toBe(5);
      expect(result.value.limit).toBe(5);
    });

    it('should fail when subscription not found', async () => {
      const result = await useCase.checkPinnedProductsLimit('non-existent');

      expect(result.isFailure).toBe(true);
    });

    it('should fail when creatorId is empty', async () => {
      const result = await useCase.checkPinnedProductsLimit('');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });
  });

  describe('checkBothLimits', () => {
    it('should return combined limit status', async () => {
      mockRepo.set('creator-1', createTestSubscription({ productsUsed: 10, pinnedProductsUsed: 2 }));

      const result = await useCase.checkBothLimits('creator-1');

      expect(result.isSuccess).toBe(true);
      expect(result.value.products.status).toBe(LimitStatus.BLOCKED);
      expect(result.value.pinnedProducts.status).toBe(LimitStatus.WARNING);
    });

    it('should return worst status for hasBlockingLimit', async () => {
      mockRepo.set('creator-1', createTestSubscription({ productsUsed: 10, pinnedProductsUsed: 3 }));

      const result = await useCase.checkBothLimits('creator-1');

      expect(result.isSuccess).toBe(true);
      expect(result.value.hasBlockingLimit).toBe(true);
      expect(result.value.hasWarning).toBe(true);
    });

    it('should fail when creatorId is empty', async () => {
      const result = await useCase.checkBothLimits('');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should return no blocking for ATELIER plan', async () => {
      mockRepo.set('creator-1', createTestSubscription({ plan: 'ATELIER', productsUsed: 1000, pinnedProductsUsed: 500 }));

      const result = await useCase.checkBothLimits('creator-1');

      expect(result.isSuccess).toBe(true);
      expect(result.value.hasBlockingLimit).toBe(false);
      expect(result.value.hasWarning).toBe(false);
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

    it('should return null for unknown plan', () => {
      const recommendation = useCase.getUpgradeRecommendation('UNKNOWN' as never);
      expect(recommendation).toBeNull();
    });
  });
});
