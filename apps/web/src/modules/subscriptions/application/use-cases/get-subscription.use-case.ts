import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { SubscriptionRepository } from '../ports/subscription.repository.interface';
import { PLAN_FEATURES, PlanFeatures } from '../../domain/plan-features';
import { SubscriptionStatus } from '../../domain/entities/subscription.entity';
import { PlanType } from '../../domain/value-objects/plan.vo';

export interface GetSubscriptionInput {
  userId: string;
}

export interface GetSubscriptionOutput {
  id: string;
  plan: PlanType;
  status: SubscriptionStatus;
  limits: {
    productLimit: number;
    salesLimit: number;
  };
  usage: {
    productsUsed: number;
    salesUsed: number;
  };
  features: PlanFeatures;
  canAddProduct: boolean;
  canMakeSale: boolean;
  isNearProductLimit: boolean;
  isNearSalesLimit: boolean;
  currentPeriodEnd: Date;
}

/**
 * Use Case: Get Subscription
 *
 * Retrieves a user's subscription with plan details, limits, usage, and features.
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
      return Result.fail('Abonnement non trouvé');
    }

    // Get plan features
    const planConfig = PLAN_FEATURES[subscription.plan.value];

    return Result.ok({
      id: subscription.idString,
      plan: subscription.plan.value,
      status: subscription.status,
      limits: {
        productLimit: subscription.productLimit,
        salesLimit: subscription.salesLimit,
      },
      usage: {
        productsUsed: subscription.productsUsed,
        salesUsed: subscription.salesUsed,
      },
      features: planConfig.features,
      canAddProduct: subscription.canAddProduct,
      canMakeSale: subscription.canMakeSale,
      isNearProductLimit: subscription.isNearProductLimit,
      isNearSalesLimit: subscription.isNearSalesLimit,
      currentPeriodEnd: subscription.currentPeriodEnd,
    });
  }
}
