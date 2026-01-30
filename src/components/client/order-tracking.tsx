'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, RotateCcw, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrackingTimeline, type TrackingTimelineEvent } from '@/components/orders/tracking-timeline';
import { OrderTimeline } from '@/components/orders/order-timeline';
import { OrderItems } from '@/components/orders/order-items';
import { ReportIssueDialog } from '@/components/orders/report-issue-dialog';
import { ReturnRequestDialog } from '@/components/orders/return-request-dialog';
import { formatDate } from '@/lib/utils/format';
import type { OrderStatusValue } from '@/modules/orders/domain/value-objects/order-status.vo';
import type { TrackingStatusValue } from '@/modules/shipping/domain/value-objects/tracking-status.vo';
import type { DisputeTypeValue } from '@/modules/disputes/domain';
import type { ReturnReasonValue } from '@/modules/returns/domain';

/**
 * Order item interface for display
 */
interface OrderItem {
  id: string;
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
    additionalNotes?: string
  ) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Status configuration for badges
 */
const STATUS_CONFIG: Record<OrderStatusValue, { label: string; className: string }> = {
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
 * Build timeline events from order data
 */
function buildTimelineEvents(order: OrderTrackingData): Array<{
  type:
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
  timestamp: Date;
  details?: string;
}> {
  const events: Array<{
    type:
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
    timestamp: Date;
    details?: string;
  }> = [
    {
      type: 'CREATED',
      timestamp: order.createdAt,
    },
  ];

  // Add PAID event if order is past pending
  if (order.status !== 'PENDING' && order.status !== 'CANCELED') {
    events.push({
      type: 'PAID',
      timestamp: order.createdAt,
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

  // Add status-specific events
  if (order.status === 'CANCELED') {
    events.push({
      type: 'CANCELED',
      timestamp: order.createdAt,
    });
  }

  if (order.status === 'REFUNDED') {
    events.push({
      type: 'REFUNDED',
      timestamp: order.createdAt,
    });
  }

  if (order.status === 'DISPUTE_OPENED') {
    events.push({
      type: 'DISPUTE_OPENED',
      timestamp: order.createdAt,
    });
  }

  if (order.status === 'RETURN_SHIPPED') {
    events.push({
      type: 'RETURN_SHIPPED',
      timestamp: order.createdAt,
    });
  }

  if (order.status === 'RETURN_RECEIVED') {
    events.push({
      type: 'RETURN_RECEIVED',
      timestamp: order.createdAt,
    });
  }

  if (order.status === 'COMPLETED') {
    events.push({
      type: 'COMPLETED',
      timestamp: order.createdAt,
    });
  }

  return events;
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
}: OrderTrackingProps) {
  const [isReportIssueOpen, setIsReportIssueOpen] = useState(false);
  const [isReturnRequestOpen, setIsReturnRequestOpen] = useState(false);

  const statusConfig = STATUS_CONFIG[order.status] || {
    label: order.status,
    className: 'bg-gray-100 text-gray-800',
  };

  // Determine if actions are available
  const isDelivered = order.status === 'DELIVERED';
  const canReportIssue = isDelivered;
  const daysRemaining = order.deliveredAt ? calculateDaysRemaining(order.deliveredAt) : 0;
  const canRequestReturn = isDelivered && daysRemaining > 0;

  // Build timeline events
  const timelineEvents = buildTimelineEvents(order);

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
          open={isReturnRequestOpen}
          onOpenChange={setIsReturnRequestOpen}
          onSubmit={onRequestReturn}
        />
      )}
    </div>
  );
}
