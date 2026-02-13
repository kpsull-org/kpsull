import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { Button } from '@/components/ui/button';
import { ShippingForm, ShippingFormData } from '@/components/orders/shipping-form';
import { ShipOrderUseCase } from '@/modules/orders/application/use-cases/ship-order.use-case';
import { PrismaOrderRepository } from '@/modules/orders/infrastructure/repositories/prisma-order.repository';
import { GetOrderDetailUseCase } from '@/modules/orders/application/use-cases/get-order-detail.use-case';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Expedier commande ${id} | Kpsull`,
    description: "Ajouter les informations d'expedition a la commande",
  };
}

/**
 * Ship Order Page
 *
 * Story 8-3: Expedition tracking
 *
 * Acceptance Criteria:
 * - AC1: Formulaire pour saisir numero de suivi et transporteur
 * - AC2: Mise a jour du statut de commande a SHIPPED
 * - AC3: Affichage du tracking dans les details commande
 */
export default async function ShipOrderPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Only creators can access this page
  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    redirect('/profile');
  }

  const { id } = await params;
  const orderRepository = new PrismaOrderRepository(prisma);
  const getOrderDetailUseCase = new GetOrderDetailUseCase(orderRepository);

  const result = await getOrderDetailUseCase.execute({
    orderId: id,
    creatorId: session.user.id,
  });

  if (result.isFailure) {
    notFound();
  }

  const order = result.value!;

  // Only PAID orders can be shipped
  if (order.status !== 'PAID') {
    redirect(`/dashboard/orders/${id}`);
  }

  /**
   * Server action to ship the order
   *
   * AC2: Mise a jour du statut de commande a SHIPPED
   */
  async function shipOrder(data: ShippingFormData): Promise<void> {
    'use server';

    const currentSession = await auth();
    if (!currentSession?.user) {
      throw new Error('Non authentifie');
    }

    const repository = new PrismaOrderRepository(prisma);
    const shipOrderUseCase = new ShipOrderUseCase(repository);

    const shipResult = await shipOrderUseCase.execute({
      orderId: id,
      creatorId: currentSession.user.id,
      trackingNumber: data.trackingNumber,
      carrier: data.carrier,
    });

    if (shipResult.isFailure) {
      throw new Error(shipResult.error!);
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Back link */}
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/dashboard/orders/${id}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux details
        </Link>
      </Button>

      <ShippingForm
        orderId={id}
        orderNumber={order.orderNumber}
        onSubmit={shipOrder}
      />
    </div>
  );
}
