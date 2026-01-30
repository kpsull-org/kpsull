'use client';

import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { RevenueDataPoint } from '@/modules/analytics/application/ports';

export interface SalesChartProps {
  /** Revenue data points for the chart */
  data: RevenueDataPoint[];
  /** Total revenue for the period */
  totalRevenue: number;
  /** Revenue change compared to previous period (percentage) */
  revenueChangePercent: number;
  /** Period label (e.g., "30 derniers jours") */
  periodLabel?: string;
  /** Optional className for styling */
  className?: string;
}

/**
 * Format currency in EUR
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage with sign
 */
function formatPercentage(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Format date for display (short format)
 */
function formatDateLabel(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Calculate bar height percentage based on max value
 */
function calculateBarHeight(value: number, maxValue: number): number {
  if (maxValue === 0) return 0;
  return Math.max((value / maxValue) * 100, 2); // Min 2% for visibility
}

/**
 * Get trend icon and color based on percentage change
 */
function getTrendIndicator(changePercent: number): {
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
} {
  if (changePercent > 0) {
    return {
      icon: <TrendingUp className="h-4 w-4" />,
      colorClass: 'text-green-600',
      bgClass: 'bg-green-100',
    };
  }
  if (changePercent < 0) {
    return {
      icon: <TrendingDown className="h-4 w-4" />,
      colorClass: 'text-red-600',
      bgClass: 'bg-red-100',
    };
  }
  return {
    icon: <Minus className="h-4 w-4" />,
    colorClass: 'text-gray-600',
    bgClass: 'bg-gray-100',
  };
}

/**
 * Single bar component for the chart
 */
interface ChartBarProps {
  value: number;
  maxValue: number;
  label: string;
  isHighlighted?: boolean;
}

function ChartBar({ value, maxValue, label, isHighlighted = false }: ChartBarProps) {
  const height = calculateBarHeight(value, maxValue);

  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      {/* Bar container */}
      <div className="relative flex h-32 w-full items-end justify-center">
        <div
          className={cn(
            'w-full max-w-[2rem] rounded-t-sm transition-all duration-300',
            isHighlighted ? 'bg-primary' : 'bg-primary/60',
            'hover:bg-primary'
          )}
          style={{ height: `${height}%` }}
          title={`${formatCurrency(value)} - ${label}`}
        />
      </div>
      {/* Date label */}
      <span className="text-[10px] text-muted-foreground truncate w-full text-center">
        {label}
      </span>
    </div>
  );
}

/**
 * SalesChart
 *
 * Displays sales evolution over a selected period using CSS-based bars.
 * Shows total revenue, trend indicator, and revenue data points.
 *
 * Features:
 * - CSS-only bar chart (no external dependencies)
 * - Trend indicator (up/down/neutral)
 * - Total revenue summary
 * - Responsive design with adaptive bar count
 *
 * @example
 * ```tsx
 * <SalesChart
 *   data={revenueByDay}
 *   totalRevenue={15000}
 *   revenueChangePercent={12.5}
 *   periodLabel="30 derniers jours"
 * />
 * ```
 */
export function SalesChart({
  data,
  totalRevenue,
  revenueChangePercent,
  periodLabel = 'Periode selectionnee',
  className,
}: SalesChartProps) {
  // Calculate max value for bar scaling
  const maxValue = Math.max(...data.map((d) => d.revenue), 1);

  // Get trend indicator
  const trend = getTrendIndicator(revenueChangePercent);

  // Limit displayed bars for readability (show last N points)
  const displayData = data.length > 12 ? data.slice(-12) : data;

  // Find the highest value index for highlighting
  const highestIndex = displayData.reduce(
    (maxIdx, item, idx, arr) => {
      const currentMax = arr[maxIdx];
      if (!currentMax) return idx;
      return item.revenue > currentMax.revenue ? idx : maxIdx;
    },
    0
  );

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-medium">
              Evolution des ventes
            </CardTitle>
            <p className="text-sm text-muted-foreground">{periodLabel}</p>
          </div>
          {/* Trend badge */}
          <div
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
              trend.bgClass,
              trend.colorClass
            )}
          >
            {trend.icon}
            <span>{formatPercentage(revenueChangePercent)}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Total revenue */}
        <div>
          <p className="text-3xl font-bold tracking-tight">
            {formatCurrency(totalRevenue)}
          </p>
          <p className="text-sm text-muted-foreground">
            Total sur la periode
          </p>
        </div>

        {/* Bar chart */}
        {displayData.length > 0 ? (
          <div className="flex items-end gap-1 pt-4">
            {displayData.map((point, index) => (
              <ChartBar
                key={point.date}
                value={point.revenue}
                maxValue={maxValue}
                label={formatDateLabel(point.date)}
                isHighlighted={index === highestIndex}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              Aucune donnee disponible
            </p>
          </div>
        )}

        {/* Legend */}
        {displayData.length > 0 && (
          <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
            <span>
              Min: {formatCurrency(Math.min(...displayData.map((d) => d.revenue)))}
            </span>
            <span>
              Max: {formatCurrency(Math.max(...displayData.map((d) => d.revenue)))}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
