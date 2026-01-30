'use client';

import Link from 'next/link';
import { BarChart3, Crown, Lock, Sparkles, Gem } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TopProductsList } from './top-products-list';
import { CategoryBreakdown, type ProjectBreakdown } from './category-breakdown';
import type { TopSellingProduct } from '@/modules/analytics/application/ports';
import type { PlanType } from '@/modules/subscriptions/domain/value-objects/plan.vo';
import { hasFeature } from '@/modules/subscriptions/domain/plan-features';

export interface ProAnalyticsSectionProps {
  /** Current subscription plan */
  plan: PlanType;
  /** Top selling products (only used if advanced analytics enabled) */
  topProducts?: TopSellingProduct[];
  /** Project breakdown data (only used if advanced analytics enabled) */
  projectBreakdown?: ProjectBreakdown[];
  /** Optional className for styling */
  className?: string;
}

/**
 * ProAnalyticsSection
 *
 * Displays advanced analytics for STUDIO and ATELIER subscribers.
 * Shows an upgrade prompt for ESSENTIEL plan users.
 *
 * Features for STUDIO/ATELIER users:
 * - Top selling products list
 * - Sales breakdown by project/category
 *
 * @example
 * ```tsx
 * // STUDIO/ATELIER user
 * <ProAnalyticsSection
 *   plan="STUDIO"
 *   topProducts={[...]}
 *   projectBreakdown={[...]}
 * />
 *
 * // ESSENTIEL user
 * <ProAnalyticsSection plan="ESSENTIEL" />
 * ```
 */
export function ProAnalyticsSection({
  plan,
  topProducts = [],
  projectBreakdown = [],
  className,
}: ProAnalyticsSectionProps) {
  const hasAdvancedAnalytics = hasFeature(plan, 'advancedAnalytics');

  // Plan badge configuration
  const planBadgeConfig = {
    ESSENTIEL: { icon: null, label: '', gradient: '' },
    STUDIO: { icon: Gem, label: 'Studio', gradient: 'from-purple-500 to-pink-500' },
    ATELIER: { icon: Crown, label: 'Atelier', gradient: 'from-amber-500 to-orange-500' },
  };

  // ESSENTIEL plan - show upgrade prompt
  if (!hasAdvancedAnalytics) {
    return (
      <Card
        className={cn(
          'relative overflow-hidden border-dashed border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/50',
          className
        )}
      >
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <BarChart3 className="h-4 w-4 text-purple-600" />
            Analytics avances
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            >
              <Gem className="mr-1 h-3 w-3" />
              Studio+
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Blurred preview */}
          <div className="relative">
            {/* Overlay with lock */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm">
              <div className="mb-4 rounded-full bg-purple-100 p-3">
                <Lock className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Debloquez les analytics avances
              </h3>
              <p className="mb-4 max-w-sm text-center text-sm text-muted-foreground">
                Passez au plan Studio ou Atelier pour acceder aux statistiques detaillees de vos
                ventes, top produits et repartition par projet.
              </p>
              <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <Link href="/subscription/upgrade">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Passer a Studio
                </Link>
              </Button>
            </div>

            {/* Blurred placeholder content */}
            <div className="pointer-events-none select-none opacity-30 blur-sm">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Fake top products */}
                <div className="space-y-3 rounded-lg border bg-white p-4">
                  <div className="h-4 w-32 rounded bg-gray-200" />
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between">
                        <div className="h-3 w-24 rounded bg-gray-200" />
                        <div className="h-3 w-16 rounded bg-gray-200" />
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200" />
                    </div>
                  ))}
                </div>

                {/* Fake category breakdown */}
                <div className="space-y-3 rounded-lg border bg-white p-4">
                  <div className="h-4 w-36 rounded bg-gray-200" />
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between">
                        <div className="h-3 w-28 rounded bg-gray-200" />
                        <div className="h-3 w-12 rounded bg-gray-200" />
                      </div>
                      <div className="h-3 w-full rounded-full bg-gray-200" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Benefits list */}
          <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-4">
            <h4 className="mb-3 text-sm font-medium text-purple-900">
              Avec Studio ou Atelier, vous obtenez :
            </h4>
            <ul className="space-y-2 text-sm text-purple-700">
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-200 text-xs">
                  1
                </span>
                Top produits vendus avec revenus
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-200 text-xs">
                  2
                </span>
                Repartition des ventes par projet
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-200 text-xs">
                  3
                </span>
                Export des rapports en CSV
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-200 text-xs">
                  4
                </span>
                Commission reduite (4% Studio, 3% Atelier)
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  // STUDIO/ATELIER plan - show full analytics
  const badgeConfig = planBadgeConfig[plan];
  const BadgeIcon = badgeConfig.icon;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Section header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-purple-600" />
        <h2 className="text-lg font-semibold">Analytics avances</h2>
        {BadgeIcon && (
          <Badge
            variant="secondary"
            className={cn('bg-gradient-to-r text-white', badgeConfig.gradient)}
          >
            <BadgeIcon className="mr-1 h-3 w-3" />
            {badgeConfig.label}
          </Badge>
        )}
      </div>

      {/* Analytics grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <TopProductsList products={topProducts} maxItems={5} />
        <CategoryBreakdown projects={projectBreakdown} />
      </div>
    </div>
  );
}
