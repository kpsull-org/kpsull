import { Subscription } from '../../domain/entities/subscription.entity';
import { SubscriptionRepository } from '../../application/ports/subscription.repository.interface';

/**
 * Shared test mock for SubscriptionRepository.
 *
 * Supports all lookup methods (by id, userId, creatorId, stripeSubscriptionId)
 * and exposes `savedSubscription` for save verification.
 */
export class TestSubscriptionRepository implements SubscriptionRepository {
  private store = new Map<string, Subscription>();
  public savedSubscription: Subscription | null = null;

  set(key: string, subscription: Subscription): void {
    this.store.set(key, subscription);
  }

  clear(): void {
    this.store.clear();
    this.savedSubscription = null;
  }

  async findById(id: string): Promise<Subscription | null> {
    return this.findInStore((sub) => sub.idString === id) ?? this.store.get(id) ?? null;
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    return this.findInStore((sub) => sub.userId === userId) ?? this.store.get(userId) ?? null;
  }

  async findByCreatorId(creatorId: string): Promise<Subscription | null> {
    return this.findInStore((sub) => sub.creatorId === creatorId) ?? this.store.get(creatorId) ?? null;
  }

  async save(subscription: Subscription): Promise<void> {
    this.savedSubscription = subscription;
    this.store.set(subscription.creatorId, subscription);
  }

  async existsByUserId(userId: string): Promise<boolean> {
    return (await this.findByUserId(userId)) !== null;
  }

  async findByStripeSubscriptionId(stripeId: string): Promise<Subscription | null> {
    return this.findInStore((sub) => sub.stripeSubscriptionId === stripeId);
  }

  async findAllPastDue(): Promise<Subscription[]> {
    return [...this.store.values()].filter((sub) => sub.status === 'PAST_DUE');
  }

  private findInStore(predicate: (sub: Subscription) => boolean): Subscription | null {
    for (const sub of this.store.values()) {
      if (predicate(sub)) return sub;
    }
    return null;
  }
}
