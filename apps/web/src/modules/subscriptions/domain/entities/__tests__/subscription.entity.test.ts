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
    it('should create a subscription with FREE plan by default', () => {
      const result = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.plan.isFree).toBe(true);
      expect(result.value?.status).toBe('ACTIVE');
    });

    it('should create a subscription with PRO plan', () => {
      const result = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'PRO',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.plan.isPro).toBe(true);
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
  });

  describe('reconstitute', () => {
    it('should reconstitute a subscription from persistence', () => {
      const result = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'PRO',
        status: 'ACTIVE',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2026-02-28T10:00:00Z'),
        productsUsed: 3,
        salesUsed: 5,
        stripeSubscriptionId: 'sub_stripe123',
        createdAt: baseDate,
        updatedAt: baseDate,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.idString).toBe('sub-123');
      expect(result.value?.plan.isPro).toBe(true);
      expect(result.value?.productsUsed).toBe(3);
      expect(result.value?.salesUsed).toBe(5);
    });
  });

  describe('limits', () => {
    it('should return product limit for FREE plan', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'FREE',
      }).value!;

      expect(subscription.productLimit).toBe(5);
    });

    it('should return unlimited (-1) product limit for PRO plan', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'PRO',
      }).value!;

      expect(subscription.productLimit).toBe(-1);
    });

    it('should return sales limit for FREE plan', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'FREE',
      }).value!;

      expect(subscription.salesLimit).toBe(10);
    });
  });

  describe('canAddProduct', () => {
    it('should return true when under product limit', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2026-02-28T10:00:00Z'),
        productsUsed: 3,
        salesUsed: 0,
        stripeSubscriptionId: null,
        createdAt: baseDate,
        updatedAt: baseDate,
      }).value!;

      expect(subscription.canAddProduct).toBe(true);
    });

    it('should return false when at product limit', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2026-02-28T10:00:00Z'),
        productsUsed: 5,
        salesUsed: 0,
        stripeSubscriptionId: null,
        createdAt: baseDate,
        updatedAt: baseDate,
      }).value!;

      expect(subscription.canAddProduct).toBe(false);
    });

    it('should always return true for PRO plan', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'PRO',
        status: 'ACTIVE',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2026-02-28T10:00:00Z'),
        productsUsed: 100,
        salesUsed: 0,
        stripeSubscriptionId: 'sub_stripe123',
        createdAt: baseDate,
        updatedAt: baseDate,
      }).value!;

      expect(subscription.canAddProduct).toBe(true);
    });
  });

  describe('canMakeSale', () => {
    it('should return true when under sales limit', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2026-02-28T10:00:00Z'),
        productsUsed: 0,
        salesUsed: 5,
        stripeSubscriptionId: null,
        createdAt: baseDate,
        updatedAt: baseDate,
      }).value!;

      expect(subscription.canMakeSale).toBe(true);
    });

    it('should return false when at sales limit', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2026-02-28T10:00:00Z'),
        productsUsed: 0,
        salesUsed: 10,
        stripeSubscriptionId: null,
        createdAt: baseDate,
        updatedAt: baseDate,
      }).value!;

      expect(subscription.canMakeSale).toBe(false);
    });
  });

  describe('isNearProductLimit', () => {
    it('should return true when at 80% of product limit', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2026-02-28T10:00:00Z'),
        productsUsed: 4, // 80% of 5
        salesUsed: 0,
        stripeSubscriptionId: null,
        createdAt: baseDate,
        updatedAt: baseDate,
      }).value!;

      expect(subscription.isNearProductLimit).toBe(true);
    });

    it('should return false when under 80% of product limit', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: baseDate,
        currentPeriodEnd: new Date('2026-02-28T10:00:00Z'),
        productsUsed: 2,
        salesUsed: 0,
        stripeSubscriptionId: null,
        createdAt: baseDate,
        updatedAt: baseDate,
      }).value!;

      expect(subscription.isNearProductLimit).toBe(false);
    });
  });

  describe('upgrade', () => {
    it('should upgrade from FREE to PRO', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'FREE',
      }).value!;

      const result = subscription.upgrade('sub_stripe123');

      expect(result.isSuccess).toBe(true);
      expect(subscription.plan.isPro).toBe(true);
      expect(subscription.stripeSubscriptionId).toBe('sub_stripe123');
    });

    it('should fail if already PRO', () => {
      const subscription = Subscription.create({
        userId: 'user-123',
        creatorId: 'creator-123',
        plan: 'PRO',
      }).value!;

      const result = subscription.upgrade('sub_stripe123');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Déjà abonné au plan PRO');
    });
  });
});
