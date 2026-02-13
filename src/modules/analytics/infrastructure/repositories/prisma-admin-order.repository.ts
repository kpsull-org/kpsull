import type { PrismaClient, Prisma } from '@prisma/client';
import type {
  AdminOrderRepository,
  ListAdminOrdersParams,
  ListAdminOrdersResult,
} from '../../application/ports';

export class PrismaAdminOrderRepository implements AdminOrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listOrders(params: ListAdminOrdersParams): Promise<ListAdminOrdersResult> {
    const { search, statusFilter, page, pageSize } = params;
    const where: Prisma.OrderWhereInput = {};

    if (statusFilter) {
      where.status = statusFilter as Prisma.EnumOrderStatusFilter;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [dbOrders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);

    const creatorIds = [...new Set(dbOrders.map((o) => o.creatorId))];
    const creators =
      creatorIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: creatorIds } },
            select: { id: true, name: true, email: true },
          })
        : [];
    const creatorsMap = new Map(creators.map((c) => [c.id, c]));

    return {
      orders: dbOrders.map((o) => {
        const creator = creatorsMap.get(o.creatorId);
        return {
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          customerEmail: o.customerEmail,
          creatorName: creator?.name ?? 'Inconnu',
          creatorEmail: creator?.email ?? '',
          status: o.status,
          totalAmount: o.totalAmount,
          itemCount: o.items.length,
          createdAt: o.createdAt,
        };
      }),
      total,
    };
  }
}
