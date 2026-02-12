'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ReturnsTable, type ReturnItem } from '@/components/returns/returns-table';
import { cn } from '@/lib/utils';
import type { ReturnStatusValue } from '@/modules/returns/domain/value-objects/return-status.vo';

// =============================================================================
// TYPES
// =============================================================================

interface ReturnsPageClientProps {
  returns: ReturnItem[];
  total: number;
  statusCounts: Record<ReturnStatusValue, number>;
  currentFilter?: ReturnStatusValue;
  onApprove: (returnId: string) => Promise<{ success: boolean; error?: string }>;
  onReject: (returnId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  onReceive: (returnId: string) => Promise<{ success: boolean; error?: string }>;
  onRefund: (returnId: string) => Promise<{ success: boolean; error?: string }>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STATUS_FILTERS: Array<{
  value: ReturnStatusValue | 'all';
  label: string;
  color: string;
}> = [
  { value: 'all', label: 'Tous', color: 'bg-gray-100 text-gray-800 hover:bg-gray-200' },
  {
    value: 'REQUESTED',
    label: 'En attente',
    color: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  },
  { value: 'APPROVED', label: 'Approuves', color: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
  {
    value: 'SHIPPED_BACK',
    label: 'Expedies',
    color: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
  },
  { value: 'RECEIVED', label: 'Recus', color: 'bg-purple-100 text-purple-800 hover:bg-purple-200' },
  {
    value: 'REFUNDED',
    label: 'Rembourses',
    color: 'bg-green-100 text-green-800 hover:bg-green-200',
  },
  { value: 'REJECTED', label: 'Refuses', color: 'bg-red-100 text-red-800 hover:bg-red-200' },
];

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * ReturnsPageClient Component
 *
 * Client component for the returns management page.
 * Provides status filtering and interactive table.
 */
export function ReturnsPageClient({
  returns,
  total,
  statusCounts,
  currentFilter,
  onApprove,
  onReject,
  onReceive,
  onRefund,
}: ReturnsPageClientProps) {
  const router = useRouter();

  const handleFilterChange = (status: ReturnStatusValue | 'all') => {
    if (status === 'all') {
      router.push('/dashboard/returns');
    } else {
      router.push(`/dashboard/returns?status=${status}`);
    }
  };

  const handleViewOrder = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}`);
  };

  // Calculate total for "all" filter
  const allCount = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

  // Get count for a specific filter
  const getCount = (value: ReturnStatusValue | 'all'): number => {
    if (value === 'all') return allCount;
    return statusCounts[value] || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Demandes de retour</h1>
          <p className="text-muted-foreground">
            Gerez les demandes de retour de vos clients
          </p>
        </div>
        {statusCounts.REQUESTED > 0 && (
          <Badge variant="secondary" className="w-fit text-sm bg-amber-100 text-amber-800">
            {statusCounts.REQUESTED} en attente
          </Badge>
        )}
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => {
          const count = getCount(filter.value);
          const isActive =
            filter.value === 'all' ? !currentFilter : currentFilter === filter.value;

          return (
            <Button
              key={filter.value}
              variant="ghost"
              size="sm"
              onClick={() => handleFilterChange(filter.value)}
              className={cn(
                'transition-all',
                isActive
                  ? filter.color + ' font-medium'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              )}
            >
              {filter.label}
              {count > 0 && (
                <span
                  className={cn(
                    'ml-1.5 rounded-full px-1.5 py-0.5 text-xs',
                    isActive ? 'bg-white/50' : 'bg-muted-foreground/10'
                  )}
                >
                  {count}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Returns table */}
      <ReturnsTable
        returns={returns}
        onApprove={onApprove}
        onReject={onReject}
        onReceive={onReceive}
        onRefund={onRefund}
        onViewOrder={handleViewOrder}
      />

      {/* Total count */}
      {returns.length > 0 && (
        <p className="text-sm text-center text-muted-foreground">
          {currentFilter
            ? `${returns.length} demande${returns.length > 1 ? 's' : ''} ${STATUS_FILTERS.find((f) => f.value === currentFilter)?.label.toLowerCase() ?? ''}`
            : `${total} demande${total > 1 ? 's' : ''} de retour au total`}
        </p>
      )}
    </div>
  );
}
