import { Entity, UniqueId, Result } from '@/shared/domain';
import { Plan, PlanType } from '../value-objects/plan.vo';
import { getPlanLimits, isAtLimit, isNearLimit, isUnlimited } from '../plan-features';

export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';

interface SubscriptionProps {
  userId: string;
  creatorId: string;
  plan: Plan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  productsUsed: number;
  salesUsed: number;
  stripeSubscriptionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateSubscriptionProps {
  userId: string;
  creatorId: string;
  plan?: PlanType;
}

interface ReconstituteSubscriptionProps {
  id: string;
  userId: string;
  creatorId: string;
  plan: PlanType;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  productsUsed: number;
  salesUsed: number;
  stripeSubscriptionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Subscription Entity
 *
 * Represents a creator's subscription with plan limits and usage tracking.
 */
export class Subscription extends Entity<SubscriptionProps> {
  private constructor(props: SubscriptionProps, id?: UniqueId) {
    super(props, id);
  }

  // Get ID as string (convenience method)
  get idString(): string {
    return this._id.toString();
  }

  // Getters
  get userId(): string {
    return this.props.userId;
  }

  get creatorId(): string {
    return this.props.creatorId;
  }

  get plan(): Plan {
    return this.props.plan;
  }

  get status(): SubscriptionStatus {
    return this.props.status;
  }

  get currentPeriodStart(): Date {
    return this.props.currentPeriodStart;
  }

  get currentPeriodEnd(): Date {
    return this.props.currentPeriodEnd;
  }

  get productsUsed(): number {
    return this.props.productsUsed;
  }

  get salesUsed(): number {
    return this.props.salesUsed;
  }

  get stripeSubscriptionId(): string | null {
    return this.props.stripeSubscriptionId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Computed properties
  get productLimit(): number {
    return getPlanLimits(this.props.plan.value).productLimit;
  }

  get salesLimit(): number {
    return getPlanLimits(this.props.plan.value).salesLimit;
  }

  get canAddProduct(): boolean {
    if (isUnlimited(this.productLimit)) return true;
    return this.props.productsUsed < this.productLimit;
  }

  get canMakeSale(): boolean {
    if (isUnlimited(this.salesLimit)) return true;
    return this.props.salesUsed < this.salesLimit;
  }

  get isNearProductLimit(): boolean {
    return isNearLimit(this.props.productsUsed, this.productLimit);
  }

  get isNearSalesLimit(): boolean {
    return isNearLimit(this.props.salesUsed, this.salesLimit);
  }

  get isAtProductLimit(): boolean {
    return isAtLimit(this.props.productsUsed, this.productLimit);
  }

  get isAtSalesLimit(): boolean {
    return isAtLimit(this.props.salesUsed, this.salesLimit);
  }

  // Methods
  upgrade(stripeSubscriptionId: string): Result<void> {
    if (this.props.plan.isPro) {
      return Result.fail('Déjà abonné au plan PRO');
    }

    this.props.plan = Plan.pro();
    this.props.stripeSubscriptionId = stripeSubscriptionId;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  incrementProductsUsed(): Result<void> {
    if (!this.canAddProduct) {
      return Result.fail('Limite de produits atteinte');
    }

    this.props.productsUsed += 1;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  incrementSalesUsed(): Result<void> {
    if (!this.canMakeSale) {
      return Result.fail('Limite de ventes atteinte');
    }

    this.props.salesUsed += 1;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  resetMonthlyUsage(): void {
    this.props.salesUsed = 0;
    this.props.currentPeriodStart = new Date();
    this.props.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    this.props.updatedAt = new Date();
  }

  // Factory methods
  static create(props: CreateSubscriptionProps): Result<Subscription> {
    if (!props.userId?.trim()) {
      return Result.fail('User ID est requis');
    }

    if (!props.creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    const planResult = Plan.create(props.plan ?? 'FREE');
    if (planResult.isFailure) {
      return Result.fail(planResult.error!);
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    return Result.ok(
      new Subscription({
        userId: props.userId.trim(),
        creatorId: props.creatorId.trim(),
        plan: planResult.value!,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        productsUsed: 0,
        salesUsed: 0,
        stripeSubscriptionId: null,
        createdAt: now,
        updatedAt: now,
      })
    );
  }

  static reconstitute(props: ReconstituteSubscriptionProps): Result<Subscription> {
    const planResult = Plan.create(props.plan);
    if (planResult.isFailure) {
      return Result.fail(planResult.error!);
    }

    return Result.ok(
      new Subscription(
        {
          userId: props.userId,
          creatorId: props.creatorId,
          plan: planResult.value!,
          status: props.status,
          currentPeriodStart: props.currentPeriodStart,
          currentPeriodEnd: props.currentPeriodEnd,
          productsUsed: props.productsUsed,
          salesUsed: props.salesUsed,
          stripeSubscriptionId: props.stripeSubscriptionId,
          createdAt: props.createdAt,
          updatedAt: props.updatedAt,
        },
        UniqueId.fromString(props.id)
      )
    );
  }
}
