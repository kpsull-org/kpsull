'use client';

import { OrderHeader } from './order-header';
import { cancelOrder } from '@/app/(dashboard)/dashboard/orders/[id]/actions';
import type { OrderStatusValue } from '@/modules/orders/domain/value-objects/order-status.vo';

interface OrderHeaderWithActionsProps {
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatusValue;
    createdAt: Date;
    cancellationReason?: string;
  };
}

/**
 * OrderHeaderWithActions Component
 *
 * Story 8-5: Annulation remboursement
 *
 * Client component wrapper that provides server action to OrderHeader.
 */
export function OrderHeaderWithActions({ order }: OrderHeaderWithActionsProps) {
  const handleCancelOrder = async (orderId: string, reason: string) => {
    return cancelOrder(orderId, reason);
  };

  return (
    <OrderHeader
      order={order}
      onCancelOrder={handleCancelOrder}
    />
  );
}
