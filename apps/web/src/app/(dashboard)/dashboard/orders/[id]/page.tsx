import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { GetOrderDetailUseCase } from '@/modules/orders/application/use-cases/get-order-detail.use-case';
import { PrismaOrderRepository } from '@/modules/orders/infrastructure/repositories/prisma-order.repository';
import { OrderHeaderWithActions } from '@/components/orders/order-header-with-actions';
import { OrderItems } from '@/components/orders/order-items';
import { CustomerInfo } from '@/components/orders/customer-info';
import { OrderTimeline } from '@/components/orders/order-timeline';
import type { OrderStatusValue } from '@/modules/orders/domain/value-objects/order-status.vo';

type TimelineEventType =
  | 'CREATED'
  | 'PAID'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELED'
  | 'DISPUTE_OPENED'
  | 'RETURN_SHIPPED'
  | 'RETURN_RECEIVED'
  | 'REFUNDED';

interface TimelineEvent {
  type: TimelineEventType;
  timestamp: Date;
  details?: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Commande ${id} | Kpsull`,
    description: 'Détails de la commande',
  };
}

/**
 * Order Detail Page
 *
 * Story 8-2: Details commande
 *
 * Acceptance Criteria:
 * - AC1: Affiche header avec numéro, statut, date
 * - AC2: Liste des articles commandés avec images/prix
 * - AC3: Infos client (nom, email, adresse)
 * - AC4: Timeline des événements de la commande
 * - AC5: Boutons d'action selon le statut
 */
export default async function OrderDetailPage({ params }: PageProps) {
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

  // Build timeline events
  const timelineEvents = buildTimelineEvents(order);

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <OrderHeaderWithActions
        order={{
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          createdAt: order.createdAt,
          cancellationReason: order.cancellationReason,
        }}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <OrderItems
            items={order.items.map((item) => ({
              id: item.id,
              productName: item.productName,
              image: item.image,
              variantInfo: item.variantInfo,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal,
            }))}
            totals={{
              subtotal: order.totalAmount,
              total: order.totalAmount,
            }}
          />
        </div>

        <div className="space-y-6">
          <CustomerInfo
            customer={{
              name: order.customerName,
              email: order.customerEmail,
            }}
            address={order.shippingAddress}
          />

          <OrderTimeline events={timelineEvents} />
        </div>
      </div>
    </div>
  );
}

function buildTimelineEvents(order: {
  status: OrderStatusValue;
  createdAt: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  trackingNumber?: string;
  carrier?: string;
  cancellationReason?: string;
}): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      type: 'CREATED',
      timestamp: order.createdAt,
    },
  ];

  // Add PAID event if order is past pending
  if (order.status !== 'PENDING' && order.status !== 'CANCELED') {
    events.push({
      type: 'PAID',
      timestamp: order.createdAt, // Approximation - ideally we'd store payment timestamp
    });
  }

  // Add SHIPPED event
  if (order.shippedAt) {
    events.push({
      type: 'SHIPPED',
      timestamp: order.shippedAt,
      details: order.trackingNumber
        ? `${order.carrier ?? 'Transporteur'}: ${order.trackingNumber}`
        : undefined,
    });
  }

  // Add DELIVERED event
  if (order.deliveredAt) {
    events.push({
      type: 'DELIVERED',
      timestamp: order.deliveredAt,
    });
  }

  // Add CANCELED event
  if (order.status === 'CANCELED') {
    events.push({
      type: 'CANCELED',
      timestamp: order.createdAt, // Approximation
      details: order.cancellationReason,
    });
  }

  // Add REFUNDED event
  if (order.status === 'REFUNDED') {
    events.push({
      type: 'REFUNDED',
      timestamp: order.createdAt, // Approximation
    });
  }

  return events;
}
