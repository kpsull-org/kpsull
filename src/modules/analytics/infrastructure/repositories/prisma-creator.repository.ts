import type { PrismaClient } from '@prisma/client';
import type {
  CreatorRepository,
  CreatorSummary,
  CreatorStatus,
  ListCreatorsParams,
  ListCreatorsResult,
} from '../../application/ports';

const REVENUE_ORDER_STATUSES = ['PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'] as const;

export class PrismaCreatorRepository implements CreatorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listCreators(params: ListCreatorsParams): Promise<ListCreatorsResult> {
    const { search, statusFilter, sortBy, sortDirection, page, pageSize } = params;

    // Build where clause for users with role CREATOR
    const whereClause: Record<string, unknown> = { role: 'CREATOR' as const };

    // Search filter (name or email)
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get all matching creators
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
        // Sort in DB for non-revenue fields
        ...(sortBy !== 'totalRevenue'
          ? {
              orderBy: {
                [sortBy === 'registeredAt' ? 'createdAt' : sortBy]:
                  sortDirection,
              },
            }
          : {}),
      }),
      this.prisma.user.count({ where: whereClause }),
    ]);

    // Get suspension status for all creators
    const creatorIds = users.map((u: { id: string; name: string | null; email: string; createdAt: Date }) => u.id);

    const [activeSuspensions, revenueAggregates] = await Promise.all([
      // Get active (non-reactivated) suspensions
      this.prisma.creatorSuspension.findMany({
        where: {
          creatorId: { in: creatorIds },
          reactivatedAt: null,
        },
        select: { creatorId: true },
      }),
      // Get revenue per creator
      this.prisma.order.groupBy({
        by: ['creatorId'],
        where: {
          creatorId: { in: creatorIds },
          status: { in: [...REVENUE_ORDER_STATUSES] },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const suspendedIds = new Set(activeSuspensions.map((s: { creatorId: string }) => s.creatorId));
    const revenueMap = new Map(
      revenueAggregates.map((r: { creatorId: string; _sum: { totalAmount: number | null } }) => [r.creatorId, r._sum.totalAmount ?? 0])
    );

    // Map to domain
    let creators: CreatorSummary[] = users.map((user: { id: string; name: string | null; email: string; createdAt: Date }) => ({
      id: user.id,
      name: user.name ?? 'Sans nom',
      email: user.email,
      registeredAt: user.createdAt,
      status: (suspendedIds.has(user.id) ? 'SUSPENDED' : 'ACTIVE') as CreatorStatus,
      totalRevenue: revenueMap.get(user.id) ?? 0,
    }));

    // Filter by status if needed
    if (statusFilter && statusFilter !== 'ALL') {
      creators = creators.filter((c) => c.status === statusFilter);
    }

    // Sort by totalRevenue in JS if needed
    if (sortBy === 'totalRevenue') {
      creators.sort((a, b) =>
        sortDirection === 'asc'
          ? a.totalRevenue - b.totalRevenue
          : b.totalRevenue - a.totalRevenue
      );
    }

    // Paginate
    const filteredTotal = statusFilter && statusFilter !== 'ALL' ? creators.length : total;
    const start = (page - 1) * pageSize;
    const paginated = creators.slice(start, start + pageSize);

    return { creators: paginated, total: filteredTotal };
  }

  async suspendCreator(creatorId: string): Promise<void> {
    await this.prisma.creatorSuspension.create({
      data: {
        creatorId,
        suspendedBy: 'system', // Will be overridden by use case caller
        reason: 'Suspended by admin',
      },
    });
  }

  async reactivateCreator(creatorId: string): Promise<void> {
    // Find the active suspension and mark it as reactivated
    const activeSuspension = await this.prisma.creatorSuspension.findFirst({
      where: { creatorId, reactivatedAt: null },
      orderBy: { suspendedAt: 'desc' },
    });

    if (activeSuspension) {
      await this.prisma.creatorSuspension.update({
        where: { id: activeSuspension.id },
        data: { reactivatedAt: new Date() },
      });
    }
  }
}
