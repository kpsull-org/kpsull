'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Truck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/format';
import { CancelOrderDialog } from './cancel-order-dialog';
import type { OrderStatusValue } from '@/modules/orders/domain/value-objects/order-status.vo';

interface OrderHeaderProps {
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatusValue;
    createdAt: Date;
    cancellationReason?: string;
  };
  onCancelOrder?: (orderId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
}

const STATUS_CONFIG: Record<
  OrderStatusValue,
  { label: string; className: string }
> = {
  PENDING: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
  PAID: { label: 'Payee', className: 'bg-blue-100 text-blue-800' },
  SHIPPED: { label: 'Expediee', className: 'bg-purple-100 text-purple-800' },
  DELIVERED: { label: 'Livree', className: 'bg-green-100 text-green-800' },
  VALIDATION_PENDING: {
    label: 'Validation en attente',
    className: 'bg-orange-100 text-orange-800',
  },
  COMPLETED: { label: 'Terminee', className: 'bg-green-100 text-green-800' },
  DISPUTE_OPENED: { label: 'Litige ouvert', className: 'bg-red-100 text-red-800' },
  RETURN_SHIPPED: {
    label: 'Retour expedie',
    className: 'bg-orange-100 text-orange-800',
  },
  RETURN_RECEIVED: {
    label: 'Retour recu',
    className: 'bg-orange-100 text-orange-800',
  },
  REFUNDED: { label: 'Remboursee', className: 'bg-gray-100 text-gray-800' },
  CANCELED: { label: 'Annulee', className: 'bg-red-100 text-red-800' },
};

/**
 * OrderHeader Component
 *
 * Story 8-5: Annulation remboursement
 *
 * Displays order header with status badge and action buttons.
 *
 * Acceptance Criteria:
 * - AC1: Cancel button displayed on non-shipped orders
 * - AC4: Display cancellation reason when order is cancelled
 */
export function OrderHeader({ order, onCancelOrder }: OrderHeaderProps) {
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const statusConfig = STATUS_CONFIG[order.status] || {
    label: order.status,
    className: 'bg-gray-100 text-gray-800',
  };
  const canShip = order.status === 'PAID';
  const canCancel = ['PENDING', 'PAID'].includes(order.status);
  const isCancelled = order.status === 'CANCELED';

  const handleCancelOrder = async (orderId: string, reason: string) => {
    if (!onCancelOrder) {
      return { success: false, error: 'Action non disponible' };
    }
    return onCancelOrder(orderId, reason);
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                Commande {order.orderNumber}
              </h1>
              <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
            </div>
            <p className="text-muted-foreground">
              Passee le {formatDate(order.createdAt)}
            </p>
            {isCancelled && order.cancellationReason && (
              <p className="text-sm text-destructive mt-1">
                Raison: {order.cancellationReason}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {canShip && (
            <Button asChild>
              <Link href={`/dashboard/orders/${order.id}/ship`}>
                <Truck className="h-4 w-4 mr-2" />
                Expedier
              </Link>
            </Button>
          )}
          {canCancel && onCancelOrder && (
            <Button
              variant="destructive"
              onClick={() => setIsCancelDialogOpen(true)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          )}
        </div>
      </div>

      {onCancelOrder && (
        <CancelOrderDialog
          orderId={order.id}
          orderNumber={order.orderNumber}
          open={isCancelDialogOpen}
          onOpenChange={setIsCancelDialogOpen}
          onCancel={handleCancelOrder}
        />
      )}
    </>
  );
}
