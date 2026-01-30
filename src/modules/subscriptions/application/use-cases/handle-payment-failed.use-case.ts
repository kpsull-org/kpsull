import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { SubscriptionRepository } from '../ports/subscription.repository.interface';
import { SubscriptionStatus } from '../../domain/entities/subscription.entity';

export interface HandlePaymentFailedInput {
  stripeSubscriptionId: string;
  failedAt: Date;
}

export interface HandlePaymentFailedOutput {
  subscriptionId: string;
  status: SubscriptionStatus;
  gracePeriodStart: Date;
}

/**
 * Use Case: Handle Payment Failed
 *
 * Called when a recurring payment fails (invoice.payment_failed webhook).
 * Marks the subscription as PAST_DUE and starts the grace period.
 */
export class HandlePaymentFailedUseCase
  implements UseCase<HandlePaymentFailedInput, HandlePaymentFailedOutput>
{
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async execute(input: HandlePaymentFailedInput): Promise<Result<HandlePaymentFailedOutput>> {
    // Validate input
    if (!input.stripeSubscriptionId?.trim()) {
      return Result.fail('Stripe subscription ID est requis');
    }

    // Find subscription by Stripe ID
    const subscription = await this.subscriptionRepository.findByStripeSubscriptionId(
      input.stripeSubscriptionId
    );

    if (!subscription) {
      return Result.fail('Abonnement non trouvé');
    }

    // If already in grace period, don't restart it
    if (subscription.status === 'PAST_DUE' && subscription.gracePeriodStart) {
      return Result.ok({
        subscriptionId: subscription.idString,
        status: subscription.status,
        gracePeriodStart: subscription.gracePeriodStart,
      });
    }

    // Mark as PAST_DUE and start grace period
    const markResult = subscription.markAsPastDue(input.failedAt);
    if (markResult.isFailure) {
      return Result.fail(markResult.error!);
    }

    // Save the updated subscription
    await this.subscriptionRepository.save(subscription);

    return Result.ok({
      subscriptionId: subscription.idString,
      status: subscription.status,
      gracePeriodStart: subscription.gracePeriodStart!,
    });
  }
}
