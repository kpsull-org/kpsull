'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition, useState } from 'react';
import { CreatorsTable } from '@/components/admin/creators-table';
import { SuspendCreatorDialog } from '@/components/admin/suspend-creator-dialog';
import { ReactivateCreatorDialog } from '@/components/admin/reactivate-creator-dialog';
import type {
  CreatorSummary,
  CreatorSortField,
  CreatorStatus,
  SortDirection,
} from '@/modules/analytics/application/ports';
import { suspendCreatorAction, reactivateCreatorAction } from './actions';

export interface CreatorsPageClientProps {
  initialCreators: CreatorSummary[];
  initialTotal: number;
  initialPage: number;
  initialPageSize: number;
  initialTotalPages: number;
  initialSortBy: CreatorSortField;
  initialSortDirection: SortDirection;
  initialSearchQuery: string;
  initialStatusFilter: CreatorStatus | 'ALL';
}

/**
 * CreatorsPageClient
 *
 * Story 11-2: Liste gestion createurs
 *
 * Client component for handling creators table interactions.
 * Updates URL search params for server-side data fetching.
 */
export function CreatorsPageClient({
  initialCreators,
  initialTotal,
  initialPage,
  initialPageSize,
  initialTotalPages,
  initialSortBy,
  initialSortDirection,
  initialSearchQuery,
  initialStatusFilter,
}: CreatorsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<CreatorSummary | null>(null);

  /**
   * Update URL with new search params
   */
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

  const handleSortChange = useCallback(
    (field: CreatorSortField, direction: SortDirection) => {
      updateSearchParams({
        sortBy: field,
        sortDirection: direction,
        page: '1', // Reset to first page on sort change
      });
    },
    [updateSearchParams]
  );

  const handleSearchChange = useCallback(
    (query: string) => {
      updateSearchParams({
        search: query || undefined,
        page: '1', // Reset to first page on search
      });
    },
    [updateSearchParams]
  );

  const handleStatusFilterChange = useCallback(
    (status: CreatorStatus | 'ALL') => {
      updateSearchParams({
        status: status === 'ALL' ? undefined : status,
        page: '1', // Reset to first page on filter change
      });
    },
    [updateSearchParams]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      updateSearchParams({
        page: page.toString(),
      });
    },
    [updateSearchParams]
  );

  const handleSuspend = useCallback((creator: CreatorSummary) => {
    setSelectedCreator(creator);
    setSuspendDialogOpen(true);
  }, []);

  const handleReactivate = useCallback((creator: CreatorSummary) => {
    setSelectedCreator(creator);
    setReactivateDialogOpen(true);
  }, []);

  const handleSuspendAction = useCallback(
    async (creatorId: string, reason: string): Promise<{ success: boolean; error?: string }> => {
      const result = await suspendCreatorAction(creatorId, reason);
      if (result.success) {
        startTransition(() => {
          router.refresh();
        });
      }
      return result;
    },
    [router]
  );

  const handleReactivateAction = useCallback(
    async (creatorId: string, reason: string): Promise<{ success: boolean; error?: string }> => {
      const result = await reactivateCreatorAction(creatorId, reason);
      if (result.success) {
        startTransition(() => {
          router.refresh();
        });
      }
      return result;
    },
    [router]
  );

  return (
    <>
      <CreatorsTable
        creators={initialCreators}
        total={initialTotal}
        page={initialPage}
        pageSize={initialPageSize}
        totalPages={initialTotalPages}
        sortBy={initialSortBy}
        sortDirection={initialSortDirection}
        searchQuery={initialSearchQuery}
        statusFilter={initialStatusFilter}
        isLoading={isPending}
        onSortChange={handleSortChange}
        onSearchChange={handleSearchChange}
        onStatusFilterChange={handleStatusFilterChange}
        onPageChange={handlePageChange}
        onSuspend={handleSuspend}
        onReactivate={handleReactivate}
      />

      {/* Suspend Creator Dialog */}
      {selectedCreator && (
        <SuspendCreatorDialog
          creatorId={selectedCreator.id}
          creatorName={selectedCreator.name}
          open={suspendDialogOpen}
          onOpenChange={setSuspendDialogOpen}
          onSuspend={handleSuspendAction}
        />
      )}

      {/* Reactivate Creator Dialog */}
      {selectedCreator && (
        <ReactivateCreatorDialog
          creatorId={selectedCreator.id}
          creatorName={selectedCreator.name}
          open={reactivateDialogOpen}
          onOpenChange={setReactivateDialogOpen}
          onReactivate={handleReactivateAction}
        />
      )}
    </>
  );
}
