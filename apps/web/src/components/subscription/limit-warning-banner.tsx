'use client';

import Link from 'next/link';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { LimitStatus } from '@/modules/subscriptions/application/use-cases/check-limit.use-case';

interface LimitWarningBannerProps {
  type: 'products' | 'sales';
  current: number;
  limit: number;
  status: LimitStatus;
}

/**
 * LimitWarningBanner
 *
 * Displays a warning or error banner when a creator approaches or reaches their subscription limits.
 * Shows a CTA to upgrade to PRO plan.
 */
export function LimitWarningBanner({ type, current, limit, status }: LimitWarningBannerProps) {
  // Only show for WARNING or BLOCKED status
  if (status === LimitStatus.OK) {
    return null;
  }

  const isBlocked = status === LimitStatus.BLOCKED;
  const typeLabel = type === 'products' ? 'produits' : 'ventes';

  const title = isBlocked
    ? `Limite de ${typeLabel} atteinte`
    : `Vous approchez de la limite de ${typeLabel}`;

  const description = isBlocked
    ? `Vous avez atteint ${limit}/${limit} ${typeLabel}. Passez à PRO pour continuer.`
    : `${current}/${limit} ${typeLabel} utilisés. Plus qu'un disponible.`;

  return (
    <Alert variant={isBlocked ? 'destructive' : 'warning'}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{description}</span>
        <Button asChild size="sm" variant={isBlocked ? 'default' : 'outline'}>
          <Link href="/subscription/upgrade">
            <Sparkles className="mr-2 h-4 w-4" />
            Passer à PRO
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
