'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { PeriodSelector } from '@/components/dashboard/period-selector';
import type { TimePeriodType } from '@/modules/analytics/domain/value-objects';

interface AdminPeriodSelectorProps {
  currentPeriod: TimePeriodType;
}

/**
 * AdminPeriodSelector
 *
 * Client component wrapper for PeriodSelector that updates URL params.
 * Used in the admin dashboard to persist period selection in the URL.
 */
export function AdminPeriodSelector({ currentPeriod }: AdminPeriodSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePeriodChange = useCallback(
    (period: TimePeriodType) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('period', period);
      router.push(`/admin?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <PeriodSelector
      selectedPeriod={currentPeriod}
      onPeriodChange={handlePeriodChange}
      compact
    />
  );
}
