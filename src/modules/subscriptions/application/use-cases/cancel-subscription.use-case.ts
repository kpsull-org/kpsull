import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { SubscriptionRepository } from '../ports/subscription.repository.interface';
import { PlanType } from '../../domain/value-objects/plan.vo';
import { SubscriptionStatus } from '../../domain/entities/subscription.entity';

export interface CancelSubscriptionInput {
  creatorId: string;
  reason?: string;
  immediate?: boolean; // If true, cancel now. If false, cancel at period end
}

export interface CancelSubscriptionOutput {
  subscriptionId: string;
  plan: PlanType;
  status: SubscriptionStatus;
  canceledAt: Date;
  effectiveDate: Date; // When the subscription will actually end
}

/**
 * Use Case: Cancel Subscription
 *
 * Cancels a creator's subscription.
 * - If immediate=true, cancels immediately
 * - If immediate=false, cancels at the end of the current billing period
 *
 * Called when:
 * - User manually cancels their subscription
 * - Grace period expires after failed payment
 * - Admin cancels subscription
 */
export class CancelSubscriptionUseCase
  implements UseCase<CancelSubscriptionInput, CancelSubscriptionOutput>
{
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async execute(input: CancelSubscriptionInput): Promise<Result<CancelSubscriptionOutput>> {
    // Validate input
    if (!input.creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    // Get subscription
    const subscription = await this.subscriptionRepository.findByCreatorId(input.creatorId);

    if (!subscription) {
      return Result.fail('Abonnement non trouve');
    }

    // Check if already cancelled
    if (subscription.status === 'CANCELLED') {
      return Result.fail('Cet abonnement est deja annule');
    }

    const now = new Date();
    const effectiveDate = input.immediate ? now : subscription.currentPeriodEnd;

    // Cancel the subscription
    const cancelResult = subscription.cancelSubscription();
    if (cancelResult.isFailure) {
      return Result.fail(cancelResult.error!);
    }

    // Save the updated subscription
    await this.subscriptionRepository.save(subscription);

    return Result.ok({
      subscriptionId: subscription.idString,
      plan: subscription.plan.value,
      status: subscription.status,
      canceledAt: now,
      effectiveDate,
    });
  }
}
