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
  /** Revenue from subscriptions in the current period in cents (NOT MRR) */
  subscriptionRevenue?: number;
  /** Monthly Recurring Revenue from active subscriptions in cents */
  subscriptionMRR?: number;
  /** Revenue from commissions only in cents */
  commissionRevenue?: number;
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
    subscriptionRevenue,
    subscriptionMRR,
    commissionRevenue,
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

      <div className="flex flex-col gap-2">
        <StatCard
          title="CA plateforme"
          value={formatCurrency(totalPlatformRevenue, currency)}
          icon={DollarSign}
          percentageChange={revenueChange}
          comparisonLabel="vs periode precedente"
        />
        {(subscriptionRevenue !== undefined || commissionRevenue !== undefined || subscriptionMRR !== undefined) && (
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground space-y-0.5">
            {subscriptionRevenue !== undefined && (
              <p>Abonnements&nbsp;: {formatCurrency(subscriptionRevenue, currency)}</p>
            )}
            {commissionRevenue !== undefined && (
              <p>Commissions&nbsp;: {formatCurrency(commissionRevenue, currency)}</p>
            )}
            {subscriptionMRR !== undefined && subscriptionMRR > 0 && (
              <p className="border-t pt-0.5 mt-0.5">MRR&nbsp;: {formatCurrency(subscriptionMRR, currency)}/mois</p>
            )}
          </div>
        )}
      </div>

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
