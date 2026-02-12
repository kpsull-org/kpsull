import { Metadata } from 'next';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma/client';
import { OrdersPageClient } from './page-client';

export const metadata: Metadata = {
  title: 'Toutes les commandes | Admin Kpsull',
  description: 'Gerez toutes les commandes de la plateforme',
};

interface OrdersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

const PAGE_SIZE = 20;

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page ?? '1', 10);
  const search = params.search ?? '';
  const statusFilter = params.status;

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

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ]);

  // Fetch creator info separately since Order has no User relation
  const creatorIds = [...new Set(orders.map((o) => o.creatorId))];
  const creators =
    creatorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: creatorIds } },
          select: { id: true, name: true, email: true },
        })
      : [];

  const creatorsMap = new Map(creators.map((c) => [c.id, c]));

  const serializedOrders = orders.map((o) => {
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
      createdAt: o.createdAt.toISOString(),
    };
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="container max-w-7xl py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Toutes les commandes
        </h1>
        <p className="text-muted-foreground">
          Gerez toutes les commandes de la plateforme
        </p>
      </div>

      <OrdersPageClient
        orders={serializedOrders}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        totalPages={totalPages}
        searchQuery={search}
        statusFilter={statusFilter}
      />
    </div>
  );
}
