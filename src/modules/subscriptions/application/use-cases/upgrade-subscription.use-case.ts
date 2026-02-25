import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { SubscriptionRepository } from '../ports/subscription.repository.interface';
import { PlanType } from '../../domain/value-objects/plan.vo';
import { isUpgrade, getPlanConfig, BillingInterval } from '../../domain/plan-features';

export interface UpgradeSubscriptionInput {
  creatorId: string;
  targetPlan: PlanType;
  billingInterval: BillingInterval;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripePriceId: string;
  periodStart: Date;
  periodEnd: Date;
}

export interface UpgradeSubscriptionOutput {
  subscriptionId: string;
  plan: PlanType;
  previousPlan: PlanType;
  billingInterval: BillingInterval;
  commissionRate: number;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  currentPeriodEnd: Date;
}

/**
 * Use Case: Upgrade Subscription
 *
 * Upgrades a subscription to a higher tier after successful Stripe payment.
 * Called by the webhook handler when checkout.session.completed is received.
 *
 * Plans (ascending order):
 * - ESSENTIEL: 29€/mois ou 290€/an - Commission 5% - 10 produits
 * - STUDIO: 79€/mois ou 790€/an - Commission 4% - 20 produits
 * - ATELIER: 95€/mois ou 950€/an - Commission 3% - Illimité
 */
export class UpgradeSubscriptionUseCase
  implements UseCase<UpgradeSubscriptionInput, UpgradeSubscriptionOutput>
{
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async execute(input: UpgradeSubscriptionInput): Promise<Result<UpgradeSubscriptionOutput>> {
    // Validate input
    if (!input.creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    if (!input.targetPlan) {
      return Result.fail('Target plan est requis');
    }

    if (!input.stripeSubscriptionId?.trim()) {
      return Result.fail('Stripe subscription ID est requis');
    }

    if (!input.stripeCustomerId?.trim()) {
      return Result.fail('Stripe customer ID est requis');
    }

    if (!input.stripePriceId?.trim()) {
      return Result.fail('Stripe price ID est requis');
    }

    // Get subscription
    const subscription = await this.subscriptionRepository.findByCreatorId(input.creatorId);

    if (!subscription) {
      return Result.fail('Abonnement non trouve');
    }

    const previousPlan = subscription.plan.value;

    // Check if it's actually an upgrade
    if (!isUpgrade(previousPlan, input.targetPlan)) {
      return Result.fail(
        `${input.targetPlan} n'est pas une mise a niveau depuis ${previousPlan}`
      );
    }

    // Upgrade the subscription
    const upgradeResult = subscription.upgrade(input.targetPlan, {
      subscriptionId: input.stripeSubscriptionId,
      customerId: input.stripeCustomerId,
      priceId: input.stripePriceId,
    });

    /* c8 ignore start */
    if (upgradeResult.isFailure) {
      return Result.fail(upgradeResult.error!);
    }
    /* c8 ignore stop */

    // Update billing interval if different
    if (subscription.billingInterval !== input.billingInterval) {
      subscription.changeBillingInterval(input.billingInterval, input.stripePriceId);
    }

    // Update period dates
    subscription.renewPeriod(input.periodStart, input.periodEnd);

    // Save the updated subscription
    await this.subscriptionRepository.save(subscription);

    const planConfig = getPlanConfig(input.targetPlan);

    return Result.ok({
      subscriptionId: subscription.idString,
      plan: subscription.plan.value,
      previousPlan,
      billingInterval: subscription.billingInterval,
      commissionRate: planConfig.commissionRate,
      stripeSubscriptionId: input.stripeSubscriptionId,
      stripeCustomerId: input.stripeCustomerId,
      currentPeriodEnd: input.periodEnd,
    });
  }
}
