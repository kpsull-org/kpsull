import { Metadata } from 'next';
import { getCreatorOrderOrThrow } from './_get-order';
import { OrderHeaderWithActions } from '@/components/orders/order-header-with-actions';
import { OrderItems } from '@/components/orders/order-items';
import { CustomerInfo } from '@/components/orders/customer-info';
import { OrderTimeline } from '@/components/orders/order-timeline';
import { buildOrderTimelineEvents } from '@/lib/utils/order-status';

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
  const { id } = await params;
  const { order } = await getCreatorOrderOrThrow(id);

  // Build timeline events
  const timelineEvents = buildOrderTimelineEvents(order);

  return (
    <div className="max-w-4xl space-y-6">
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
