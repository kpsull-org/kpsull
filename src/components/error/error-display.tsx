'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';
import {
  AlertTriangle,
  Copy,
  Check,
  ArrowLeft,
  Home,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface ErrorContext {
  errorType: string;
  message: string;
  technicalDetails?: string;
  url?: string;
  timestamp: string;
  userAgent?: string;
  provider?: string;
  digest?: string;
}

export interface ErrorDisplayProps {
  title: string;
  description: string;
  context: ErrorContext;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  showRetryButton?: boolean;
  onRetry?: () => void;
}

function buildClipboardText(context: ErrorContext): string {
  return [
    `Type: ${context.errorType}`,
    `Message: ${context.message}`,
    context.url ? `URL: ${context.url}` : null,
    `Date: ${context.timestamp}`,
    context.provider ? `Provider: ${context.provider}` : null,
    context.digest ? `Digest: ${context.digest}` : null,
    context.userAgent ? `User Agent: ${context.userAgent}` : null,
    context.technicalDetails
      ? `\n--- Details techniques ---\n${context.technicalDetails}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');
}

export function ErrorDisplay({
  title,
  description,
  context,
  showBackButton = false,
  showHomeButton = false,
  showRetryButton = false,
  onRetry,
}: ErrorDisplayProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Sentry.captureException(new Error(context.message), {
      extra: {
        errorType: context.errorType,
        url: context.url,
        timestamp: context.timestamp,
        provider: context.provider,
        digest: context.digest,
        technicalDetails: context.technicalDetails,
      },
    });
  }, [context]);

  async function handleCopy() {
    const text = buildClipboardText(context);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="w-full border border-border bg-card shadow-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <CardTitle className="text-2xl font-semibold font-montserrat">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">{context.errorType}</span>
            {context.message && ` — ${context.message}`}
          </AlertDescription>
        </Alert>

        {context.technicalDetails && (
          <details className="group">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
              Details techniques
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-48 whitespace-pre-wrap break-words">
              {context.technicalDetails}
            </pre>
          </details>
        )}

        <div className="flex flex-wrap gap-2 justify-center pt-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? 'Copie !' : 'Copier les logs'}
          </Button>

          {showBackButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          )}

          {showRetryButton && onRetry && (
            <Button variant="default" size="sm" onClick={onRetry}>
              <RefreshCw className="h-4 w-4" />
              Reessayer
            </Button>
          )}

          {showHomeButton && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <Home className="h-4 w-4" />
                Accueil
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
