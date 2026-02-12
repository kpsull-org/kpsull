import { Result } from '@/shared/domain';
import type { SubscriptionService, LimitCheckResult } from '../../application/ports/subscription.service.interface';

/**
 * No-op implementation of SubscriptionService.
 * Always allows publishing (no limit enforcement).
 * Replace with a real implementation when subscription limits are enforced.
 */
export class NoopSubscriptionService implements SubscriptionService {
  async checkProductLimit(_creatorId: string): Promise<Result<LimitCheckResult>> {
    return Result.ok({
      status: 'OK',
      current: 0,
      limit: Infinity,
    });
  }

  async incrementProductCount(_creatorId: string): Promise<Result<void>> {
    return Result.ok();
  }

  async decrementProductCount(_creatorId: string): Promise<Result<void>> {
    return Result.ok();
  }
}
