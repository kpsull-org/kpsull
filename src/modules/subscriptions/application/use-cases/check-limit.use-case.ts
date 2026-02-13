import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { SubscriptionRepository } from '../ports/subscription.repository.interface';
import { PlanType } from '../../domain/value-objects/plan.vo';

/**
 * Limit Status Enum
 *
 * Represents the status of a subscription limit.
 */
export enum LimitStatus {
  OK = 'OK', // Under limit, can proceed
  WARNING = 'WARNING', // At last available slot
  BLOCKED = 'BLOCKED', // Limit reached, cannot proceed
}

export interface CheckLimitResult {
  status: LimitStatus;
  current: number;
  limit: number;
  message?: string;
}

export interface CheckBothLimitsResult {
  products: CheckLimitResult;
  pinnedProducts: CheckLimitResult;
  hasBlockingLimit: boolean;
  hasWarning: boolean;
}

export interface CheckProductLimitInput {
  creatorId: string;
}

/**
 * Use Case: Check Limit
 *
 * Verifies if a creator has reached their subscription limits (products/pinned products).
 * Returns the limit status: OK, WARNING, or BLOCKED.
 *
 * Note: Sales limits no longer exist in the 3-tier model.
 * Commission is charged per sale instead.
 */
export class CheckLimitUseCase implements UseCase<CheckProductLimitInput, CheckLimitResult> {
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async execute(input: CheckProductLimitInput): Promise<Result<CheckLimitResult>> {
    return this.checkProductLimit(input.creatorId);
  }

  /**
   * Check if creator has reached product limit
   */
  async checkProductLimit(creatorId: string): Promise<Result<CheckLimitResult>> {
    // Validate input
    if (!creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    // Get subscription
    const subscription = await this.subscriptionRepository.findByCreatorId(creatorId);

    if (!subscription) {
      return Result.fail('Abonnement non trouve');
    }

    const current = subscription.productsUsed;
    const limit = subscription.productLimit;

    // ATELIER plan = unlimited (-1)
    if (limit === -1) {
      return Result.ok({
        status: LimitStatus.OK,
        current,
        limit: -1,
      });
    }

    // Check if limit reached
    if (current >= limit) {
      return Result.ok({
        status: LimitStatus.BLOCKED,
        current,
        limit,
        message: `Limite de produits atteinte (${limit}/${limit}). Passez au plan superieur pour publier plus de produits.`,
      });
    }

    // Check if at last slot (warning)
    if (current === limit - 1) {
      return Result.ok({
        status: LimitStatus.WARNING,
        current,
        limit,
        message: `Vous n'avez plus qu'un emplacement produit disponible.`,
      });
    }

    // OK - under limit
    return Result.ok({
      status: LimitStatus.OK,
      current,
      limit,
    });
  }

  /**
   * Check if creator has reached pinned products limit
   */
  async checkPinnedProductsLimit(creatorId: string): Promise<Result<CheckLimitResult>> {
    // Validate input
    if (!creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    // Get subscription
    const subscription = await this.subscriptionRepository.findByCreatorId(creatorId);

    if (!subscription) {
      return Result.fail('Abonnement non trouve');
    }

    const current = subscription.pinnedProductsUsed;
    const limit = subscription.pinnedProductsLimit;

    // ATELIER plan = unlimited (-1)
    if (limit === -1) {
      return Result.ok({
        status: LimitStatus.OK,
        current,
        limit: -1,
      });
    }

    // Check if limit reached
    if (current >= limit) {
      return Result.ok({
        status: LimitStatus.BLOCKED,
        current,
        limit,
        message: `Limite de produits mis en avant atteinte (${limit}/${limit}).`,
      });
    }

    // Check if at last slot (warning)
    if (current === limit - 1) {
      return Result.ok({
        status: LimitStatus.WARNING,
        current,
        limit,
        message: `Vous n'avez plus qu'un emplacement de mise en avant disponible.`,
      });
    }

    // OK - under limit
    return Result.ok({
      status: LimitStatus.OK,
      current,
      limit,
    });
  }

  /**
   * Check both product and pinned products limits
   */
  async checkBothLimits(creatorId: string): Promise<Result<CheckBothLimitsResult>> {
    const [productsResult, pinnedResult] = await Promise.all([
      this.checkProductLimit(creatorId),
      this.checkPinnedProductsLimit(creatorId),
    ]);

    if (productsResult.isFailure) {
      return Result.fail(productsResult.error!);
    }

    if (pinnedResult.isFailure) {
      return Result.fail(pinnedResult.error!);
    }

    const products = productsResult.value;
    const pinnedProducts = pinnedResult.value;

    return Result.ok({
      products,
      pinnedProducts,
      hasBlockingLimit:
        products.status === LimitStatus.BLOCKED || pinnedProducts.status === LimitStatus.BLOCKED,
      hasWarning:
        products.status === LimitStatus.WARNING ||
        pinnedProducts.status === LimitStatus.WARNING ||
        products.status === LimitStatus.BLOCKED ||
        pinnedProducts.status === LimitStatus.BLOCKED,
    });
  }

  /**
   * Get upgrade recommendation based on current plan
   */
  getUpgradeRecommendation(currentPlan: PlanType): string | null {
    switch (currentPlan) {
      case 'ESSENTIEL':
        return 'Passez au plan Studio (20 produits, 4% commission) ou Atelier (illimite, 3% commission).';
      case 'STUDIO':
        return 'Passez au plan Atelier pour des produits illimites et 3% de commission.';
      case 'ATELIER':
        return null; // Already at highest plan
      default:
        return null;
    }
  }
}
