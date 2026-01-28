import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { SubscriptionRepository } from '../ports/subscription.repository.interface';

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
  sales: CheckLimitResult;
  hasBlockingLimit: boolean;
  hasWarning: boolean;
}

export interface CheckProductLimitInput {
  creatorId: string;
}

export interface CheckSalesLimitInput {
  creatorId: string;
}

/**
 * Use Case: Check Limit
 *
 * Verifies if a creator has reached their subscription limits (products/sales).
 * Returns the limit status: OK, WARNING, or BLOCKED.
 */
export class CheckLimitUseCase
  implements UseCase<CheckProductLimitInput, CheckLimitResult>
{
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
      return Result.fail('Abonnement non trouvé');
    }

    const current = subscription.productsUsed;
    const limit = subscription.productLimit;

    // PRO plan = unlimited (-1)
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
        message: `Limite de produits atteinte (${limit}/${limit}). Passez à PRO pour publier plus de produits.`,
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
   * Check if creator has reached sales limit
   */
  async checkSalesLimit(creatorId: string): Promise<Result<CheckLimitResult>> {
    // Validate input
    if (!creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    // Get subscription
    const subscription = await this.subscriptionRepository.findByCreatorId(creatorId);

    if (!subscription) {
      return Result.fail('Abonnement non trouvé');
    }

    const current = subscription.salesUsed;
    const limit = subscription.salesLimit;

    // PRO plan = unlimited (-1)
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
        message: `Ce créateur a atteint sa limite de ventes (${limit} ventes/mois).`,
      });
    }

    // Check if at last slot (warning)
    if (current === limit - 1) {
      return Result.ok({
        status: LimitStatus.WARNING,
        current,
        limit,
        message: `Vous n'avez plus qu'une vente disponible ce mois-ci.`,
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
   * Check both product and sales limits
   */
  async checkBothLimits(creatorId: string): Promise<Result<CheckBothLimitsResult>> {
    const [productsResult, salesResult] = await Promise.all([
      this.checkProductLimit(creatorId),
      this.checkSalesLimit(creatorId),
    ]);

    if (productsResult.isFailure) {
      return Result.fail(productsResult.error!);
    }

    if (salesResult.isFailure) {
      return Result.fail(salesResult.error!);
    }

    const products = productsResult.value!;
    const sales = salesResult.value!;

    return Result.ok({
      products,
      sales,
      hasBlockingLimit:
        products.status === LimitStatus.BLOCKED || sales.status === LimitStatus.BLOCKED,
      hasWarning:
        products.status === LimitStatus.WARNING ||
        sales.status === LimitStatus.WARNING ||
        products.status === LimitStatus.BLOCKED ||
        sales.status === LimitStatus.BLOCKED,
    });
  }
}
