import { Subscription, SubscriptionStatus } from '../../domain/entities/subscription.entity';
import { BillingInterval } from '../../domain/plan-features';
import { PlanType } from '../../domain/value-objects/plan.vo';

interface TestSubscriptionOverrides {
  id?: string;
  userId?: string;
  creatorId?: string;
  plan?: PlanType;
  status?: SubscriptionStatus;
  billingInterval?: BillingInterval;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  productsUsed?: number;
  pinnedProductsUsed?: number;
  commissionRate?: number;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  stripePriceId?: string | null;
  gracePeriodStart?: Date | null;
  isTrialing?: boolean;
  trialStart?: Date | null;
  trialEnd?: Date | null;
}

const COMMISSION_RATES: Record<string, number> = {
  ESSENTIEL: 0.05,
  STUDIO: 0.04,
  ATELIER: 0.03,
};

/**
 * Factory for creating Subscription entities in tests.
 *
 * Only override what matters for the test - everything else gets sensible defaults.
 */
export function createTestSubscription(overrides: TestSubscriptionOverrides = {}): Subscription {
  const plan = overrides.plan ?? 'ESSENTIEL';

  return Subscription.reconstitute({
    id: overrides.id ?? 'sub-1',
    userId: overrides.userId ?? 'user-1',
    creatorId: overrides.creatorId ?? 'creator-1',
    plan,
    status: overrides.status ?? 'ACTIVE',
    billingInterval: overrides.billingInterval ?? 'year',
    currentPeriodStart: overrides.currentPeriodStart ?? new Date(),
    currentPeriodEnd: overrides.currentPeriodEnd ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    productsUsed: overrides.productsUsed ?? 0,
    pinnedProductsUsed: overrides.pinnedProductsUsed ?? 0,
    commissionRate: overrides.commissionRate ?? COMMISSION_RATES[plan] ?? 0.05,
    stripeSubscriptionId: overrides.stripeSubscriptionId ?? 'sub_stripe_123',
    stripeCustomerId: overrides.stripeCustomerId ?? 'cus_123',
    stripePriceId: overrides.stripePriceId ?? 'price_123',
    gracePeriodStart: overrides.gracePeriodStart,
    isTrialing: overrides.isTrialing,
    trialStart: overrides.trialStart,
    trialEnd: overrides.trialEnd,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).value;
}
