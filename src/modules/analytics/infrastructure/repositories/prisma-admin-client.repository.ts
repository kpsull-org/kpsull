import type { PrismaClient, Prisma } from '@prisma/client';
import type {
  AdminClientRepository,
  ListAdminClientsParams,
  ListAdminClientsResult,
} from '../../application/ports';

export class PrismaAdminClientRepository implements AdminClientRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listClients(params: ListAdminClientsParams): Promise<ListAdminClientsResult> {
    const { search, page, pageSize } = params;
    const where: Prisma.UserWhereInput = { role: 'CLIENT' };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, city: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    const clientIds = users.map((c) => c.id);
    const orderCounts =
      clientIds.length > 0
        ? await this.prisma.order.groupBy({
            by: ['customerId'],
            where: { customerId: { in: clientIds } },
            _count: { id: true },
          })
        : [];

    const orderCountMap = new Map(
      orderCounts.map((oc) => [oc.customerId, oc._count.id]),
    );

    return {
      clients: users.map((user) => ({
        id: user.id,
        name: user.name ?? 'Sans nom',
        email: user.email,
        city: user.city,
        orderCount: orderCountMap.get(user.id) ?? 0,
        createdAt: user.createdAt,
      })),
      total,
    };
  }
}
