import { Entity, UniqueId, Result } from '@/shared/domain';
import { Plan, PlanType } from '../value-objects/plan.vo';
import {
  getPlanLimits,
  getPlanConfig,
  isAtLimit,
  isNearLimit,
  isUnlimited,
  getTrialEndDate,
  isUpgrade,
  BillingInterval,
} from '../plan-features';

export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';

interface SubscriptionProps {
  userId: string;
  creatorId: string;
  plan: Plan;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  productsUsed: number;
  pinnedProductsUsed: number;
  commissionRate: number;
  // Trial period
  trialStart: Date | null;
  trialEnd: Date | null;
  isTrialing: boolean;
  // Stripe
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  stripePriceId: string | null;
  gracePeriodStart: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateSubscriptionProps {
  userId: string;
  creatorId: string;
  plan?: PlanType;
  billingInterval?: BillingInterval;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  stripePriceId?: string;
  withTrial?: boolean;
}

interface ReconstituteSubscriptionProps {
  id: string;
  userId: string;
  creatorId: string;
  plan: PlanType;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  productsUsed: number;
  pinnedProductsUsed: number;
  commissionRate: number;
  trialStart?: Date | null;
  trialEnd?: Date | null;
  isTrialing?: boolean;
  stripeSubscriptionId: string | null;
  stripeCustomerId?: string | null;
  stripePriceId?: string | null;
  gracePeriodStart?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Subscription Entity
 *
 * Represents a creator's subscription with plan limits and usage tracking.
 *
 * Plans:
 * - ESSENTIEL: 29€/mois ou 290€/an - Commission 5% - 10 produits
 * - STUDIO: 79€/mois ou 790€/an - Commission 4% - 20 produits
 * - ATELIER: 95€/mois ou 950€/an - Commission 3% - Illimité - 14j essai
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

  get billingInterval(): BillingInterval {
    return this.props.billingInterval;
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

  get pinnedProductsUsed(): number {
    return this.props.pinnedProductsUsed;
  }

  get commissionRate(): number {
    return this.props.commissionRate;
  }

  get trialStart(): Date | null {
    return this.props.trialStart;
  }

  get trialEnd(): Date | null {
    return this.props.trialEnd;
  }

  get isTrialing(): boolean {
    return this.props.isTrialing;
  }

  get stripeSubscriptionId(): string | null {
    return this.props.stripeSubscriptionId;
  }

  get stripeCustomerId(): string | null {
    return this.props.stripeCustomerId;
  }

  get stripePriceId(): string | null {
    return this.props.stripePriceId;
  }

  get gracePeriodStart(): Date | null {
    return this.props.gracePeriodStart;
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

  get pinnedProductsLimit(): number {
    return getPlanLimits(this.props.plan.value).pinnedProductsLimit;
  }

  get canAddProduct(): boolean {
    if (isUnlimited(this.productLimit)) return true;
    return this.props.productsUsed < this.productLimit;
  }

  get canPinProduct(): boolean {
    if (isUnlimited(this.pinnedProductsLimit)) return true;
    return this.props.pinnedProductsUsed < this.pinnedProductsLimit;
  }

  get isNearProductLimit(): boolean {
    return isNearLimit(this.props.productsUsed, this.productLimit);
  }

  get isAtProductLimit(): boolean {
    return isAtLimit(this.props.productsUsed, this.productLimit);
  }

  get isInTrialPeriod(): boolean {
    if (!this.props.isTrialing || !this.props.trialEnd) return false;
    return new Date() < this.props.trialEnd;
  }

  // Methods
  changePlan(newPlan: PlanType, stripeData?: {
    subscriptionId: string;
    customerId: string;
    priceId: string;
  }): Result<void> {
    const currentPlanType = this.props.plan.value;

    if (currentPlanType === newPlan) {
      return Result.fail(`Deja abonne au plan ${newPlan}`);
    }

    const planResult = Plan.create(newPlan);
    if (planResult.isFailure) {
      return Result.fail(planResult.error!);
    }

    const planConfig = getPlanConfig(newPlan);

    this.props.plan = planResult.value;
    this.props.commissionRate = planConfig.commissionRate;
    this.props.updatedAt = new Date();

    if (stripeData) {
      this.props.stripeSubscriptionId = stripeData.subscriptionId;
      this.props.stripeCustomerId = stripeData.customerId;
      this.props.stripePriceId = stripeData.priceId;
    }

    return Result.ok();
  }

  upgrade(targetPlan: PlanType, stripeData: {
    subscriptionId: string;
    customerId: string;
    priceId: string;
  }): Result<void> {
    const currentPlanType = this.props.plan.value;

    if (!isUpgrade(currentPlanType, targetPlan)) {
      return Result.fail(`${targetPlan} n'est pas une mise a niveau depuis ${currentPlanType}`);
    }

    return this.changePlan(targetPlan, stripeData);
  }

  cancelSubscription(): Result<void> {
    this.props.status = 'CANCELLED';
    this.props.stripeSubscriptionId = null;
    this.props.gracePeriodStart = null;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  startTrial(): Result<void> {
    const planConfig = getPlanConfig(this.props.plan.value);

    if (planConfig.trialDays === 0) {
      return Result.fail('Ce plan ne propose pas de periode d\'essai');
    }

    const now = new Date();
    const trialEndDate = getTrialEndDate(this.props.plan.value, now);

    this.props.trialStart = now;
    this.props.trialEnd = trialEndDate;
    this.props.isTrialing = true;
    this.props.updatedAt = now;

    return Result.ok();
  }

  endTrial(): void {
    this.props.isTrialing = false;
    this.props.updatedAt = new Date();
  }

  incrementProductsUsed(): Result<void> {
    if (!this.canAddProduct) {
      return Result.fail('Limite de produits atteinte');
    }

    this.props.productsUsed += 1;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  decrementProductsUsed(): void {
    if (this.props.productsUsed > 0) {
      this.props.productsUsed -= 1;
      this.props.updatedAt = new Date();
    }
  }

  incrementPinnedProductsUsed(): Result<void> {
    if (!this.canPinProduct) {
      return Result.fail('Limite de produits mis en avant atteinte');
    }

    this.props.pinnedProductsUsed += 1;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  decrementPinnedProductsUsed(): void {
    if (this.props.pinnedProductsUsed > 0) {
      this.props.pinnedProductsUsed -= 1;
      this.props.updatedAt = new Date();
    }
  }

  markAsPastDue(gracePeriodStart: Date): Result<void> {
    if (this.props.status === 'CANCELLED') {
      return Result.fail('Impossible de marquer un abonnement annule comme impaye');
    }

    this.props.status = 'PAST_DUE';
    this.props.gracePeriodStart = gracePeriodStart;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  renewPeriod(periodStart: Date, periodEnd: Date): void {
    this.props.status = 'ACTIVE';
    this.props.currentPeriodStart = periodStart;
    this.props.currentPeriodEnd = periodEnd;
    this.props.gracePeriodStart = null;
    this.props.updatedAt = new Date();
  }

  changeBillingInterval(interval: BillingInterval, stripePriceId: string): void {
    this.props.billingInterval = interval;
    this.props.stripePriceId = stripePriceId;
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

    const planType = props.plan ?? 'ESSENTIEL';
    const planResult = Plan.create(planType);
    if (planResult.isFailure) {
      return Result.fail(planResult.error!);
    }

    const planConfig = getPlanConfig(planType);
    const billingInterval = props.billingInterval ?? 'year';

    const now = new Date();
    const periodEnd = billingInterval === 'year'
      ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Handle trial period for ATELIER plan
    let trialStart: Date | null = null;
    let trialEnd: Date | null = null;
    let isTrialing = false;

    if (props.withTrial && planConfig.trialDays > 0) {
      trialStart = now;
      trialEnd = getTrialEndDate(planType, now);
      isTrialing = true;
    }

    return Result.ok(
      new Subscription({
        userId: props.userId.trim(),
        creatorId: props.creatorId.trim(),
        plan: planResult.value,
        status: 'ACTIVE',
        billingInterval,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        productsUsed: 0,
        pinnedProductsUsed: 0,
        commissionRate: planConfig.commissionRate,
        trialStart,
        trialEnd,
        isTrialing,
        stripeSubscriptionId: props.stripeSubscriptionId ?? null,
        stripeCustomerId: props.stripeCustomerId ?? null,
        stripePriceId: props.stripePriceId ?? null,
        gracePeriodStart: null,
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
          plan: planResult.value,
          status: props.status,
          billingInterval: props.billingInterval,
          currentPeriodStart: props.currentPeriodStart,
          currentPeriodEnd: props.currentPeriodEnd,
          productsUsed: props.productsUsed,
          pinnedProductsUsed: props.pinnedProductsUsed,
          commissionRate: props.commissionRate,
          trialStart: props.trialStart ?? null,
          trialEnd: props.trialEnd ?? null,
          isTrialing: props.isTrialing ?? false,
          stripeSubscriptionId: props.stripeSubscriptionId,
          stripeCustomerId: props.stripeCustomerId ?? null,
          stripePriceId: props.stripePriceId ?? null,
          gracePeriodStart: props.gracePeriodStart ?? null,
          createdAt: props.createdAt,
          updatedAt: props.updatedAt,
        },
        UniqueId.fromString(props.id)
      )
    );
  }
}
