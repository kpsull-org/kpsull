import type { PrismaClient } from '@prisma/client';
import type { CreatorOverviewRepository, CreatorOverviewStats } from '../../application/ports';

export class PrismaCreatorOverviewRepository implements CreatorOverviewRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getOverview(creatorId: string, year: number): Promise<CreatorOverviewStats> {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);

    const [
      orderAgg,
      distinctCustomers,
      activeProductCount,
      pendingOrderCount,
      ordersForRevenue,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: { creatorId },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.findMany({
        where: { creatorId },
        select: { customerId: true },
        distinct: ['customerId'],
      }),
      this.prisma.product.count({
        where: { creatorId, status: 'PUBLISHED' },
      }),
      this.prisma.order.count({
        where: { creatorId, status: 'PENDING' },
      }),
      this.prisma.order.findMany({
        where: {
          creatorId,
          createdAt: { gte: yearStart, lt: yearEnd },
        },
        select: { totalAmount: true, createdAt: true },
      }),
    ]);

    const monthlyCents: Record<number, number> = {};
    for (let m = 0; m < 12; m++) monthlyCents[m] = 0;
    for (const order of ordersForRevenue) {
      const monthIndex = order.createdAt.getMonth();
      monthlyCents[monthIndex] = (monthlyCents[monthIndex] ?? 0) + order.totalAmount;
    }

    return {
      totalOrders: orderAgg._count.id,
      totalRevenueCents: orderAgg._sum.totalAmount ?? 0,
      totalCustomers: distinctCustomers.length,
      activeProducts: activeProductCount,
      pendingOrders: pendingOrderCount,
      monthlyRevenue: Array.from({ length: 12 }, (_, i) => ({
        month: i,
        revenueCents: monthlyCents[i] ?? 0,
      })),
    };
  }
}
