'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { cn } from '@/lib/utils';

interface OrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
}

interface OrdersPageClientProps {
  orders: OrderSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  searchQuery: string;
  statusFilter: string | undefined;
}

const ORDER_STATUSES = [
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

function formatAmount(cents: number): string {
  return amountFormatter.format(cents / 100);
}

function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}

function getStatusBadgeClass(status: string): string {
  return STATUS_BADGE_CLASSES[status] ?? 'bg-gray-100 text-gray-800';
}

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function OrdersPageClient({
  orders,
  total,
  page,
  pageSize,
  totalPages,
  searchQuery,
  statusFilter,
}: OrdersPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(searchQuery);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const updateSearchParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        updateSearchParams({
          search: value || undefined,
          page: '1',
        });
      }, 300);
    },
    [updateSearchParams]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleStatusChange = useCallback(
    (status: string) => {
      updateSearchParams({
        status: status || undefined,
        page: '1',
      });
    },
    [updateSearchParams]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateSearchParams({
        page: newPage.toString(),
      });
    },
    [updateSearchParams]
  );

  const handleRowClick = useCallback(
    (orderId: string) => {
      router.push(`/dashboard/orders/${orderId}`);
    },
    [router]
  );

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Rechercher par numero, client..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:w-[300px]"
          />

          <select
            value={statusFilter ?? ''}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <p className="text-sm text-muted-foreground">
          {total === 0
            ? 'Aucune commande'
            : `${startItem}-${endItem} sur ${total} commande${total > 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className={cn('relative', isPending && 'opacity-50 pointer-events-none')}>
          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                  Numero
                </th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                  Client
                </th>
                <th className="h-10 px-4 text-right font-medium text-muted-foreground">
                  Montant
                </th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                  Statut
                </th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Aucune commande trouvee.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => handleRowClick(order.id)}
                    className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{order.orderNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.itemCount} article{order.itemCount > 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.customerEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatAmount(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                          getStatusBadgeClass(order.status)
                        )}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} sur {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              Precedent
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
