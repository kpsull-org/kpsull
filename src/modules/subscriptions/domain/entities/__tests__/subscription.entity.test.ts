import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Subscription } from '../subscription.entity';

describe('Subscription Entity', () => {
  const baseDate = new Date('2026-01-28T10:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(baseDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('create', () => {
    it('should create a subscription with ESSENTIEL plan by default', () => {
      const result = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.plan.isEssentiel).toBe(true);
      expect(result.value?.status).toBe('ACTIVE');
      expect(result.value?.commissionRate).toBe(0.05);
    });

    it('should create a subscription with STUDIO plan', () => {
      const result = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'STUDIO',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.plan.isStudio).toBe(true);
      expect(result.value?.commissionRate).toBe(0.04);
    });

    it('should create a subscription with ATELIER plan', () => {
      const result = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ATELIER',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.plan.isAtelier).toBe(true);
      expect(result.value?.commissionRate).toBe(0.03);
    });

    it('should create ATELIER subscription with trial when requested', () => {
      const result = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ATELIER',
        withTrial: true,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.isTrialing).toBe(true);
      expect(result.value?.trialStart).not.toBeNull();
      expect(result.value?.trialEnd).not.toBeNull();
    });

    it('should not start trial for ESSENTIEL plan even if requested', () => {
      const result = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ESSENTIEL',
        withTrial: true,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.isTrialing).toBe(false);
      expect(result.value?.trialStart).toBeNull();
    });

    it('should fail with empty userId', () => {
      const result = Subscription.create({
        userId: '',
        creatorId: 'creator-123',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('User ID est requis');
    });

    it('should fail with empty creatorId', () => {
      const result = Subscription.create({
        userId: 'user-123',
        creatorId: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Creator ID est requis');
    });

    it('should default to yearly billing', () => {
      const result = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
      });

      expect(result.value?.billingInterval).toBe('year');
    });

    it('should accept monthly billing', () => {
      const result = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        billingInterval: 'month',
      });

      expect(result.value?.billingInterval).toBe('month');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a subscription from persistence', () => {
      const result = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'STUDIO',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2027-01-28T10:00:00Z'),
        productsUsed: 3,
        pinnedProductsUsed: 1,
        commissionRate: 0.04,
        stripeSubscriptionId: 'sub_stripe123',
        createdAt: baseDate,
        updatedAt: baseDate,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.idString).toBe('sub-123');
      expect(result.value?.plan.isStudio).toBe(true);
      expect(result.value?.productsUsed).toBe(3);
      expect(result.value?.pinnedProductsUsed).toBe(1);
      expect(result.value?.commissionRate).toBe(0.04);
    });

    it('should reconstitute with trial data', () => {
      const trialStart = new Date('2026-01-15T10:00:00Z');
      const trialEnd = new Date('2026-01-29T10:00:00Z');

      const result = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ATELIER',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2027-01-28T10:00:00Z'),
        productsUsed: 0,
        pinnedProductsUsed: 0,
        commissionRate: 0.03,
        trialStart,
        trialEnd,
        isTrialing: true,
        stripeSubscriptionId: 'sub_stripe123',
        createdAt: baseDate,
        updatedAt: baseDate,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.isTrialing).toBe(true);
      expect(result.value?.trialStart).toEqual(trialStart);
      expect(result.value?.trialEnd).toEqual(trialEnd);
    });
  });

  describe('limits', () => {
    it('should return product limit for ESSENTIEL plan (10 products)', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ESSENTIEL',
      }).value;

      expect(subscription.productLimit).toBe(10);
    });

    it('should return product limit for STUDIO plan (20 products)', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'STUDIO',
      }).value;

      expect(subscription.productLimit).toBe(20);
    });

    it('should return unlimited (-1) product limit for ATELIER plan', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ATELIER',
      }).value;

      expect(subscription.productLimit).toBe(-1);
    });

    it('should return pinned products limit for ESSENTIEL plan (3)', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ESSENTIEL',
      }).value;

      expect(subscription.pinnedProductsLimit).toBe(3);
    });

    it('should return pinned products limit for STUDIO plan (5)', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'STUDIO',
      }).value;

      expect(subscription.pinnedProductsLimit).toBe(5);
    });
  });

  describe('canAddProduct', () => {
    it('should return true when under product limit', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2027-01-28T10:00:00Z'),
        productsUsed: 5,
        pinnedProductsUsed: 0,
        commissionRate: 0.05,
        stripeSubscriptionId: null,
        createdAt: baseDate,
        updatedAt: baseDate,
      }).value;

      expect(subscription.canAddProduct).toBe(true);
    });

    it('should return false when at product limit', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2027-01-28T10:00:00Z'),
        productsUsed: 10,
        pinnedProductsUsed: 0,
        commissionRate: 0.05,
        stripeSubscriptionId: null,
        createdAt: baseDate,
        updatedAt: baseDate,
      }).value;

      expect(subscription.canAddProduct).toBe(false);
    });

    it('should always return true for ATELIER plan', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ATELIER',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2027-01-28T10:00:00Z'),
        productsUsed: 100,
        pinnedProductsUsed: 0,
        commissionRate: 0.03,
        stripeSubscriptionId: 'sub_stripe123',
        createdAt: baseDate,
        updatedAt: baseDate,
      }).value;

      expect(subscription.canAddProduct).toBe(true);
    });
  });

  describe('canPinProduct', () => {
    it('should return true when under pinned products limit', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2027-01-28T10:00:00Z'),
        productsUsed: 5,
        pinnedProductsUsed: 2,
        commissionRate: 0.05,
        stripeSubscriptionId: null,
        createdAt: baseDate,
        updatedAt: baseDate,
      }).value;

      expect(subscription.canPinProduct).toBe(true);
    });

    it('should return false when at pinned products limit', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2027-01-28T10:00:00Z'),
        productsUsed: 5,
        pinnedProductsUsed: 3,
        commissionRate: 0.05,
        stripeSubscriptionId: null,
        createdAt: baseDate,
        updatedAt: baseDate,
      }).value;

      expect(subscription.canPinProduct).toBe(false);
    });
  });

  describe('isNearProductLimit', () => {
    it('should return true when at 80% of product limit', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2027-01-28T10:00:00Z'),
        productsUsed: 8, // 80% of 10
        pinnedProductsUsed: 0,
        commissionRate: 0.05,
        stripeSubscriptionId: null,
        createdAt: baseDate,
        updatedAt: baseDate,
      }).value;

      expect(subscription.isNearProductLimit).toBe(true);
    });

    it('should return false when under 80% of product limit', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2027-01-28T10:00:00Z'),
        productsUsed: 5,
        pinnedProductsUsed: 0,
        commissionRate: 0.05,
        stripeSubscriptionId: null,
        createdAt: baseDate,
        updatedAt: baseDate,
      }).value;

      expect(subscription.isNearProductLimit).toBe(false);
    });
  });

  describe('upgrade', () => {
    it('should upgrade from ESSENTIEL to STUDIO', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ESSENTIEL',
      }).value;

      const result = subscription.upgrade('STUDIO', {
        subscriptionId: 'sub_stripe123',
        customerId: 'cus_stripe123',
        priceId: 'price_studio_year',
      });

      expect(result.isSuccess).toBe(true);
      expect(subscription.plan.isStudio).toBe(true);
      expect(subscription.stripeSubscriptionId).toBe('sub_stripe123');
      expect(subscription.commissionRate).toBe(0.04);
    });

    it('should upgrade from ESSENTIEL to ATELIER', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ESSENTIEL',
      }).value;

      const result = subscription.upgrade('ATELIER', {
        subscriptionId: 'sub_stripe123',
        customerId: 'cus_stripe123',
        priceId: 'price_atelier_year',
      });

      expect(result.isSuccess).toBe(true);
      expect(subscription.plan.isAtelier).toBe(true);
      expect(subscription.commissionRate).toBe(0.03);
    });

    it('should upgrade from STUDIO to ATELIER', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'STUDIO',
      }).value;

      const result = subscription.upgrade('ATELIER', {
        subscriptionId: 'sub_stripe123',
        customerId: 'cus_stripe123',
        priceId: 'price_atelier_year',
      });

      expect(result.isSuccess).toBe(true);
      expect(subscription.plan.isAtelier).toBe(true);
    });

    it('should fail if downgrading', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'STUDIO',
      }).value;

      const result = subscription.upgrade('ESSENTIEL', {
        subscriptionId: 'sub_stripe123',
        customerId: 'cus_stripe123',
        priceId: 'price_essentiel_year',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("n'est pas une mise a niveau");
    });

    it('should fail if same plan', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'STUDIO',
      }).value;

      const result = subscription.upgrade('STUDIO', {
        subscriptionId: 'sub_stripe123',
        customerId: 'cus_stripe123',
        priceId: 'price_studio_year',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("n'est pas une mise a niveau");
    });
  });

  describe('changePlan', () => {
    it('should change plan in any direction', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ATELIER',
      }).value;

      const result = subscription.changePlan('STUDIO', {
        subscriptionId: 'sub_stripe123',
        customerId: 'cus_stripe123',
        priceId: 'price_studio_year',
      });

      expect(result.isSuccess).toBe(true);
      expect(subscription.plan.isStudio).toBe(true);
    });

    it('should fail if same plan', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'STUDIO',
      }).value;

      const result = subscription.changePlan('STUDIO');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Deja abonne au plan STUDIO');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'STUDIO',
        stripeSubscriptionId: 'sub_stripe123',
      }).value;

      const result = subscription.cancelSubscription();

      expect(result.isSuccess).toBe(true);
      expect(subscription.status).toBe('CANCELLED');
      expect(subscription.stripeSubscriptionId).toBeNull();
    });
  });

  describe('trial', () => {
    it('should start trial for ATELIER plan', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ATELIER',
      }).value;

      const result = subscription.startTrial();

      expect(result.isSuccess).toBe(true);
      expect(subscription.isTrialing).toBe(true);
      expect(subscription.trialStart).toEqual(baseDate);
      // Trial end should be 14 days later
      const expectedTrialEnd = new Date('2026-02-11T10:00:00Z');
      expect(subscription.trialEnd).toEqual(expectedTrialEnd);
    });

    it('should fail to start trial for ESSENTIEL plan', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ESSENTIEL',
      }).value;

      const result = subscription.startTrial();

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("ne propose pas de periode d'essai");
    });

    it('should end trial', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ATELIER',
        withTrial: true,
      }).value;

      subscription.endTrial();

      expect(subscription.isTrialing).toBe(false);
    });

    it('should check if in trial period', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ATELIER',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2027-01-28T10:00:00Z'),
        productsUsed: 0,
        pinnedProductsUsed: 0,
        commissionRate: 0.03,
        trialStart: new Date('2026-01-20T10:00:00Z'),
        trialEnd: new Date('2026-02-03T10:00:00Z'),
        isTrialing: true,
        stripeSubscriptionId: 'sub_stripe123',
        createdAt: baseDate,
        updatedAt: baseDate,
      }).value;

      // Current date is 2026-01-28, trial ends 2026-02-03
      expect(subscription.isInTrialPeriod).toBe(true);
    });
  });

  describe('markAsPastDue', () => {
    it('should mark subscription as past due', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'STUDIO',
      }).value;

      const gracePeriodStart = new Date();
      const result = subscription.markAsPastDue(gracePeriodStart);

      expect(result.isSuccess).toBe(true);
      expect(subscription.status).toBe('PAST_DUE');
      expect(subscription.gracePeriodStart).toEqual(gracePeriodStart);
    });

    it('should fail if subscription is cancelled', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'STUDIO',
      }).value;

      subscription.cancelSubscription();
      const result = subscription.markAsPastDue(new Date());

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('annule');
    });
  });

  describe('renewPeriod', () => {
    it('should renew subscription period', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'STUDIO',
      }).value;

      subscription.markAsPastDue(new Date());

      const newStart = new Date('2026-02-01T10:00:00Z');
      const newEnd = new Date('2027-02-01T10:00:00Z');
      subscription.renewPeriod(newStart, newEnd);

      expect(subscription.status).toBe('ACTIVE');
      expect(subscription.currentPeriodStart).toEqual(newStart);
      expect(subscription.currentPeriodEnd).toEqual(newEnd);
      expect(subscription.gracePeriodStart).toBeNull();
    });
  });

  describe('changeBillingInterval', () => {
    it('should change billing interval', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'STUDIO',
        billingInterval: 'year',
      }).value;

      subscription.changeBillingInterval('month', 'price_studio_month');

      expect(subscription.billingInterval).toBe('month');
      expect(subscription.stripePriceId).toBe('price_studio_month');
    });
  });

  describe('incrementProductsUsed', () => {
    it('should increment products used', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ESSENTIEL',
      }).value;

      const result = subscription.incrementProductsUsed();

      expect(result.isSuccess).toBe(true);
      expect(subscription.productsUsed).toBe(1);
    });

    it('should fail when at product limit', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2027-01-28T10:00:00Z'),
        productsUsed: 10,
        pinnedProductsUsed: 0,
        commissionRate: 0.05,
        stripeSubscriptionId: null,
        createdAt: baseDate,
        updatedAt: baseDate,
      }).value;

      const result = subscription.incrementProductsUsed();

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Limite de produits');
    });
  });

  describe('decrementProductsUsed', () => {
    it('should decrement products used', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2027-01-28T10:00:00Z'),
        productsUsed: 5,
        pinnedProductsUsed: 0,
        commissionRate: 0.05,
        stripeSubscriptionId: null,
        createdAt: baseDate,
        updatedAt: baseDate,
      }).value;

      subscription.decrementProductsUsed();

      expect(subscription.productsUsed).toBe(4);
    });

    it('should not decrement below zero', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
      }).value;

      subscription.decrementProductsUsed();

      expect(subscription.productsUsed).toBe(0);
    });
  });

  describe('incrementPinnedProductsUsed', () => {
    it('should increment pinned products used', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ESSENTIEL',
      }).value;

      const result = subscription.incrementPinnedProductsUsed();

      expect(result.isSuccess).toBe(true);
      expect(subscription.pinnedProductsUsed).toBe(1);
    });

    it('should fail when at pinned product limit', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2027-01-28T10:00:00Z'),
        productsUsed: 0,
        pinnedProductsUsed: 3,
        commissionRate: 0.05,
        stripeSubscriptionId: null,
        createdAt: baseDate,
        updatedAt: baseDate,
      }).value;

      const result = subscription.incrementPinnedProductsUsed();

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('produits mis en avant');
    });
  });

  describe('decrementPinnedProductsUsed', () => {
    it('should decrement pinned products used', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2027-01-28T10:00:00Z'),
        productsUsed: 0,
        pinnedProductsUsed: 2,
        commissionRate: 0.05,
        stripeSubscriptionId: null,
        createdAt: baseDate,
        updatedAt: baseDate,
      }).value;

      subscription.decrementPinnedProductsUsed();

      expect(subscription.pinnedProductsUsed).toBe(1);
    });

    it('should not decrement below zero', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
      }).value;

      subscription.decrementPinnedProductsUsed();

      expect(subscription.pinnedProductsUsed).toBe(0);
    });
  });

  describe('isInTrialPeriod - edge cases', () => {
    it('should return false when trial has expired', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ATELIER',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2027-01-28T10:00:00Z'),
        productsUsed: 0,
        pinnedProductsUsed: 0,
        commissionRate: 0.03,
        trialStart: new Date('2026-01-01T10:00:00Z'),
        trialEnd: new Date('2026-01-15T10:00:00Z'),
        isTrialing: true,
        stripeSubscriptionId: null,
        createdAt: baseDate,
        updatedAt: baseDate,
      }).value;

      expect(subscription.isInTrialPeriod).toBe(false);
    });

    it('should return false when not trialing', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ESSENTIEL',
      }).value;

      expect(subscription.isInTrialPeriod).toBe(false);
    });
  });

  describe('changePlan - without stripeData', () => {
    it('should change plan without stripe data', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ESSENTIEL',
      }).value;

      const result = subscription.changePlan('STUDIO');

      expect(result.isSuccess).toBe(true);
      expect(subscription.plan.isStudio).toBe(true);
      expect(subscription.stripeSubscriptionId).toBeNull();
    });
  });

  describe('create - invalid plan', () => {
    it('should fail with invalid plan type', () => {
      const result = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'INVALID' as any,
      });

      expect(result.isFailure).toBe(true);
    });
  });

  describe('reconstitute - invalid plan', () => {
    it('should fail with invalid plan type', () => {
      const result = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'INVALID' as any,
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2027-01-28T10:00:00Z'),
        productsUsed: 0,
        pinnedProductsUsed: 0,
        commissionRate: 0.05,
        stripeSubscriptionId: null,
        createdAt: baseDate,
        updatedAt: baseDate,
      });

      expect(result.isFailure).toBe(true);
    });
  });

  describe('isAtProductLimit', () => {
    it('should return true when at exact product limit', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2027-01-28T10:00:00Z'),
        productsUsed: 10,
        pinnedProductsUsed: 0,
        commissionRate: 0.05,
        stripeSubscriptionId: null,
        createdAt: baseDate,
        updatedAt: baseDate,
      }).value;

      expect(subscription.isAtProductLimit).toBe(true);
    });
  });

  describe('createdAt and updatedAt getters', () => {
    it('should return createdAt and updatedAt', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ESSENTIEL',
        status: 'ACTIVE',
        billingInterval: 'year',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2027-01-28T10:00:00Z'),
        productsUsed: 0,
        pinnedProductsUsed: 0,
        commissionRate: 0.05,
        stripeSubscriptionId: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-15T00:00:00Z'),
      }).value;

      expect(subscription.createdAt).toEqual(new Date('2026-01-01T00:00:00Z'));
      expect(subscription.updatedAt).toEqual(new Date('2026-01-15T00:00:00Z'));
    });
  });

  describe('changePlan - invalid plan', () => {
    it('should fail with invalid plan type', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'ESSENTIEL',
      }).value;

      const result = subscription.changePlan('INVALID' as any);

      expect(result.isFailure).toBe(true);
    });
  });

  describe('create - with stripeData', () => {
    it('should create with stripe customer and subscription ids', () => {
      const result = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'STUDIO',
        stripeSubscriptionId: 'sub_test',
        stripeCustomerId: 'cus_test',
        stripePriceId: 'price_test',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.stripeSubscriptionId).toBe('sub_test');
      expect(result.value.stripeCustomerId).toBe('cus_test');
      expect(result.value.stripePriceId).toBe('price_test');
    });
  });
});
