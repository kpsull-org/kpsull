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
      return Result.ok({
        allowed: false,
        status: LimitStatus.BLOCKED,
        current,
        limit,
        message: this.buildBlockedMessage(input.action, limit, subscription.plan.value),
      });
    }

    if (current === limit - 1) {
      return Result.ok({
        allowed: true,
        status: LimitStatus.WARNING,
        current,
        limit,
        message: this.buildWarningMessage(input.action, subscription.plan.value),
      });
    }

    return Result.ok({
      allowed: true,
      status: LimitStatus.OK,
      current,
      limit,
    });
  }

  private static readonly ACTION_LABELS: Record<string, { action: string; type: string; typeSingular: string }> = {
    publish_product: { action: 'publier un nouveau produit', type: 'produits', typeSingular: 'produit' },
    pin_product: { action: 'mettre en avant un nouveau produit', type: 'produits mis en avant', typeSingular: 'mise en avant' },
  };

  private static readonly UPGRADE_MAP: Record<string, string> = {
    essentiel: 'Passez a Studio ou Atelier',
    studio: 'Passez a Atelier',
  };

  private buildBlockedMessage(action: string, limit: number, planValue: string): string {
    const labels = CheckLimitForActionUseCase.ACTION_LABELS[action]!;
    /* c8 ignore start */
    const upgrade = CheckLimitForActionUseCase.UPGRADE_MAP[planValue.toLowerCase()] ?? '';
    /* c8 ignore stop */
    return `Impossible de ${labels.action}. Limite de ${limit} ${labels.type} atteinte. ${upgrade}`.trim();
  }

  private buildWarningMessage(action: string, planValue: string): string {
    const labels = CheckLimitForActionUseCase.ACTION_LABELS[action]!;
    return `Attention : c'est votre dernier ${labels.typeSingular} disponible avec le plan ${planValue}.`;
  }
}
