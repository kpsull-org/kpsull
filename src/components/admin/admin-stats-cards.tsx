'use client';

import { Users, DollarSign, ShoppingCart, UserPlus, PieChart } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  /** Revenue from subscriptions in the current period in cents */
  subscriptionRevenue?: number;
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

function formatCurrency(valueInCents: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(valueInCents / 100);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}

/**
 * RevenueBreakdownCard
 *
 * 5th card — shows commissions vs subscriptions split with a proportional bar.
 */
function RevenueBreakdownCard({
  commissions,
  subscriptions,
  currency,
}: {
  commissions: number;
  subscriptions: number;
  currency: string;
}) {
  const total = commissions + subscriptions;
  const commissionsPercent = total > 0 ? Math.round((commissions / total) * 100) : 50;
  const subscriptionsPercent = 100 - commissionsPercent;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Répartition du CA
        </CardTitle>
        <PieChart className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Commissions row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">Commissions</span>
          </div>
          <span className="font-semibold tabular-nums">
            {formatCurrency(commissions, currency)}
          </span>
        </div>

        {/* Subscriptions row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Abonnements</span>
          </div>
          <span className="font-semibold tabular-nums">
            {formatCurrency(subscriptions, currency)}
          </span>
        </div>

        {/* Proportional bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="flex h-full"
          >
            <div
              className="bg-primary transition-all"
              style={{ width: `${commissionsPercent}%` }}
              title={`Commissions ${commissionsPercent}%`}
            />
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${subscriptionsPercent}%` }}
              title={`Abonnements ${subscriptionsPercent}%`}
            />
          </div>
        </div>

        {/* Percentages */}
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{commissionsPercent}%</span>
          <span>{subscriptionsPercent}%</span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * AdminStatsCards
 *
 * Displays a grid of 5 KPI cards for the admin dashboard:
 * 1. Créateurs actifs
 * 2. CA plateforme (total)
 * 3. Commandes totales
 * 4. Nouveaux créateurs
 * 5. Répartition du CA (commissions vs abonnements)
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
    subscriptionRevenue = 0,
    commissionRevenue = 0,
    totalOrders,
    ordersChange,
    newCreators,
    newCreatorsChange,
  } = data;

  return (
    <div
      className={cn(
        'grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
        className
      )}
    >
      <StatCard
        title="Createurs actifs"
        value={formatNumber(totalCreators)}
        icon={Users}
        percentageChange={creatorsChange}
        comparisonLabel="vs mois precedent"
      />

      <StatCard
        title="CA plateforme"
        value={formatCurrency(totalPlatformRevenue, currency)}
        icon={DollarSign}
        percentageChange={revenueChange}
        comparisonLabel="vs mois precedent"
      />

      <StatCard
        title="Commandes totales"
        value={formatNumber(totalOrders)}
        icon={ShoppingCart}
        percentageChange={ordersChange}
        comparisonLabel="vs mois precedent"
      />

      <StatCard
        title="Nouveaux createurs"
        value={formatNumber(newCreators)}
        icon={UserPlus}
        percentageChange={newCreatorsChange}
        comparisonLabel="vs mois precedent"
      />

      <RevenueBreakdownCard
        commissions={commissionRevenue}
        subscriptions={subscriptionRevenue}
        currency={currency}
      />
    </div>
  );
}
