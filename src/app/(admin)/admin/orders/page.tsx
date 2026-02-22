export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { prisma } from '@/lib/prisma/client';
import { ListAdminOrdersUseCase } from '@/modules/analytics/application/use-cases';
import { PrismaAdminOrderRepository } from '@/modules/analytics/infrastructure/repositories';
import { OrdersPageClient } from './page-client';

export const metadata: Metadata = {
  title: 'Toutes les commandes | Admin Kpsull',
  description: 'Gerez toutes les commandes de la plateforme',
};

interface OrdersPageProps {
  readonly searchParams: Promise<{
    readonly page?: string;
    readonly search?: string;
    readonly status?: string;
  }>;
}

const PAGE_SIZE = 20;

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const page = Number.parseInt(params.page ?? '1', 10);
  const search = params.search ?? '';
  const statusFilter = params.status;

  const orderRepository = new PrismaAdminOrderRepository(prisma);
  const listOrdersUseCase = new ListAdminOrdersUseCase(orderRepository);

  const result = await listOrdersUseCase.execute({
    search: search || undefined,
    statusFilter,
    page,
    pageSize: PAGE_SIZE,
  });

  if (result.isFailure) {
    return (
      <div className="container max-w-7xl py-6">
        <p className="text-destructive">Erreur: {result.error}</p>
      </div>
    );
  }

  const { orders, total, totalPages } = result.value;

  const serializedOrders = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    creatorName: o.creatorName,
    creatorEmail: o.creatorEmail,
    status: o.status,
    totalAmount: o.totalAmount,
    itemCount: o.itemCount,
    createdAt: o.createdAt.toISOString(),
  }));

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
