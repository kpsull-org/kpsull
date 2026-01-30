import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { SubscriptionRepository } from '../ports/subscription.repository.interface';
import { PLAN_FEATURES, PlanFeatures, BillingInterval } from '../../domain/plan-features';
import { SubscriptionStatus } from '../../domain/entities/subscription.entity';
import { PlanType } from '../../domain/value-objects/plan.vo';

export interface GetSubscriptionInput {
  userId: string;
}

export interface GetSubscriptionOutput {
  id: string;
  plan: PlanType;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  limits: {
    productLimit: number;
    pinnedProductsLimit: number;
  };
  usage: {
    productsUsed: number;
    pinnedProductsUsed: number;
  };
  pricing: {
    monthlyPrice: number;
    yearlyPrice: number;
    commissionRate: number;
  };
  features: PlanFeatures;
  trial: {
    isTrialing: boolean;
    trialStart: Date | null;
    trialEnd: Date | null;
  };
  canAddProduct: boolean;
  canPinProduct: boolean;
  isNearProductLimit: boolean;
  currentPeriodEnd: Date;
}

/**
 * Use Case: Get Subscription
 *
 * Retrieves a user's subscription with plan details, limits, usage, and features.
 *
 * Plans:
 * - ESSENTIEL: 29€/mois ou 290€/an - Commission 5% - 10 produits
 * - STUDIO: 79€/mois ou 790€/an - Commission 4% - 20 produits
 * - ATELIER: 95€/mois ou 950€/an - Commission 3% - Illimité - 14j essai
 */
export class GetSubscriptionUseCase
  implements UseCase<GetSubscriptionInput, GetSubscriptionOutput>
{
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async execute(input: GetSubscriptionInput): Promise<Result<GetSubscriptionOutput>> {
    // Validate input
    if (!input.userId?.trim()) {
      return Result.fail('User ID est requis');
    }

    // Get subscription
    const subscription = await this.subscriptionRepository.findByUserId(input.userId);

    if (!subscription) {
      return Result.fail('Abonnement non trouve');
    }

    // Get plan features
    const planConfig = PLAN_FEATURES[subscription.plan.value];

    return Result.ok({
      id: subscription.idString,
      plan: subscription.plan.value,
      status: subscription.status,
      billingInterval: subscription.billingInterval,
      limits: {
        productLimit: subscription.productLimit,
        pinnedProductsLimit: subscription.pinnedProductsLimit,
      },
      usage: {
        productsUsed: subscription.productsUsed,
        pinnedProductsUsed: subscription.pinnedProductsUsed,
      },
      pricing: {
        monthlyPrice: planConfig.pricing.monthly,
        yearlyPrice: planConfig.pricing.yearly,
        commissionRate: subscription.commissionRate,
      },
      features: planConfig.features,
      trial: {
        isTrialing: subscription.isTrialing,
        trialStart: subscription.trialStart,
        trialEnd: subscription.trialEnd,
      },
      canAddProduct: subscription.canAddProduct,
      canPinProduct: subscription.canPinProduct,
      isNearProductLimit: subscription.isNearProductLimit,
      currentPeriodEnd: subscription.currentPeriodEnd,
    });
  }
}
