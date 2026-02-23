'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Une erreur est survenue
        </h2>
        <p className="text-muted-foreground">
          {error.message || 'Une erreur inattendue est survenue dans le tableau de bord.'}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground">
            Référence : {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          Réessayer
        </Button>
        <Button asChild>
          <Link href="/dashboard">Retour au tableau de bord</Link>
        </Button>
      </div>
    </div>
  );
}
