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
