import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import { GetClientOrderDetailUseCase } from '@/modules/orders/application/use-cases/client/get-client-order-detail.use-case';
import { PrismaOrderRepository } from '@/modules/orders/infrastructure/repositories/prisma-order.repository';
import { OrderTracking, type OrderTrackingData, type ShipmentTrackingData } from '@/components/client/order-tracking';
import { createDispute, requestReturn, cancelOrderAction } from './actions';
import type { DisputeTypeValue } from '@/modules/disputes/domain';
import type { ReturnReasonValue } from '@/modules/returns/domain';
import type { ReturnItem } from '@/modules/returns/application/ports/return.repository.interface';

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

  const order = result.value;

  const orderData: OrderTrackingData = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
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

  const trackingData: ShipmentTrackingData | null = null;

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
    returnItems: ReturnItem[],
    additionalNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    'use server';
    return requestReturn(orderId, reason, returnItems, additionalNotes);
  }

  async function handleCancelOrder(
    orderId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    'use server';
    return cancelOrderAction(orderId, reason);
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="space-y-6">
        <OrderTracking
          order={orderData}
          tracking={trackingData}
          onReportIssue={handleReportIssue}
          onRequestReturn={handleRequestReturn}
          onCancelOrder={handleCancelOrder}
        />
      </div>
    </div>
  );
}
