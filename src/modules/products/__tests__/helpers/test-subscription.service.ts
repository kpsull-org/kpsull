import type { SubscriptionService, LimitCheckResult } from '../../application/ports/subscription.service.interface';
import { Result } from '@/shared/domain';

export class TestSubscriptionService implements SubscriptionService {
  private limitResult: LimitCheckResult = { status: 'OK', current: 0, limit: 5 };
  public productCountIncremented = false;
  public productCountDecremented = false;

  setLimitResult(result: LimitCheckResult): void {
    this.limitResult = result;
  }

  async checkProductLimit(): Promise<Result<LimitCheckResult>> {
    return Result.ok(this.limitResult);
  }

  async incrementProductCount(): Promise<Result<void>> {
    this.productCountIncremented = true;
    return Result.ok();
  }

  async decrementProductCount(): Promise<Result<void>> {
    this.productCountDecremented = true;
    return Result.ok();
  }
}
