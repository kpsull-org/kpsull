import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { PlanType } from '../../domain/value-objects/plan.vo';
import { SubscriptionStatus } from '../../domain/entities/subscription.entity';

// Extended repository interface for admin operations
export interface AdminSubscriptionRepository {
  findAll(filters?: {
    plan?: PlanType;
    status?: SubscriptionStatus;
  }): Promise<SubscriptionListItem[]>;
}

export interface SubscriptionListItem {
  id: string;
  userId: string;
  creatorId: string;
  plan: PlanType;
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
  productsUsed: number;
  salesUsed: number;
  stripeSubscriptionId: string | null;
}

export interface ListSubscriptionsInput {
  plan?: PlanType;
  status?: SubscriptionStatus;
}

export interface ListSubscriptionsOutput {
  subscriptions: SubscriptionListItem[];
  total: number;
}

/**
 * Use Case: List Subscriptions (Admin)
 *
 * Lists all subscriptions with optional filtering.
 * Used by admins to view and manage subscriptions.
 */
export class ListSubscriptionsUseCase
  implements UseCase<ListSubscriptionsInput, ListSubscriptionsOutput>
{
  constructor(private readonly repository: AdminSubscriptionRepository) {}

  async execute(input: ListSubscriptionsInput): Promise<Result<ListSubscriptionsOutput>> {
    const subscriptions = await this.repository.findAll({
      plan: input.plan,
      status: input.status,
    });

    return Result.ok({
      subscriptions,
      total: subscriptions.length,
    });
  }
}
