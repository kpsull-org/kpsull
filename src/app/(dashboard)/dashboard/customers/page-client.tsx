'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { CustomersTable } from '@/components/dashboard/customers-table';
import type { CustomerSummary, CustomerSortField, SortDirection } from '@/modules/analytics/application/ports';

export interface CustomersPageClientProps {
  initialCustomers: CustomerSummary[];
  initialTotal: number;
  initialPage: number;
  initialPageSize: number;
  initialTotalPages: number;
  initialSortBy: CustomerSortField;
  initialSortDirection: SortDirection;
  initialSearchQuery: string;
}

/**
 * CustomersPageClient
 *
 * Client component for handling customers table interactions.
 * Updates URL search params for server-side data fetching.
 */
export function CustomersPageClient({
  initialCustomers,
  initialTotal,
  initialPage,
  initialPageSize,
  initialTotalPages,
  initialSortBy,
  initialSortDirection,
  initialSearchQuery,
}: CustomersPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

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
    (field: CustomerSortField, direction: SortDirection) => {
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

  const handlePageChange = useCallback(
    (page: number) => {
      updateSearchParams({
        page: page.toString(),
      });
    },
    [updateSearchParams]
  );

  return (
    <CustomersTable
      customers={initialCustomers}
      total={initialTotal}
      page={initialPage}
      pageSize={initialPageSize}
      totalPages={initialTotalPages}
      sortBy={initialSortBy}
      sortDirection={initialSortDirection}
      searchQuery={initialSearchQuery}
      isLoading={isPending}
      onSortChange={handleSortChange}
      onSearchChange={handleSearchChange}
      onPageChange={handlePageChange}
    />
  );
}
