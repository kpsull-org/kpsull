import type { OrderStatusValue } from '@/modules/orders/domain/value-objects/order-status.vo';

export type TimelineEventType =
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

export interface OrderTimelineEvent {
  type: TimelineEventType;
  timestamp: Date;
  details?: string;
}

export interface OrderTimelineInput {
  status: OrderStatusValue;
  createdAt: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  trackingNumber?: string;
  carrier?: string;
  cancellationReason?: string;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatusValue, { label: string; className: string }> = {
  PENDING: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
  PAID: { label: 'Payee', className: 'bg-blue-100 text-blue-800' },
  SHIPPED: { label: 'Expediee', className: 'bg-purple-100 text-purple-800' },
  DELIVERED: { label: 'Livree', className: 'bg-green-100 text-green-800' },
  VALIDATION_PENDING: { label: 'Validation en attente', className: 'bg-orange-100 text-orange-800' },
  COMPLETED: { label: 'Terminee', className: 'bg-green-100 text-green-800' },
  DISPUTE_OPENED: { label: 'Litige ouvert', className: 'bg-red-100 text-red-800' },
  RETURN_SHIPPED: { label: 'Retour expedie', className: 'bg-orange-100 text-orange-800' },
  RETURN_RECEIVED: { label: 'Retour recu', className: 'bg-orange-100 text-orange-800' },
  REFUNDED: { label: 'Remboursee', className: 'bg-gray-100 text-gray-800' },
  CANCELED: { label: 'Annulee', className: 'bg-red-100 text-red-800' },
};

const STATUS_EVENT_TYPES: Partial<Record<OrderStatusValue, TimelineEventType>> = {
  CANCELED: 'CANCELED',
  REFUNDED: 'REFUNDED',
  DISPUTE_OPENED: 'DISPUTE_OPENED',
  RETURN_SHIPPED: 'RETURN_SHIPPED',
  RETURN_RECEIVED: 'RETURN_RECEIVED',
  COMPLETED: 'COMPLETED',
};

export function buildOrderTimelineEvents(order: OrderTimelineInput): OrderTimelineEvent[] {
  const events: OrderTimelineEvent[] = [{ type: 'CREATED', timestamp: order.createdAt }];

  if (order.status !== 'PENDING' && order.status !== 'CANCELED') {
    events.push({ type: 'PAID', timestamp: order.createdAt });
  }

  if (order.shippedAt) {
    events.push({
      type: 'SHIPPED',
      timestamp: order.shippedAt,
      details: order.trackingNumber
        ? `${order.carrier ?? 'Transporteur'}: ${order.trackingNumber}`
        : undefined,
    });
  }

  if (order.deliveredAt) {
    events.push({ type: 'DELIVERED', timestamp: order.deliveredAt });
  }

  const extraType = STATUS_EVENT_TYPES[order.status];
  if (extraType) {
    events.push({
      type: extraType,
      timestamp: order.createdAt,
      details: order.status === 'CANCELED' ? order.cancellationReason : undefined,
    });
  }

  return events;
}

export const ORDER_STATUSES = [
  { value: '', label: 'Tous les statuts' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'PAID', label: 'Payee' },
  { value: 'SHIPPED', label: 'Expediee' },
  { value: 'DELIVERED', label: 'Livree' },
  { value: 'COMPLETED', label: 'Terminee' },
  { value: 'CANCELED', label: 'Annulee' },
  { value: 'DISPUTE_OPENED', label: 'Litige ouvert' },
] as const;

const amountFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});

const dateFormatter = new Intl.DateTimeFormat('fr-FR');

export function formatAmount(cents: number): string {
  return amountFormatter.format(cents / 100);
}

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}

export function getStatusBadgeClass(status: string): string {
  return ORDER_STATUS_CONFIG[status as OrderStatusValue]?.className ?? 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(status: string): string {
  return ORDER_STATUS_CONFIG[status as OrderStatusValue]?.label ?? status;
}
