import { Subscription } from '../../domain/entities/subscription.entity';
import { SubscriptionRepository } from '../../application/ports/subscription.repository.interface';
import { PlanType } from '../../domain/value-objects/plan.vo';
import { getPlanConfig, BillingInterval } from '../../domain/plan-features';

/**
 * Mock implementation of SubscriptionRepository for development
 *
 * Returns mock data without database access.
 */
export class MockSubscriptionRepository implements SubscriptionRepository {
  private subscriptions: Map<string, Subscription> = new Map();

  constructor() {
    // Initialize with a demo subscription
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const demoResult = Subscription.reconstitute({
      id: 'sub-demo-123',
      userId: 'demo-user',
      creatorId: 'demo-creator',
      plan: 'ESSENTIEL',
      status: 'ACTIVE',
      billingInterval: 'year',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      productsUsed: 3,
      pinnedProductsUsed: 1,
      commissionRate: 0.05,
      stripeSubscriptionId: null,
      createdAt: now,
      updatedAt: now,
    });

    if (demoResult.isFailure) {
      throw new Error(`Failed to create demo subscription: ${demoResult.error}`);
    }

    const demoSubscription = demoResult.value;

    this.subscriptions.set(demoSubscription.userId, demoSubscription);
  }

  async findById(id: string): Promise<Subscription | null> {
    for (const sub of this.subscriptions.values()) {
      if (sub.idString === id) {
        return sub;
      }
    }
    return null;
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    return this.subscriptions.get(userId) ?? null;
  }

  async findByCreatorId(creatorId: string): Promise<Subscription | null> {
    for (const sub of this.subscriptions.values()) {
      if (sub.creatorId === creatorId) {
        return sub;
      }
    }
    return null;
  }

  async save(subscription: Subscription): Promise<void> {
    this.subscriptions.set(subscription.userId, subscription);
  }

  async existsByUserId(userId: string): Promise<boolean> {
    return this.subscriptions.has(userId);
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null> {
    for (const sub of this.subscriptions.values()) {
      if (sub.stripeSubscriptionId === stripeSubscriptionId) {
        return sub;
      }
    }
    return null;
  }

  async findAllPastDue(): Promise<Subscription[]> {
    const pastDue: Subscription[] = [];
    for (const sub of this.subscriptions.values()) {
      if (sub.status === 'PAST_DUE') {
        pastDue.push(sub);
      }
    }
    return pastDue;
  }

  /**
   * Create a subscription for a user (for development purposes)
   */
  createForUser(
    userId: string,
    creatorId: string,
    plan: PlanType = 'ESSENTIEL',
    billingInterval: BillingInterval = 'year'
  ): Subscription {
    const now = new Date();
    const periodEnd =
      billingInterval === 'year'
        ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const planConfig = getPlanConfig(plan);

    const result = Subscription.reconstitute({
      id: `sub-${userId}`,
      userId,
      creatorId,
      plan,
      status: 'ACTIVE',
      billingInterval,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      productsUsed: { ESSENTIEL: 2, STUDIO: 8, ATELIER: 25 }[plan] ?? 25,
      pinnedProductsUsed: { ESSENTIEL: 1, STUDIO: 2, ATELIER: 5 }[plan] ?? 5,
      commissionRate: planConfig.commissionRate,
      stripeSubscriptionId: `sub_stripe_${userId}`,
      stripeCustomerId: `cus_stripe_${userId}`,
      stripePriceId: `price_${plan.toLowerCase()}_${billingInterval}`,
      createdAt: now,
      updatedAt: now,
    });

    if (result.isFailure) {
      throw new Error(`Failed to create subscription for user ${userId}: ${result.error}`);
    }

    const subscription = result.value;

    this.subscriptions.set(userId, subscription);
    return subscription;
  }
}
