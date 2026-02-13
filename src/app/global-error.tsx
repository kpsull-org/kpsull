'use client';

import * as Sentry from '@sentry/nextjs';
import '@/app/globals.css';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  Sentry.captureException(error);

  const errorText = [
    `${error.name}: ${error.message}`,
    error.digest ? `Digest: ${error.digest}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <html lang="fr">
      <body className="antialiased bg-background text-foreground">
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-destructive"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>

            <h1 className="text-2xl font-semibold mb-2">Erreur critique</h1>
            <p className="text-muted-foreground mb-6">
              L&apos;application a rencontre une erreur critique. Veuillez
              rafraichir la page.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground h-10 px-4 text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Reessayer
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-lg border border-input bg-background h-10 px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Accueil
              </a>
            </div>

            <details className="mt-6 text-left">
              <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Details techniques
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40 whitespace-pre-wrap break-words">
                {errorText}
              </pre>
              <button
                onClick={() => navigator.clipboard.writeText(errorText)}
                className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors underline"
              >
                Copier les logs
              </button>
            </details>
          </div>
        </div>
      </body>
    </html>
  );
}
