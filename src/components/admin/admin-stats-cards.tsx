'use client';

import { Users, DollarSign, ShoppingCart, UserPlus } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { cn } from '@/lib/utils';

export interface AdminStatsData {
  /** Total number of active creators on the platform */
  totalCreators: number;
  /** Percentage change in creators vs previous period */
  creatorsChange?: number;
  /** Total platform revenue in cents */
  totalPlatformRevenue: number;
  /** Percentage change in revenue vs previous period */
  revenueChange?: number;
  /** Total number of orders across the platform */
  totalOrders: number;
  /** Percentage change in orders vs previous period */
  ordersChange?: number;
  /** New creators registered in current period */
  newCreators: number;
  /** Percentage change in new creators vs previous period */
  newCreatorsChange?: number;
}

export interface AdminStatsCardsProps {
  /** Admin KPI data to display */
  data: AdminStatsData;
  /** Currency symbol for formatting */
  currency?: string;
  /** Optional className for styling */
  className?: string;
}

/**
 * Format a number as currency (from cents)
 */
function formatCurrency(valueInCents: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(valueInCents / 100);
}

/**
 * Format a number with thousands separator
 */
function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}

/**
 * AdminStatsCards
 *
 * Story 11-1: Dashboard admin KPIs
 *
 * Displays a grid of 4 KPI cards for the admin dashboard:
 * - Createurs actifs (Active Creators)
 * - CA plateforme (Platform Revenue)
 * - Commandes totales (Total Orders)
 * - Nouveaux createurs (New Creators)
 *
 * Each card shows the current value and optionally the percentage
 * change compared to the previous period.
 *
 * Acceptance Criteria:
 * - AC1: KPIs plateforme (nombre createurs, CA total plateforme, commandes totales)
 * - AC2: Tendances vs periode precedente
 *
 * @example
 * ```tsx
 * <AdminStatsCards
 *   data={{
 *     totalCreators: 142,
 *     creatorsChange: 13.6,
 *     totalPlatformRevenue: 18750000, // in cents
 *     revenueChange: 23.4,
 *     totalOrders: 2145,
 *     ordersChange: 13.5,
 *     newCreators: 24,
 *     newCreatorsChange: 33.3,
 *   }}
 *   currency="EUR"
 * />
 * ```
 */
export function AdminStatsCards({
  data,
  currency = 'EUR',
  className,
}: AdminStatsCardsProps) {
  const {
    totalCreators,
    creatorsChange,
    totalPlatformRevenue,
    revenueChange,
    totalOrders,
    ordersChange,
    newCreators,
    newCreatorsChange,
  } = data;

  return (
    <div
      className={cn(
        'grid gap-4 md:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      <StatCard
        title="Createurs actifs"
        value={formatNumber(totalCreators)}
        icon={Users}
        percentageChange={creatorsChange}
        comparisonLabel="vs periode precedente"
      />

      <StatCard
        title="CA plateforme"
        value={formatCurrency(totalPlatformRevenue, currency)}
        icon={DollarSign}
        percentageChange={revenueChange}
        comparisonLabel="vs periode precedente"
      />

      <StatCard
        title="Commandes totales"
        value={formatNumber(totalOrders)}
        icon={ShoppingCart}
        percentageChange={ordersChange}
        comparisonLabel="vs periode precedente"
      />

      <StatCard
        title="Nouveaux createurs"
        value={formatNumber(newCreators)}
        icon={UserPlus}
        percentageChange={newCreatorsChange}
        comparisonLabel="vs periode precedente"
      />
    </div>
  );
}
