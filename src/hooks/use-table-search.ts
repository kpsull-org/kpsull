'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

interface UseTableSearchOptions {
  searchQuery: string;
  debounceMs?: number;
}

export function useTableSearch({ searchQuery, debounceMs = 300 }: UseTableSearchOptions) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(searchQuery);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

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
      }, debounceMs);
    },
    [updateSearchParams, debounceMs]
  );

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

  return {
    isPending,
    searchInput,
    updateSearchParams,
    handleSearchChange,
    handleStatusChange,
    handlePageChange,
  };
}
