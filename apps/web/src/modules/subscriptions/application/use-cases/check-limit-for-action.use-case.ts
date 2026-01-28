import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { SubscriptionRepository } from '../ports/subscription.repository.interface';
import { LimitStatus } from './check-limit.use-case';

export interface CheckLimitForActionInput {
  creatorId: string;
  action: 'publish_product' | 'make_sale';
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
 * Verifies if a specific action (publish product, make sale) is allowed
 * based on the creator's subscription limits.
 *
 * This use case is called BEFORE performing the action to prevent
 * exceeding limits.
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
      return Result.fail('Abonnement non trouvé');
    }

    let current: number;
    let limit: number;

    if (input.action === 'publish_product') {
      current = subscription.productsUsed;
      limit = subscription.productLimit;
    } else {
      current = subscription.salesUsed;
      limit = subscription.salesLimit;
    }

    // PRO plan = unlimited (-1)
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
          : 'accepter une nouvelle commande';

      const typeLabel = input.action === 'publish_product' ? 'produits' : 'ventes';

      return Result.ok({
        allowed: false,
        status: LimitStatus.BLOCKED,
        current,
        limit,
        message: `Impossible de ${actionLabel}. Limite de ${limit} ${typeLabel} atteinte. Passez à PRO pour continuer.`,
      });
    }

    // Check if this will be the last allowed action (warning)
    if (current === limit - 1) {
      const typeLabel = input.action === 'publish_product' ? 'produit' : 'vente';

      return Result.ok({
        allowed: true,
        status: LimitStatus.WARNING,
        current,
        limit,
        message: `Attention : c'est votre dernier ${typeLabel} disponible avec le plan FREE.`,
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
