'use client';

import { DollarSign, ShoppingCart, Receipt, TrendingUp } from 'lucide-react';
import { StatCard } from './stat-card';
import { cn } from '@/lib/utils';

export interface StatsCardsData {
  /** Total revenue (CA total) */
  totalRevenue: number;
  /** Previous period revenue for comparison */
  previousRevenue?: number;
  /** Total number of orders */
  totalOrders: number;
  /** Previous period orders for comparison */
  previousOrders?: number;
  /** Average order value (panier moyen) */
  averageOrderValue: number;
  /** Previous period average order value for comparison */
  previousAverageOrderValue?: number;
  /** Conversion rate as percentage (0-100) */
  conversionRate?: number;
  /** Previous period conversion rate for comparison */
  previousConversionRate?: number;
}

export interface StatsCardsProps {
  /** KPI data to display */
  data: StatsCardsData;
  /** Currency symbol for formatting */
  currency?: string;
  /** Optional className for styling */
  className?: string;
}

/**
 * Format a number as currency
 */
function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number with thousands separator
 */
function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}

/**
 * Calculate percentage change between two values
 */
function calculatePercentageChange(current: number, previous: number): number | undefined {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * StatsCards
 *
 * Displays a grid of 4 KPI cards for the dashboard:
 * - CA total (Total Revenue)
 * - Nombre de commandes (Total Orders)
 * - Panier moyen (Average Order Value)
 * - Taux de conversion (Conversion Rate)
 *
 * Each card shows the current value and optionally the percentage
 * change compared to the previous period.
 *
 * @example
 * ```tsx
 * <StatsCards
 *   data={{
 *     totalRevenue: 12450,
 *     previousRevenue: 10200,
 *     totalOrders: 145,
 *     previousOrders: 120,
 *     averageOrderValue: 85.86,
 *     previousAverageOrderValue: 85.0,
 *     conversionRate: 3.2,
 *     previousConversionRate: 2.8,
 *   }}
 *   currency="EUR"
 * />
 * ```
 */
export function StatsCards({
  data,
  currency = 'EUR',
  className,
}: StatsCardsProps) {
  const {
    totalRevenue,
    previousRevenue,
    totalOrders,
    previousOrders,
    averageOrderValue,
    previousAverageOrderValue,
    conversionRate,
    previousConversionRate,
  } = data;

  // Calculate percentage changes if previous values are provided
  const revenueChange = previousRevenue !== undefined
    ? calculatePercentageChange(totalRevenue, previousRevenue)
    : undefined;

  const ordersChange = previousOrders !== undefined
    ? calculatePercentageChange(totalOrders, previousOrders)
    : undefined;

  const aovChange = previousAverageOrderValue !== undefined
    ? calculatePercentageChange(averageOrderValue, previousAverageOrderValue)
    : undefined;

  const conversionChange =
    conversionRate !== undefined && previousConversionRate !== undefined
      ? calculatePercentageChange(conversionRate, previousConversionRate)
      : undefined;

  return (
    <div
      className={cn(
        'grid gap-4 md:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      <StatCard
        title="Chiffre d'affaires"
        value={formatCurrency(totalRevenue, currency)}
        icon={DollarSign}
        percentageChange={revenueChange}
        comparisonLabel="vs periode precedente"
      />

      <StatCard
        title="Commandes"
        value={formatNumber(totalOrders)}
        icon={ShoppingCart}
        percentageChange={ordersChange}
        comparisonLabel="vs periode precedente"
      />

      <StatCard
        title="Panier moyen"
        value={formatCurrency(averageOrderValue, currency)}
        icon={Receipt}
        percentageChange={aovChange}
        comparisonLabel="vs periode precedente"
      />

      <StatCard
        title="Taux de conversion"
        value={conversionRate !== undefined ? `${conversionRate.toFixed(1)}%` : 'N/A'}
        icon={TrendingUp}
        percentageChange={conversionChange}
        comparisonLabel="vs periode precedente"
      />
    </div>
  );
}
