import type { PrismaClient } from '@prisma/client';
import type {
  AdminAnalyticsRepository,
  AdminPlatformStats,
  MonthlyRevenueDataPoint,
  CreatorRevenueBreakdown,
} from '../../application/ports';
import { TimePeriod } from '../../domain/value-objects';

const PAID_STATUSES = ['PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'] as const;

export class PrismaAdminAnalyticsRepository implements AdminAnalyticsRepository {
  constructor(private readonly prisma: PrismaClient) {}

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
      currentRevenue,
      previousRevenue,
      subscriptionRevenueAgg,
      commissionRevenueAgg,
      totalOrders,
      previousOrders,
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
      // Platform revenue in current period (PlatformTransaction CAPTURED)
      this.prisma.platformTransaction.aggregate({
        _sum: { amount: true },
        where: {
          status: 'CAPTURED',
          createdAt: { gte: start, lte: endOfDay },
        },
      }),
      // Platform revenue in previous period
      this.prisma.platformTransaction.aggregate({
        _sum: { amount: true },
        where: {
          status: 'CAPTURED',
          createdAt: { gte: prevStart, lte: prevEndOfDay },
        },
      }),
      // Subscription revenue all-time CAPTURED
      this.prisma.platformTransaction.aggregate({
        _sum: { amount: true },
        where: { status: 'CAPTURED', type: 'SUBSCRIPTION' },
      }),
      // Commission revenue all-time CAPTURED
      this.prisma.platformTransaction.aggregate({
        _sum: { amount: true },
        where: { status: 'CAPTURED', type: 'COMMISSION' },
      }),
      // Orders in current period
      this.prisma.order.count({
        where: { createdAt: { gte: start, lte: endOfDay } },
      }),
      // Orders in previous period
      this.prisma.order.count({
        where: { createdAt: { gte: prevStart, lte: prevEndOfDay } },
      }),
    ]);

    return {
      totalCreators,
      previousCreators,
      totalPlatformRevenue: currentRevenue._sum.amount ?? 0,
      previousPlatformRevenue: previousRevenue._sum.amount ?? 0,
      subscriptionRevenue: subscriptionRevenueAgg._sum.amount ?? 0,
      commissionRevenue: commissionRevenueAgg._sum.amount ?? 0,
      totalOrders,
      previousOrders,
      newCreators,
      previousNewCreators,
    };
  }

  async getMonthlyRevenue(year: number): Promise<MonthlyRevenueDataPoint[]> {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);

    const transactions = await this.prisma.platformTransaction.findMany({
      where: {
        status: 'CAPTURED',
        period: { gte: yearStart, lt: yearEnd },
      },
      select: { period: true, amount: true },
    });

    const monthlyRevenueCents: Record<number, number> = {};
    for (let m = 0; m < 12; m++) monthlyRevenueCents[m] = 0;
    for (const tx of transactions) {
      const monthIndex = tx.period.getMonth();
      monthlyRevenueCents[monthIndex] =
        (monthlyRevenueCents[monthIndex] ?? 0) + tx.amount;
    }

    return Array.from({ length: 12 }, (_, i) => ({
      month: i,
      revenue: monthlyRevenueCents[i] ?? 0,
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
