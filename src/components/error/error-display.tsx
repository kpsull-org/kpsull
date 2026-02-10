'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  Copy,
  Check,
  ArrowLeft,
  Bug,
  Home,
  RefreshCw,
  Loader2,
  ExternalLink,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { sanitizeErrorDetails } from '@/lib/utils/error-sanitizer';

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
  const sanitized = sanitizeErrorDetails(
    [
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
      .join('\n')
  );
  return sanitized;
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
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportStatus, setReportStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [issueUrl, setIssueUrl] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  async function handleCopy() {
    const text = buildClipboardText(context);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleReport() {
    setReportStatus('loading');
    setReportError(null);

    try {
      const response = await fetch('/api/error/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      });

      const data = await response.json();

      if (!response.ok) {
        setReportStatus('error');
        setReportError(data.error || 'Erreur lors de la creation du ticket');
        return;
      }

      setReportStatus('success');
      setIssueUrl(data.issueUrl);
    } catch {
      setReportStatus('error');
      setReportError('Impossible de contacter le serveur');
    }
  }

  const sanitizedDetails = context.technicalDetails
    ? sanitizeErrorDetails(context.technicalDetails)
    : null;

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

        {sanitizedDetails && (
          <details className="group">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
              Details techniques
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-48 whitespace-pre-wrap break-words">
              {sanitizedDetails}
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

        <div className="flex justify-center pt-2">
          <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/5"
              >
                <Bug className="h-4 w-4" />
                Signaler un bug
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Signaler ce bug</DialogTitle>
                <DialogDescription>
                  Un ticket sera cree automatiquement sur GitHub avec les
                  informations de cette erreur (donnees sensibles masquees).
                </DialogDescription>
              </DialogHeader>

              {reportStatus === 'success' && issueUrl ? (
                <div className="space-y-3">
                  <Alert variant="success">
                    <Check className="h-4 w-4" />
                    <AlertDescription>
                      Ticket cree avec succes !
                    </AlertDescription>
                  </Alert>
                  <a
                    href={issueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Voir le ticket sur GitHub
                  </a>
                </div>
              ) : (
                <>
                  <div className="rounded-lg bg-muted p-3 text-xs space-y-1">
                    <p>
                      <span className="font-medium">Type :</span>{' '}
                      {context.errorType}
                    </p>
                    <p>
                      <span className="font-medium">Message :</span>{' '}
                      {context.message}
                    </p>
                    {context.url && (
                      <p>
                        <span className="font-medium">URL :</span>{' '}
                        {context.url}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Date :</span>{' '}
                      {context.timestamp}
                    </p>
                  </div>

                  {reportStatus === 'error' && reportError && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{reportError}</AlertDescription>
                    </Alert>
                  )}

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setReportDialogOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleReport}
                      disabled={reportStatus === 'loading'}
                    >
                      {reportStatus === 'loading' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Bug className="h-4 w-4" />
                      )}
                      Confirmer
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
