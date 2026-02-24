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

  if (order.status === 'CANCELED') {
    events.push({ type: 'CANCELED', timestamp: order.createdAt, details: order.cancellationReason });
  }

  if (order.status === 'REFUNDED') {
    events.push({ type: 'REFUNDED', timestamp: order.createdAt });
  }

  if (order.status === 'DISPUTE_OPENED') {
    events.push({ type: 'DISPUTE_OPENED', timestamp: order.createdAt });
  }

  if (order.status === 'RETURN_SHIPPED') {
    events.push({ type: 'RETURN_SHIPPED', timestamp: order.createdAt });
  }

  if (order.status === 'RETURN_RECEIVED') {
    events.push({ type: 'RETURN_RECEIVED', timestamp: order.createdAt });
  }

  if (order.status === 'COMPLETED') {
    events.push({ type: 'COMPLETED', timestamp: order.createdAt });
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

const STATUS_BADGE_CLASSES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-green-200 text-green-900',
  CANCELED: 'bg-red-100 text-red-800',
  DISPUTE_OPENED: 'bg-orange-100 text-orange-800',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  PAID: 'Payee',
  SHIPPED: 'Expediee',
  DELIVERED: 'Livree',
  VALIDATION_PENDING: 'Validation en attente',
  COMPLETED: 'Terminee',
  DISPUTE_OPENED: 'Litige ouvert',
  RETURN_SHIPPED: 'Retour expedie',
  RETURN_RECEIVED: 'Retour recu',
  REFUNDED: 'Remboursee',
  CANCELED: 'Annulee',
};

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
  return STATUS_BADGE_CLASSES[status] ?? 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
