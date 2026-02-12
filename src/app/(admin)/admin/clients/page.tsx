import { Metadata } from 'next';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma/client';
import { ClientsPageClient } from './page-client';

export const metadata: Metadata = {
  title: 'Tous les clients | Admin Kpsull',
  description: 'Gerez tous les clients de la plateforme',
};

interface ClientsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

const PAGE_SIZE = 10;

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const search = params.search?.trim() ?? '';

  const where: Prisma.UserWhereInput = { role: 'CLIENT' };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [clients, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);

  // Count orders per client in a single query
  const clientIds = clients.map((c) => c.id);
  const orderCounts =
    clientIds.length > 0
      ? await prisma.order.groupBy({
          by: ['customerId'],
          where: { customerId: { in: clientIds } },
          _count: { id: true },
        })
      : [];

  const orderCountMap = new Map(
    orderCounts.map((oc) => [oc.customerId, oc._count.id]),
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const serializedClients = clients.map((client) => ({
    id: client.id,
    name: client.name,
    email: client.email,
    city: client.city,
    orderCount: orderCountMap.get(client.id) ?? 0,
    createdAt: client.createdAt.toISOString(),
  }));

  return (
    <div className="container max-w-7xl py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Gestion des clients
        </h1>
        <p className="text-muted-foreground">
          Tous les clients inscrits sur la plateforme
        </p>
      </div>

      <ClientsPageClient
        clients={serializedClients}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        totalPages={totalPages}
        searchQuery={search}
      />
    </div>
  );
}
