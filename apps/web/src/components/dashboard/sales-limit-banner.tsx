'use client';

import Link from 'next/link';
import { AlertTriangle, Sparkles, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { LimitStatus } from '@/modules/subscriptions/application/use-cases/check-limit.use-case';

export interface SalesLimitBannerProps {
  /** Current number of sales this month */
  current: number;
  /** Maximum allowed sales for the plan (-1 for unlimited) */
  limit: number;
  /** Current limit status */
  status: LimitStatus;
  /** Optional className for styling */
  className?: string;
}

/**
 * Calculate the percentage of limit used
 */
function calculatePercentage(current: number, limit: number): number {
  if (limit === -1) return 0;
  return Math.min((current / limit) * 100, 100);
}

/**
 * Check if usage is near the limit (>= 80%)
 */
function isNearLimit(current: number, limit: number): boolean {
  if (limit === -1) return false;
  return calculatePercentage(current, limit) >= 80;
}

/**
 * SalesLimitBanner
 *
 * Displays the current sales usage for a creator's dashboard.
 * Shows warning when approaching 80% of limit and error when limit reached.
 * Provides upgrade CTA for FREE plan users.
 *
 * @example
 * ```tsx
 * <SalesLimitBanner
 *   current={45}
 *   limit={50}
 *   status={LimitStatus.WARNING}
 * />
 * ```
 */
export function SalesLimitBanner({
  current,
  limit,
  status,
  className,
}: SalesLimitBannerProps) {
  const isUnlimited = limit === -1;
  const percentage = calculatePercentage(current, limit);
  const showWarning = isNearLimit(current, limit) && status !== LimitStatus.BLOCKED;
  const isBlocked = status === LimitStatus.BLOCKED;

  // PRO plan users with unlimited sales
  if (isUnlimited) {
    return (
      <Card className={cn('border-green-200 bg-green-50/50', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <TrendingUp className="h-4 w-4 text-green-600" />
            Ventes ce mois
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{current}</span>
            <span className="text-sm text-muted-foreground">Illimite (PRO)</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // FREE plan users - show limit usage
  return (
    <Card
      className={cn(
        isBlocked && 'border-destructive/50 bg-destructive/5',
        showWarning && !isBlocked && 'border-orange-200 bg-orange-50/50',
        className
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          {isBlocked ? (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          ) : showWarning ? (
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          ) : (
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          )}
          Ventes ce mois
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Counter */}
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold">{current}</span>
          <span
            className={cn(
              'text-sm',
              isBlocked && 'text-destructive font-medium',
              showWarning && !isBlocked && 'text-orange-600 font-medium',
              !isBlocked && !showWarning && 'text-muted-foreground'
            )}
          >
            / {limit} ventes
          </span>
        </div>

        {/* Progress bar */}
        <Progress
          value={percentage}
          className={cn(
            'h-2',
            isBlocked && '[&>[data-slot=indicator]]:bg-destructive',
            showWarning && !isBlocked && '[&>[data-slot=indicator]]:bg-orange-500'
          )}
        />

        {/* Warning message at 80% */}
        {showWarning && !isBlocked && (
          <Alert variant="warning" className="py-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-sm">Attention</AlertTitle>
            <AlertDescription className="text-xs">
              Vous avez utilise {Math.round(percentage)}% de votre limite de ventes.
              Passez a PRO pour des ventes illimitees.
            </AlertDescription>
          </Alert>
        )}

        {/* Blocked message when limit reached */}
        {isBlocked && (
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-sm">Limite atteinte</AlertTitle>
            <AlertDescription className="text-xs">
              Vous ne pouvez plus accepter de ventes ce mois-ci.
              Passez a PRO pour continuer a vendre.
            </AlertDescription>
          </Alert>
        )}

        {/* Upgrade CTA - show when near limit or blocked */}
        {(showWarning || isBlocked) && (
          <Button asChild className="w-full" variant={isBlocked ? 'default' : 'outline'}>
            <Link href="/subscription/upgrade">
              <Sparkles className="mr-2 h-4 w-4" />
              Passer a PRO
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
