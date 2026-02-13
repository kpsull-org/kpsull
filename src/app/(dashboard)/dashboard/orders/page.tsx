import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ListOrdersUseCase } from '@/modules/orders/application/use-cases/list-orders.use-case';
import { PrismaOrderRepository } from '@/modules/orders/infrastructure/repositories/prisma-order.repository';
import { OrdersPageClient } from './page-client';
import type { OrderStatusValue } from '@/modules/orders/domain/value-objects/order-status.vo';

export const metadata: Metadata = {
  title: 'Commandes | Kpsull',
  description: 'Gerez vos commandes',
};

const PAGE_SIZE = 20;

const VALID_STATUSES: OrderStatusValue[] = [
  'PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'VALIDATION_PENDING',
  'COMPLETED', 'DISPUTE_OPENED', 'RETURN_SHIPPED', 'RETURN_RECEIVED',
  'REFUNDED', 'CANCELED',
];

interface OrdersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (dbUser?.role !== 'CREATOR' && dbUser?.role !== 'ADMIN') {
      redirect('/mon-compte');
    }
  }

  const params = await searchParams;
  const page = parseInt(params.page ?? '1', 10);
  const search = params.search ?? '';
  const statusFilter = params.status;
  const statusValue = VALID_STATUSES.includes(statusFilter as OrderStatusValue)
    ? (statusFilter as OrderStatusValue)
    : undefined;

  const hasFilters = search !== '' || statusFilter !== undefined;

  const orderRepository = new PrismaOrderRepository(prisma);
  const listOrdersUseCase = new ListOrdersUseCase(orderRepository);

  const result = await listOrdersUseCase.execute({
    creatorId: session.user.id,
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    status: statusValue,
  });

  if (result.isFailure) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Commandes</h1>
          <p className="text-muted-foreground">
            Suivez et gerez vos commandes en cours.
          </p>
        </div>
        <div className="text-center text-muted-foreground py-12">
          Une erreur est survenue lors du chargement des commandes.
        </div>
      </div>
    );
  }

  const { orders, total, pages: totalPages } = result.value;

  // Show empty state only when there are no orders AND no filters applied
  if (orders.length === 0 && !hasFilters) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Commandes</h1>
          <p className="text-muted-foreground">
            Suivez et gerez vos commandes en cours.
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Aucune commande</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Vos commandes apparaitront ici des que vos premiers clients
              passeront commande sur votre boutique.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const serializedOrders = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    status: order.status,
    totalAmount: order.totalAmount,
    itemCount: order.itemCount,
    createdAt: order.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Commandes</h1>
        <p className="text-muted-foreground">
          Suivez et gerez vos commandes en cours.
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
