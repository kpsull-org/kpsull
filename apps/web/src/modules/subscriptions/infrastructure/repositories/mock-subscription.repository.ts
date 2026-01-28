import { Subscription } from '../../domain/entities/subscription.entity';
import { SubscriptionRepository } from '../../application/ports/subscription.repository.interface';

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
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const demoSubscription = Subscription.reconstitute({
      id: 'sub-demo-123',
      userId: 'demo-user',
      creatorId: 'demo-creator',
      plan: 'FREE',
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      productsUsed: 3,
      salesUsed: 7,
      stripeSubscriptionId: null,
      createdAt: now,
      updatedAt: now,
    }).value!;

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

  /**
   * Create a subscription for a user (for development purposes)
   */
  createForUser(userId: string, creatorId: string, plan: 'FREE' | 'PRO' = 'FREE'): Subscription {
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subscription = Subscription.reconstitute({
      id: `sub-${userId}`,
      userId,
      creatorId,
      plan,
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      productsUsed: plan === 'FREE' ? 2 : 15,
      salesUsed: plan === 'FREE' ? 5 : 50,
      stripeSubscriptionId: plan === 'PRO' ? `sub_stripe_${userId}` : null,
      createdAt: now,
      updatedAt: now,
    }).value!;

    this.subscriptions.set(userId, subscription);
    return subscription;
  }
}
