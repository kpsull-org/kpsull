import type { PrismaClient } from '@prisma/client';
import type Stripe from 'stripe';
import type {
  AdminAnalyticsRepository,
  AdminPlatformStats,
  MonthlyRevenueDataPoint,
  CreatorRevenueBreakdown,
} from '../../application/ports';
import { TimePeriod } from '../../domain/value-objects';

const PAID_STATUSES = ['PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'] as const;

/** Commission rates by subscription plan */
const COMMISSION_RATES: Record<string, number> = {
  ESSENTIEL: 0.05,
  STUDIO: 0.04,
  ATELIER: 0.03,
};

/** Plan pricing in cents — mirrors src/modules/subscriptions/domain/plan-features.ts */
const PLAN_MONTHLY_CENTS: Record<string, number> = {
  ESSENTIEL: 2900,
  STUDIO: 7900,
  ATELIER: 9500,
};
const PLAN_YEARLY_CENTS: Record<string, number> = {
  ESSENTIEL: 29000,
  STUDIO: 79000,
  ATELIER: 95000,
};

export class PrismaAdminAnalyticsRepository implements AdminAnalyticsRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly stripe?: Stripe
  ) {}

  // ---------------------------------------------------------------------------
  // Internal helpers — Stripe
  // ---------------------------------------------------------------------------

  private calcItemMRR(item: Stripe.SubscriptionItem): number {
    const amount = item.price.unit_amount ?? 0;
    const quantity = item.quantity ?? 1;
    const interval = item.price.recurring?.interval;
    if (interval === 'month') return amount * quantity;
    if (interval === 'year') return Math.round((amount * quantity) / 12);
    return 0;
  }

  /**
   * Fetch MRR from active Stripe subscriptions.
   * Returns 0 if Stripe is not configured or has no active subscriptions.
   */
  private async fetchStripeMRR(): Promise<number> {
    if (!this.stripe) return 0;

    let mrr = 0;
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const params: Stripe.SubscriptionListParams = { status: 'active', limit: 100 };
      if (startingAfter) params.starting_after = startingAfter;

      const response = await this.stripe.subscriptions.list(params);

      for (const sub of response.data) {
        for (const item of sub.items.data) {
          mrr += this.calcItemMRR(item);
        }
      }

      hasMore = response.has_more;
      startingAfter = hasMore ? response.data.at(-1)?.id : undefined;
    }

    return mrr;
  }

  /**
   * Fetch paid subscription invoice amounts from Stripe for a given period.
   * Returns 0 if Stripe is not configured or has no matching invoices.
   */
  private async fetchStripeInvoiceRevenue(since: Date, until: Date): Promise<number> {
    if (!this.stripe) return 0;

    let total = 0;
    const params: Stripe.InvoiceListParams = {
      status: 'paid',
      limit: 100,
      created: {
        gte: Math.floor(since.getTime() / 1000),
        lte: Math.floor(until.getTime() / 1000),
      },
    };

    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      if (startingAfter) params.starting_after = startingAfter;
      const response: Stripe.ApiList<Stripe.Invoice> = await this.stripe.invoices.list(params);

      for (const invoice of response.data) {
        // Stripe API 2026+: subscription info lives under parent.subscription_details
        const subscriptionRef = invoice.parent?.subscription_details?.subscription;
        if (subscriptionRef) {
          total += invoice.amount_paid;
        }
      }

      hasMore = response.has_more;
      startingAfter = hasMore ? response.data[response.data.length - 1]?.id : undefined;
    }

    return total;
  }

  /**
   * Fetch Stripe subscription invoice amounts grouped by month index (0–11).
   * Returns empty map if Stripe is not configured or has no matching invoices.
   */
  private async fetchStripeInvoiceByMonth(
    yearStart: Date,
    yearEnd: Date
  ): Promise<Record<number, number>> {
    if (!this.stripe) return {};

    const byMonth: Record<number, number> = {};
    const params: Stripe.InvoiceListParams = {
      status: 'paid',
      limit: 100,
      created: {
        gte: Math.floor(yearStart.getTime() / 1000),
        lte: Math.floor(yearEnd.getTime() / 1000),
      },
    };

    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      if (startingAfter) params.starting_after = startingAfter;
      const response: Stripe.ApiList<Stripe.Invoice> = await this.stripe.invoices.list(params);

      for (const invoice of response.data) {
        // Stripe API 2026+: subscription info lives under parent.subscription_details
        const subscriptionRef = invoice.parent?.subscription_details?.subscription;
        if (subscriptionRef && invoice.created) {
          const month = new Date(invoice.created * 1000).getMonth();
          byMonth[month] = (byMonth[month] ?? 0) + invoice.amount_paid;
        }
      }

      hasMore = response.has_more;
      startingAfter = hasMore ? response.data[response.data.length - 1]?.id : undefined;
    }

    return byMonth;
  }

  // ---------------------------------------------------------------------------
  // Internal helpers — DB fallbacks
  // ---------------------------------------------------------------------------

  /**
   * Calculate MRR from active subscriptions stored in the local DB.
   * Used when Stripe has no active subscriptions configured (dev / test mode).
   */
  private async fetchLocalSubscriptionMRR(): Promise<number> {
    const subs = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: { plan: true, billingInterval: true },
    });

    let mrr = 0;
    for (const sub of subs) {
      if (sub.billingInterval === 'year') {
        const yearly = PLAN_YEARLY_CENTS[sub.plan] ?? 0;
        mrr += Math.round(yearly / 12);
      } else {
        mrr += PLAN_MONTHLY_CENTS[sub.plan] ?? 0;
      }
    }
    return mrr;
  }

  /**
   * Fetch subscription revenue recorded as PlatformTransactions in a given period.
   * Used as fallback when Stripe invoices are not available.
   */
  private async fetchLocalSubscriptionRevenueForPeriod(
    since: Date,
    until: Date
  ): Promise<number> {
    const result = await this.prisma.platformTransaction.aggregate({
      _sum: { amount: true },
      where: {
        type: 'SUBSCRIPTION',
        status: 'CAPTURED',
        createdAt: { gte: since, lte: until },
      },
    });
    return result._sum.amount ?? 0;
  }

  /**
   * Generic helper: fetch PlatformTransaction amounts of a given type grouped by month.
   * Only CAPTURED transactions within [yearStart, yearEnd[ are considered.
   */
  private async fetchTransactionsByMonth(
    type: 'COMMISSION' | 'SUBSCRIPTION',
    yearStart: Date,
    yearEnd: Date
  ): Promise<Record<number, number>> {
    const txs = await this.prisma.platformTransaction.findMany({
      where: {
        type,
        status: 'CAPTURED',
        createdAt: { gte: yearStart, lt: yearEnd },
      },
      select: { createdAt: true, amount: true },
    });

    const byMonth: Record<number, number> = {};
    for (const tx of txs) {
      const month = tx.createdAt.getMonth();
      byMonth[month] = (byMonth[month] ?? 0) + tx.amount;
    }
    return byMonth;
  }

  /**
   * Fetch DB PlatformTransaction SUBSCRIPTION amounts grouped by month.
   * Used as fallback when Stripe invoices are not available.
   */
  private async fetchLocalSubscriptionByMonth(
    yearStart: Date,
    yearEnd: Date
  ): Promise<Record<number, number>> {
    return this.fetchTransactionsByMonth('SUBSCRIPTION', yearStart, yearEnd);
  }

  // ---------------------------------------------------------------------------
  // Internal helpers — Commission fallbacks from Orders
  // ---------------------------------------------------------------------------

  /**
   * Calculate commission revenue directly from paid orders for a given period.
   * Used as fallback when PlatformTransaction records are absent or insufficient.
   */
  private async fetchCommissionFromOrders(since: Date, until: Date): Promise<number> {
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: [...PAID_STATUSES] },
        createdAt: { gte: since, lte: until },
      },
      select: { creatorId: true, totalAmount: true },
    });

    if (orders.length === 0) return 0;

    const creatorIds = [...new Set(orders.map((o) => o.creatorId))];
    const subscriptions = await this.prisma.subscription.findMany({
      where: { creatorId: { in: creatorIds } },
      select: { creatorId: true, plan: true },
    });
    const planByCreator = new Map(subscriptions.map((s) => [s.creatorId, s.plan]));

    let total = 0;
    for (const order of orders) {
      const plan = planByCreator.get(order.creatorId) ?? 'ESSENTIEL';
      const rate = COMMISSION_RATES[plan] ?? COMMISSION_RATES['ESSENTIEL']!;
      total += Math.round(order.totalAmount * rate);
    }
    return total;
  }

  /**
   * Commission revenue in a given period.
   * Primary: aggregate PlatformTransaction COMMISSION CAPTURED.
   * Fallback: compute from orders if no transaction records exist.
   */
  private async fetchCommissionRevenueForPeriod(since: Date, until: Date): Promise<number> {
    const result = await this.prisma.platformTransaction.aggregate({
      _sum: { amount: true },
      where: {
        type: 'COMMISSION',
        status: 'CAPTURED',
        createdAt: { gte: since, lte: until },
      },
    });
    const txTotal = result._sum.amount ?? 0;
    if (txTotal > 0) return txTotal;
    return this.fetchCommissionFromOrders(since, until);
  }

  /**
   * Calculate commission revenue from paid orders grouped by month (0–11).
   * Used as fallback when PlatformTransaction records are absent.
   */
  private async fetchCommissionByMonthFromOrders(
    yearStart: Date,
    yearEnd: Date
  ): Promise<Record<number, number>> {
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: [...PAID_STATUSES] },
        createdAt: { gte: yearStart, lt: yearEnd },
      },
      select: { creatorId: true, totalAmount: true, createdAt: true },
    });

    if (orders.length === 0) return {};

    const creatorIds = [...new Set(orders.map((o) => o.creatorId))];
    const subscriptions = await this.prisma.subscription.findMany({
      where: { creatorId: { in: creatorIds } },
      select: { creatorId: true, plan: true },
    });
    const planByCreator = new Map(subscriptions.map((s) => [s.creatorId, s.plan]));

    const byMonth: Record<number, number> = {};
    for (const order of orders) {
      const plan = planByCreator.get(order.creatorId) ?? 'ESSENTIEL';
      const rate = COMMISSION_RATES[plan] ?? COMMISSION_RATES['ESSENTIEL']!;
      const month = order.createdAt.getMonth();
      byMonth[month] = (byMonth[month] ?? 0) + Math.round(order.totalAmount * rate);
    }
    return byMonth;
  }

  /**
   * Commission revenue grouped by month for a given year.
   * Primary: aggregate PlatformTransaction COMMISSION CAPTURED grouped by month.
   * Fallback: compute from orders if no transaction records exist.
   */
  private async fetchCommissionByMonth(
    yearStart: Date,
    yearEnd: Date
  ): Promise<Record<number, number>> {
    const byMonth = await this.fetchTransactionsByMonth('COMMISSION', yearStart, yearEnd);

    const hasData = Object.values(byMonth).some((v) => v > 0);
    if (hasData) return byMonth;
    return this.fetchCommissionByMonthFromOrders(yearStart, yearEnd);
  }

  // ---------------------------------------------------------------------------
  // Public interface — with automatic Stripe → DB fallbacks
  // ---------------------------------------------------------------------------

  /**
   * MRR from active subscriptions.
   * Priority: Stripe active subscriptions → local DB subscriptions.
   */
  private async fetchActiveMRR(): Promise<number> {
    const stripeMRR = await this.fetchStripeMRR();
    if (stripeMRR > 0) return stripeMRR;
    // Fallback: compute from DB subscriptions + plan pricing
    return this.fetchLocalSubscriptionMRR();
  }

  /**
   * Subscription revenue in a given period.
   * Priority: DB PlatformTransaction SUBSCRIPTION records (webhooks) → Stripe invoices if DB empty.
   *
   * DB is the primary source because PlatformTransaction records are created by
   * webhooks on each payment and by the seed. Stripe is used as a fallback only
   * when no DB records exist for the period (e.g. webhook missed or first setup).
   */
  private async fetchSubscriptionRevenueForPeriod(since: Date, until: Date): Promise<number> {
    const dbRevenue = await this.fetchLocalSubscriptionRevenueForPeriod(since, until);
    if (dbRevenue > 0) return dbRevenue;
    // Fallback: Stripe paid invoices if DB has no records for this period
    return this.fetchStripeInvoiceRevenue(since, until);
  }

  /**
   * Subscription revenue grouped by month for a given year.
   * Priority: DB PlatformTransaction SUBSCRIPTION records → Stripe invoices if DB empty.
   *
   * DB is the primary source because it is set by webhooks and seed data.
   * Stripe is unreliable in dev/test mode (may contain unrelated test invoices).
   */
  private async fetchSubscriptionByMonth(
    yearStart: Date,
    yearEnd: Date
  ): Promise<Record<number, number>> {
    const dbByMonth = await this.fetchLocalSubscriptionByMonth(yearStart, yearEnd);
    const hasDbData = Object.values(dbByMonth).some((v) => v > 0);
    if (hasDbData) return dbByMonth;
    // Fallback: Stripe invoices if DB has no records for this year
    return this.fetchStripeInvoiceByMonth(yearStart, yearEnd);
  }

  // ---------------------------------------------------------------------------
  // Repository methods
  // ---------------------------------------------------------------------------

  async getPlatformStats(period: TimePeriod): Promise<AdminPlatformStats> {
    const { start, end } = period.getDateRange();
    const previousPeriod = period.getPreviousPeriod();
    const { start: prevStart, end: prevEnd } = previousPeriod.getDateRange();

    // Use end of day for end dates
    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59, 999);
    const prevEndOfDay = new Date(prevEnd);
    prevEndOfDay.setHours(23, 59, 59, 999);

    const [
      totalCreators,
      previousCreators,
      newCreators,
      previousNewCreators,
      currentCommissionRevenue,
      previousCommissionRevenue,
      totalOrders,
      previousOrders,
      subscriptionMRR,
      currentSubscriptionRevenue,
      previousSubscriptionRevenue,
    ] = await Promise.all([
      // Total active creators (role=CREATOR, created before end of current period)
      this.prisma.user.count({
        where: { role: 'CREATOR', createdAt: { lte: endOfDay } },
      }),
      // Total creators at end of previous period
      this.prisma.user.count({
        where: { role: 'CREATOR', createdAt: { lte: prevEndOfDay } },
      }),
      // New creators in current period
      this.prisma.user.count({
        where: { role: 'CREATOR', createdAt: { gte: start, lte: endOfDay } },
      }),
      // New creators in previous period
      this.prisma.user.count({
        where: { role: 'CREATOR', createdAt: { gte: prevStart, lte: prevEndOfDay } },
      }),
      // Commission revenue in current period (PlatformTransaction → Order fallback)
      this.fetchCommissionRevenueForPeriod(start, endOfDay),
      // Commission revenue in previous period (PlatformTransaction → Order fallback)
      this.fetchCommissionRevenueForPeriod(prevStart, prevEndOfDay),
      // Orders in current period
      this.prisma.order.count({
        where: { createdAt: { gte: start, lte: endOfDay } },
      }),
      // Orders in previous period
      this.prisma.order.count({
        where: { createdAt: { gte: prevStart, lte: prevEndOfDay } },
      }),
      // MRR (Stripe → DB fallback)
      this.fetchActiveMRR(),
      // Subscription revenue current period (Stripe invoices → DB fallback)
      this.fetchSubscriptionRevenueForPeriod(start, endOfDay),
      // Subscription revenue previous period (Stripe invoices → DB fallback)
      this.fetchSubscriptionRevenueForPeriod(prevStart, prevEndOfDay),
    ]);

    const currentCommission = currentCommissionRevenue;
    const previousCommission = previousCommissionRevenue;

    return {
      totalCreators,
      previousCreators,
      // Total platform revenue = commissions (DB) + subscriptions (Stripe or DB)
      totalPlatformRevenue: currentCommission + currentSubscriptionRevenue,
      previousPlatformRevenue: previousCommission + previousSubscriptionRevenue,
      // Subscription revenue for the current period (NOT MRR)
      subscriptionRevenue: currentSubscriptionRevenue,
      // Monthly Recurring Revenue from active subscriptions (Stripe or DB fallback)
      subscriptionMRR,
      // Commission revenue from DB (current period only)
      commissionRevenue: currentCommission,
      totalOrders,
      previousOrders,
      newCreators,
      previousNewCreators,
    };
  }

  async getMonthlyRevenue(year: number): Promise<MonthlyRevenueDataPoint[]> {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);

    // Commission revenue per month (PlatformTransaction → Order fallback)
    const commissionByMonth = await this.fetchCommissionByMonth(yearStart, yearEnd);

    // Subscription revenue per month (Stripe invoices → DB fallback)
    const subscriptionByMonth = await this.fetchSubscriptionByMonth(yearStart, yearEnd);

    return Array.from({ length: 12 }, (_, i) => ({
      month: i,
      commissions: commissionByMonth[i] ?? 0,
      subscriptions: subscriptionByMonth[i] ?? 0,
      revenue: (commissionByMonth[i] ?? 0) + (subscriptionByMonth[i] ?? 0),
    }));
  }

  async getRevenueByCreator(limit: number): Promise<CreatorRevenueBreakdown[]> {
    const revenueByCreator = await this.prisma.order.groupBy({
      by: ['creatorId'],
      where: { status: { in: [...PAID_STATUSES] } },
      _sum: { totalAmount: true },
      _count: true,
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: limit,
    });

    const creatorIds = revenueByCreator.map((r) => r.creatorId);
    const creators = await this.prisma.user.findMany({
      where: { id: { in: creatorIds } },
      select: { id: true, name: true, email: true },
    });
    const creatorsById = new Map(creators.map((c) => [c.id, c]));

    return revenueByCreator.map((row) => {
      const creator = creatorsById.get(row.creatorId);
      return {
        creatorId: row.creatorId,
        creatorName: creator?.name ?? 'Inconnu',
        creatorEmail: creator?.email ?? '',
        orderCount: row._count,
        totalRevenue: row._sum.totalAmount ?? 0,
      };
    });
  }
}
