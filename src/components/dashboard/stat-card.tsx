import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  /** Title of the KPI */
  title: string;
  /** Current value (formatted string) */
  value: string;
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Percentage change compared to previous period (optional) */
  percentageChange?: number;
  /** Label for the comparison period (e.g., "vs mois dernier") */
  comparisonLabel?: string;
  /** Badge count for pending items needing attention */
  badge?: number;
  /** Optional className for styling */
  className?: string;
}

/**
 * Determine the trend direction based on percentage change
 */
function getTrendDirection(percentageChange: number): 'up' | 'down' | 'neutral' {
  if (percentageChange > 0) return 'up';
  if (percentageChange < 0) return 'down';
  return 'neutral';
}

/**
 * Get trend icon based on direction
 */
function TrendIcon({ direction }: { direction: 'up' | 'down' | 'neutral' }) {
  switch (direction) {
    case 'up':
      return <TrendingUp className="h-3 w-3" />;
    case 'down':
      return <TrendingDown className="h-3 w-3" />;
    case 'neutral':
      return <Minus className="h-3 w-3" />;
  }
}

/**
 * StatCard
 *
 * Displays a single KPI with its current value, optional trend indicator,
 * and percentage change compared to a previous period.
 *
 * @example
 * ```tsx
 * <StatCard
 *   title="Chiffre d'affaires"
 *   value="12 450 EUR"
 *   icon={DollarSign}
 *   percentageChange={12.5}
 *   comparisonLabel="vs mois dernier"
 * />
 * ```
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  percentageChange,
  comparisonLabel = 'vs periode precedente',
  badge,
  className,
}: StatCardProps) {
  const hasComparison = percentageChange !== undefined;
  const trend = hasComparison ? getTrendDirection(percentageChange) : 'neutral';

  return (
    <Card className={cn('transition-shadow hover:shadow-md', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="relative">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {badge !== undefined && badge > 0 && (
            <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold">{value}</div>

        {hasComparison && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            <span
              className={cn(
                'flex items-center gap-0.5 font-medium',
                trend === 'up' && 'text-green-600',
                trend === 'down' && 'text-red-600',
                trend === 'neutral' && 'text-muted-foreground'
              )}
            >
              <TrendIcon direction={trend} />
              {trend === 'up' && '+'}
              {percentageChange.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">{comparisonLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
