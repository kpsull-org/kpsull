import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { SubscriptionRepository } from '../ports/subscription.repository.interface';

export interface ExtendSubscriptionInput {
  subscriptionId: string;
  days: number;
  adminId: string;
  reason: string;
}

export interface ExtendSubscriptionOutput {
  subscriptionId: string;
  previousEndDate: Date;
  newEndDate: Date;
  daysAdded: number;
}

/**
 * Use Case: Extend Subscription (Admin)
 *
 * Allows an admin to extend a subscription's end date.
 * Used for commercial gestures or support purposes.
 */
export class ExtendSubscriptionUseCase
  implements UseCase<ExtendSubscriptionInput, ExtendSubscriptionOutput>
{
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async execute(input: ExtendSubscriptionInput): Promise<Result<ExtendSubscriptionOutput>> {
    // Validate input
    if (!input.subscriptionId?.trim()) {
      return Result.fail('Subscription ID est requis');
    }

    if (!input.days || input.days <= 0) {
      return Result.fail('Le nombre de jours doit être positif');
    }

    if (!input.adminId?.trim()) {
      return Result.fail('Admin ID est requis');
    }

    // Find subscription
    const subscription = await this.subscriptionRepository.findById(input.subscriptionId);

    if (!subscription) {
      return Result.fail('Abonnement non trouvé');
    }

    // Calculate new end date
    const previousEndDate = new Date(subscription.currentPeriodEnd);
    const newEndDate = new Date(previousEndDate);
    newEndDate.setDate(newEndDate.getDate() + input.days);

    // Extend the subscription
    subscription.renewPeriod(subscription.currentPeriodStart, newEndDate);

    // Save the updated subscription
    await this.subscriptionRepository.save(subscription);

    // TODO: Create audit log
    // TODO: Send notification email to creator

    return Result.ok({
      subscriptionId: subscription.idString,
      previousEndDate,
      newEndDate,
      daysAdded: input.days,
    });
  }
}
