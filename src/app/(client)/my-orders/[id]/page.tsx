import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import { GetClientOrderDetailUseCase } from '@/modules/orders/application/use-cases/client/get-client-order-detail.use-case';
import { PrismaOrderRepository } from '@/modules/orders/infrastructure/repositories/prisma-order.repository';
import { OrderTracking, type OrderTrackingData, type ShipmentTrackingData } from '@/components/client/order-tracking';
import { createDispute } from './actions';
import { requestReturn } from './actions';
import type { DisputeTypeValue } from '@/modules/disputes/domain';
import type { ReturnReasonValue } from '@/modules/returns/domain';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Commande ${id} | Kpsull`,
    description: 'Suivi de votre commande',
  };
}

/**
 * Client Order Detail Page
 *
 * Story 12-2: Suivi commande en cours
 *
 * Client-facing order detail page with tracking and action capabilities.
 *
 * Acceptance Criteria:
 * - AC1: Page detail commande client avec timeline
 * - AC2: Statut de livraison avec tracking
 * - AC3: Boutons actions: Signaler probleme, Demander retour (si livre)
 */
export default async function ClientOrderDetailPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { id } = await params;
  const orderRepository = new PrismaOrderRepository(prisma);
  const getOrderDetailUseCase = new GetClientOrderDetailUseCase(orderRepository);

  const result = await getOrderDetailUseCase.execute({
    orderId: id,
    customerId: session.user.id,
  });

  if (result.isFailure) {
    notFound();
  }

  const order = result.value!;

  // Build order data for the component
  const orderData: OrderTrackingData = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      image: item.image,
      variantInfo: item.variantInfo,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    })),
    shippingAddress: order.shippingAddress,
    totalAmount: order.totalAmount,
    trackingNumber: order.trackingNumber,
    carrier: order.carrier,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    createdAt: order.createdAt,
  };

  // TODO: Fetch tracking data from AfterShip when available
  // For now, we pass null and use the basic tracking info from the order
  const trackingData: ShipmentTrackingData | null = null;

  // Server actions for disputes and returns
  async function handleReportIssue(
    orderId: string,
    type: DisputeTypeValue,
    description: string
  ): Promise<{ success: boolean; error?: string }> {
    'use server';
    return createDispute(orderId, type, description);
  }

  async function handleRequestReturn(
    orderId: string,
    reason: ReturnReasonValue,
    additionalNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    'use server';
    return requestReturn(orderId, reason, additionalNotes);
  }

  return (
    <div className="container py-8">
      <OrderTracking
        order={orderData}
        tracking={trackingData}
        onReportIssue={handleReportIssue}
        onRequestReturn={handleRequestReturn}
      />
    </div>
  );
}
