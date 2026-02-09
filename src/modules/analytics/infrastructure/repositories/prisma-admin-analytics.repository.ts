import type { PrismaClient } from '@prisma/client';
import type { AdminAnalyticsRepository, AdminPlatformStats } from '../../application/ports';
import { TimePeriod } from '../../domain/value-objects';

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
      // Revenue in current period (sum of totalAmount for paid orders)
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: start, lte: endOfDay },
          status: { in: ['PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'] },
        },
      }),
      // Revenue in previous period
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: prevStart, lte: prevEndOfDay },
          status: { in: ['PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'] },
        },
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
      totalPlatformRevenue: currentRevenue._sum.totalAmount ?? 0,
      previousPlatformRevenue: previousRevenue._sum.totalAmount ?? 0,
      totalOrders,
      previousOrders,
      newCreators,
      previousNewCreators,
    };
  }
}
