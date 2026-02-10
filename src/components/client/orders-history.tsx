'use client';

import Link from 'next/link';
import { Package, ChevronRight, Truck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDate } from '@/lib/utils/format';
import type { OrderStatusValue } from '@/modules/orders/domain/value-objects/order-status.vo';

interface OrderHistoryItem {
  id: string;
  orderNumber: string;
  status: OrderStatusValue;
  totalAmount: number;
  itemCount: number;
  creatorId: string;
  trackingNumber?: string;
  carrier?: string;
  createdAt: Date;
}

interface OrdersHistoryProps {
  orders: OrderHistoryItem[];
  total: number;
  currentPage: number;
  totalPages: number;
}

const STATUS_CONFIG: Record<
  OrderStatusValue,
  { label: string; className: string }
> = {
  PENDING: { label: 'En attente', className: 'bg-accent text-accent-foreground' },
  PAID: { label: 'Payee', className: 'bg-kpsull-blue/20 text-kpsull-blue' },
  SHIPPED: { label: 'Expediee', className: 'bg-kpsull-blue/20 text-kpsull-blue' },
  DELIVERED: { label: 'Livree', className: 'bg-primary/20 text-primary' },
  VALIDATION_PENDING: {
    label: 'Validation en attente',
    className: 'bg-accent text-accent-foreground',
  },
  COMPLETED: { label: 'Terminee', className: 'bg-primary/20 text-primary' },
  DISPUTE_OPENED: { label: 'Litige ouvert', className: 'bg-destructive/20 text-destructive' },
  RETURN_SHIPPED: {
    label: 'Retour expedie',
    className: 'bg-accent text-accent-foreground',
  },
  RETURN_RECEIVED: {
    label: 'Retour recu',
    className: 'bg-accent text-accent-foreground',
  },
  REFUNDED: { label: 'Remboursee', className: 'bg-muted text-muted-foreground' },
  CANCELED: { label: 'Annulee', className: 'bg-destructive/20 text-destructive' },
};

/**
 * OrdersHistory Component
 *
 * Story 12-1: Historique commandes client
 *
 * Displays a list of customer orders with status, date, and amount.
 *
 * Acceptance Criteria:
 * - AC1: Page "Mes commandes" pour les clients
 * - AC2: Liste des commandes avec statut, date, montant
 * - AC3: Lien vers details de chaque commande
 */
export function OrdersHistory({
  orders,
  total,
  currentPage,
  totalPages,
}: OrdersHistoryProps) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2 font-sans">Aucune commande</h3>
          <p className="text-muted-foreground text-center mb-4 font-sans">
            Vous n&apos;avez pas encore passe de commande.
          </p>
          <Button asChild>
            <Link href="/">Decouvrir les boutiques</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground font-sans">
        {total} commande{total > 1 ? 's' : ''} au total
      </p>

      <div className="space-y-3">
        {orders.map((order) => {
          const statusConfig = STATUS_CONFIG[order.status] || {
            label: order.status,
            className: 'bg-gray-100 text-gray-800',
          };

          return (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold font-sans">
                        Commande {order.orderNumber}
                      </span>
                      <Badge className={statusConfig.className}>
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground font-sans">
                      <span>{formatDate(order.createdAt)}</span>
                      <span>
                        {order.itemCount} article{order.itemCount > 1 ? 's' : ''}
                      </span>
                      <span className="font-medium text-foreground">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </div>

                    {order.trackingNumber && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground font-sans">
                        <Truck className="h-4 w-4" />
                        <span>
                          {order.carrier}: {order.trackingNumber}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/my-orders/${order.id}`}>
                      <ChevronRight className="h-5 w-5" />
                      <span className="sr-only">Voir les details</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            asChild={currentPage > 1}
          >
            {currentPage > 1 ? (
              <Link href={`/my-orders?page=${currentPage - 1}`}>
                Precedent
              </Link>
            ) : (
              'Precedent'
            )}
          </Button>
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            asChild={currentPage < totalPages}
          >
            {currentPage < totalPages ? (
              <Link href={`/my-orders?page=${currentPage + 1}`}>
                Suivant
              </Link>
            ) : (
              'Suivant'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
