import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { SubscriptionRepository } from '../ports/subscription.repository.interface';
import { LimitStatus } from './check-limit.use-case';

export interface CheckLimitForActionInput {
  creatorId: string;
  action: 'publish_product' | 'pin_product';
}

export interface CheckLimitForActionOutput {
  allowed: boolean;
  status: LimitStatus;
  current: number;
  limit: number;
  message?: string;
}

/**
 * Use Case: Check Limit For Action
 *
 * Verifies if a specific action (publish product, pin product) is allowed
 * based on the creator's subscription limits.
 *
 * This use case is called BEFORE performing the action to prevent
 * exceeding limits.
 *
 * Note: Sales are no longer limited - commission is charged per sale.
 */
export class CheckLimitForActionUseCase
  implements UseCase<CheckLimitForActionInput, CheckLimitForActionOutput>
{
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async execute(input: CheckLimitForActionInput): Promise<Result<CheckLimitForActionOutput>> {
    // Validate input
    if (!input.creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    if (!input.action) {
      return Result.fail('Action est requise');
    }

    // Get subscription
    const subscription = await this.subscriptionRepository.findByCreatorId(input.creatorId);

    if (!subscription) {
      return Result.fail('Abonnement non trouve');
    }

    let current: number;
    let limit: number;

    if (input.action === 'publish_product') {
      current = subscription.productsUsed;
      limit = subscription.productLimit;
    } else {
      // pin_product
      current = subscription.pinnedProductsUsed;
      limit = subscription.pinnedProductsLimit;
    }

    // ATELIER plan = unlimited (-1)
    if (limit === -1) {
      return Result.ok({
        allowed: true,
        status: LimitStatus.OK,
        current,
        limit: -1,
      });
    }

    // Determine status and if action is allowed
    // For actions, we need to check if we CAN do the action (current < limit)
    // not if we're AT the limit (current === limit)
    const canPerformAction = current < limit;

    if (!canPerformAction) {
      const actionLabel =
        input.action === 'publish_product'
          ? 'publier un nouveau produit'
          : 'mettre en avant un nouveau produit';

      const typeLabel = input.action === 'publish_product' ? 'produits' : 'produits mis en avant';

      const planName = subscription.plan.value.toLowerCase();
      const upgradeSuggestion =
        planName === 'essentiel'
          ? 'Passez a Studio ou Atelier'
          : planName === 'studio'
            ? 'Passez a Atelier'
            : '';

      return Result.ok({
        allowed: false,
        status: LimitStatus.BLOCKED,
        current,
        limit,
        message: `Impossible de ${actionLabel}. Limite de ${limit} ${typeLabel} atteinte. ${upgradeSuggestion}`.trim(),
      });
    }

    // Check if this will be the last allowed action (warning)
    if (current === limit - 1) {
      const typeLabel = input.action === 'publish_product' ? 'produit' : 'mise en avant';
      const planName = subscription.plan.value;

      return Result.ok({
        allowed: true,
        status: LimitStatus.WARNING,
        current,
        limit,
        message: `Attention : c'est votre dernier ${typeLabel} disponible avec le plan ${planName}.`,
      });
    }

    return Result.ok({
      allowed: true,
      status: LimitStatus.OK,
      current,
      limit,
    });
  }
}
