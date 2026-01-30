import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import { ListCustomerOrdersUseCase } from '@/modules/orders/application/use-cases/list-customer-orders.use-case';
import { PrismaOrderRepository } from '@/modules/orders/infrastructure/repositories/prisma-order.repository';
import { OrdersHistory } from '@/components/client/orders-history';

export const metadata: Metadata = {
  title: 'Mes commandes | Kpsull',
  description: 'Historique de vos commandes',
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

const ORDERS_PER_PAGE = 10;

/**
 * My Orders Page
 *
 * Story 12-1: Historique commandes client
 *
 * Acceptance Criteria:
 * - AC1: Page "Mes commandes" pour les clients
 * - AC2: Liste des commandes avec statut, date, montant
 * - AC3: Lien vers details de chaque commande
 */
export default async function MyOrdersPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));

  const orderRepository = new PrismaOrderRepository(prisma);
  const listCustomerOrdersUseCase = new ListCustomerOrdersUseCase(orderRepository);

  const result = await listCustomerOrdersUseCase.execute({
    customerId: session.user.id,
    page,
    limit: ORDERS_PER_PAGE,
  });

  if (result.isFailure) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Mes commandes</h1>
        <p className="text-destructive">
          Une erreur est survenue lors du chargement de vos commandes.
        </p>
      </div>
    );
  }

  const { orders, total, pages } = result.value!;

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Mes commandes</h1>
      <OrdersHistory
        orders={orders}
        total={total}
        currentPage={page}
        totalPages={pages}
      />
    </div>
  );
}
