import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { SubscriptionRepository } from '../ports/subscription.repository.interface';
import { PlanType } from '../../domain/value-objects/plan.vo';
import { SubscriptionStatus } from '../../domain/entities/subscription.entity';

export interface DowngradeToFreeInput {
  creatorId: string;
}

export interface DowngradeToFreeOutput {
  subscriptionId: string;
  plan: PlanType;
  status: SubscriptionStatus;
}

/**
 * Use Case: Downgrade to Free
 *
 * Called when a grace period expires without payment.
 * Downgrades the subscription from PRO to FREE and resets limits.
 */
export class DowngradeToFreeUseCase
  implements UseCase<DowngradeToFreeInput, DowngradeToFreeOutput>
{
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async execute(input: DowngradeToFreeInput): Promise<Result<DowngradeToFreeOutput>> {
    // Validate input
    if (!input.creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    // Get subscription
    const subscription = await this.subscriptionRepository.findByCreatorId(input.creatorId);

    if (!subscription) {
      return Result.fail('Abonnement non trouvé');
    }

    // Check if already FREE
    if (subscription.plan.isFree) {
      return Result.fail('Cet abonnement est déjà FREE');
    }

    // Downgrade to FREE
    const downgradeResult = subscription.downgradeToFree();
    if (downgradeResult.isFailure) {
      return Result.fail(downgradeResult.error!);
    }

    // Save the updated subscription
    await this.subscriptionRepository.save(subscription);

    return Result.ok({
      subscriptionId: subscription.idString,
      plan: subscription.plan.value,
      status: subscription.status,
    });
  }
}
