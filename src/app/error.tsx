'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { ErrorDisplay } from '@/components/error';
import type { ErrorContext } from '@/components/error';

export default function ErrorPage({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const context: ErrorContext = {
    errorType: error.name || 'RuntimeError',
    message: error.message || 'Une erreur inattendue est survenue',
    technicalDetails: [
      `${error.name}: ${error.message}`,
      `Digest: ${error.digest || 'N/A'}`,
      error.stack ? `\nStack:\n${error.stack}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    url: typeof window !== 'undefined' ? window.location.href : '',
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
    digest: error.digest,
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">
        <ErrorDisplay
          title="Une erreur est survenue"
          description="L'application a rencontre un probleme inattendu. Vous pouvez reessayer ou signaler ce bug."
          context={context}
          showBackButton={true}
          showHomeButton={true}
          showRetryButton={true}
          onRetry={reset}
        />
      </div>
    </div>
  );
}
