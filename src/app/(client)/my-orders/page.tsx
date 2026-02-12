import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import { ListCustomerOrdersUseCase } from '@/modules/orders/application/use-cases/list-customer-orders.use-case';
import { PrismaOrderRepository } from '@/modules/orders/infrastructure/repositories/prisma-order.repository';
import { Button } from '@/components/ui/button';
import { OrdersHistory } from '@/components/client/orders-history';

export const metadata: Metadata = {
  title: 'Mes commandes | Kpsull',
  description: 'Historique de vos commandes',
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

const ORDERS_PER_PAGE = 10;

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
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold">Mes commandes</h1>
        <p className="mt-4 text-destructive">
          Une erreur est survenue lors du chargement de vos commandes.
        </p>
      </div>
    );
  }

  const { orders, total, pages } = result.value!;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/mon-compte">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mes commandes</h1>
            <p className="text-muted-foreground">
              Retrouvez l&apos;historique et le suivi de vos achats
            </p>
          </div>
        </div>

        <OrdersHistory
          orders={orders}
          total={total}
          currentPage={page}
          totalPages={pages}
        />
      </div>
    </div>
  );
}
