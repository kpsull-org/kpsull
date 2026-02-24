'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, RotateCcw, Package, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { TrackingTimeline, type TrackingTimelineEvent } from '@/components/orders/tracking-timeline';
import { OrderTimeline } from '@/components/orders/order-timeline';
import { OrderItems } from '@/components/orders/order-items';
import { ReportIssueDialog } from '@/components/orders/report-issue-dialog';
import { ReturnRequestDialog } from '@/components/orders/return-request-dialog';
import { formatDate } from '@/lib/utils/format';
import { ORDER_STATUS_CONFIG, buildOrderTimelineEvents } from '@/lib/utils/order-status';
import type { OrderStatusValue } from '@/modules/orders/domain/value-objects/order-status.vo';
import type { TrackingStatusValue } from '@/modules/shipping/domain/value-objects/tracking-status.vo';
import type { DisputeTypeValue } from '@/modules/disputes/domain';
import type { ReturnReasonValue } from '@/modules/returns/domain';
import type { ReturnItem } from '@/modules/returns/application/ports/return.repository.interface';

/**
 * Order item interface for display
 */
interface OrderItem {
  id: string;
  productId: string;
  variantId?: string;
  productName: string;
  image?: string;
  variantInfo?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

/**
 * Shipping address interface
 */
interface ShippingAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

/**
 * Order data for tracking display
 */
export interface OrderTrackingData {
  id: string;
  orderNumber: string;
  status: OrderStatusValue;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  totalAmount: number;
  trackingNumber?: string;
  carrier?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
}

/**
 * Tracking data for the shipment
 */
export interface ShipmentTrackingData {
  trackingNumber: string;
  carrierName: string;
  currentStatus: TrackingStatusValue;
  currentStatusLabel: string;
  estimatedDelivery?: Date | null;
  events: TrackingTimelineEvent[];
}

/**
 * Props for the OrderTracking component
 */
export interface OrderTrackingProps {
  order: OrderTrackingData;
  tracking?: ShipmentTrackingData | null;
  onReportIssue: (
    orderId: string,
    type: DisputeTypeValue,
    description: string
  ) => Promise<{ success: boolean; error?: string }>;
  onRequestReturn: (
    orderId: string,
    reason: ReturnReasonValue,
    returnItems: ReturnItem[],
    additionalNotes?: string
  ) => Promise<{ success: boolean; error?: string }>;
  onCancelOrder?: (orderId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
}


/**
 * Calculate days remaining for return eligibility (14 days from delivery)
 */
function calculateDaysRemaining(deliveredAt: Date): number {
  const deliveryDate = new Date(deliveredAt);
  const deadline = new Date(deliveryDate);
  deadline.setDate(deadline.getDate() + 14);

  const now = new Date();
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * OrderTracking Component
 *
 * Story 12-2: Suivi commande en cours
 *
 * Client-facing order detail page with tracking timeline and action buttons.
 *
 * Acceptance Criteria:
 * - AC1: Page detail commande client avec timeline
 * - AC2: Statut de livraison avec tracking
 * - AC3: Boutons actions: Signaler probleme, Demander retour (si livre)
 */
export function OrderTracking({
  order,
  tracking,
  onReportIssue,
  onRequestReturn,
  onCancelOrder,
}: OrderTrackingProps) {
  const router = useRouter();
  const [isReportIssueOpen, setIsReportIssueOpen] = useState(false);
  const [isReturnRequestOpen, setIsReturnRequestOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [isCancelling, startCancelTransition] = useTransition();

  const statusConfig = ORDER_STATUS_CONFIG[order.status] || {
    label: order.status,
    className: 'bg-gray-100 text-gray-800',
  };

  // Determine if actions are available
  const isDelivered = order.status === 'DELIVERED';
  const canCancel = order.status === 'PAID';
  const canReportIssue = isDelivered;
  const daysRemaining = order.deliveredAt ? calculateDaysRemaining(order.deliveredAt) : 0;
  const canRequestReturn = isDelivered && daysRemaining > 0;

  // Build timeline events
  const timelineEvents = buildOrderTimelineEvents(order);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/my-orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Commande {order.orderNumber}</h1>
              <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
            </div>
            <p className="text-muted-foreground">Passee le {formatDate(order.createdAt)}</p>
          </div>
        </div>

        {/* Action buttons - AC3 */}
        <div className="flex gap-2">
          {canCancel && onCancelOrder && (
            <Button variant="destructive" size="sm" onClick={() => setIsCancelOpen(true)}>
              <X className="h-4 w-4 mr-2" />
              Annuler la commande
            </Button>
          )}
          {canReportIssue && (
            <Button variant="outline" onClick={() => setIsReportIssueOpen(true)}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Signaler un probleme
            </Button>
          )}
          {canRequestReturn && (
            <Button variant="outline" onClick={() => setIsReturnRequestOpen(true)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Demander un retour
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: Order items and address */}
        <div className="space-y-6">
          <OrderItems
            items={order.items}
            totals={{
              subtotal: order.totalAmount,
              total: order.totalAmount,
            }}
          />

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adresse de livraison</CardTitle>
            </CardHeader>
            <CardContent>
              <address className="not-italic text-muted-foreground">
                <p>{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.postalCode} {order.shippingAddress.city}
                </p>
                <p>{order.shippingAddress.country}</p>
              </address>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Tracking and timeline */}
        <div className="space-y-6">
          {/* Tracking Timeline - AC2 */}
          {tracking ? (
            <TrackingTimeline
              trackingNumber={tracking.trackingNumber}
              carrierName={tracking.carrierName}
              currentStatus={tracking.currentStatus}
              currentStatusLabel={tracking.currentStatusLabel}
              estimatedDelivery={tracking.estimatedDelivery}
              events={tracking.events}
            />
          ) : order.trackingNumber ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Suivi de livraison</CardTitle>
                <CardDescription>
                  {order.carrier ?? 'Transporteur'} - {order.trackingNumber}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Informations de suivi</p>
                    <p className="text-sm text-muted-foreground">
                      Numero de suivi: {order.trackingNumber}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Order Timeline - AC1 */}
          <OrderTimeline events={timelineEvents} />

          {/* Return eligibility info */}
          {isDelivered && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Politique de retour</CardTitle>
              </CardHeader>
              <CardContent>
                {daysRemaining > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Vous avez encore{' '}
                    <strong className="text-foreground">
                      {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}
                    </strong>{' '}
                    pour demander un retour.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Le delai de retour de 14 jours est depasse.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {canReportIssue && (
        <ReportIssueDialog
          orderId={order.id}
          orderNumber={order.orderNumber}
          open={isReportIssueOpen}
          onOpenChange={setIsReportIssueOpen}
          onSubmit={onReportIssue}
        />
      )}

      {canRequestReturn && order.deliveredAt && (
        <ReturnRequestDialog
          orderId={order.id}
          orderNumber={order.orderNumber}
          deliveredAt={order.deliveredAt}
          daysRemaining={daysRemaining}
          items={order.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            variantInfo: item.variantInfo,
            quantity: item.quantity,
            price: item.price,
          }))}
          open={isReturnRequestOpen}
          onOpenChange={setIsReturnRequestOpen}
          onSubmit={onRequestReturn}
        />
      )}

      {isCancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isCancelling && setIsCancelOpen(false)}
            aria-hidden="true"
          />
          <Card className="relative z-10 w-full max-w-md mx-4 shadow-xl border-2 border-black">
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2"
              onClick={() => setIsCancelOpen(false)}
              disabled={isCancelling}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fermer</span>
            </Button>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl uppercase tracking-widest">Annuler la commande</CardTitle>
              <CardDescription>Commande {order.orderNumber}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cancelSuccess ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
                  Votre commande a ete annulee et vous serez rembourse sous 3-5 jours ouvrés.
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Cette action est irréversible. Le montant vous sera rembourse sur votre moyen de paiement.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="cancelReason">Raison de l&apos;annulation <span className="text-destructive">*</span></Label>
                    <textarea
                      id="cancelReason"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Expliquez pourquoi vous souhaitez annuler..."
                      disabled={isCancelling}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  {cancelError && (
                    <p className="text-sm text-destructive">{cancelError}</p>
                  )}
                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      variant="destructive"
                      disabled={isCancelling || !cancelReason.trim()}
                      onClick={() => {
                        setCancelError(null);
                        startCancelTransition(async () => {
                          const result = await onCancelOrder!(order.id, cancelReason);
                          if (result.success) {
                            setCancelSuccess(true);
                            router.refresh();
                          } else {
                            setCancelError(result.error ?? "Une erreur s'est produite");
                          }
                        });
                      }}
                      className="w-full"
                    >
                      {isCancelling ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Annulation en cours...</>
                      ) : (
                        "Confirmer l'annulation"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => { setIsCancelOpen(false); setCancelError(null); }}
                      disabled={isCancelling}
                      className="w-full"
                    >
                      Garder ma commande
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
