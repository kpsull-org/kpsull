'use client';

import Link from 'next/link';
import { ErrorDisplay } from '@/components/error';
import type { ErrorContext } from '@/components/error';

interface AuthErrorContentProps {
  errorCode: string;
  title: string;
  description: string;
}

function detectProvider(errorCode: string): string | undefined {
  const oauthCodes = [
    'OAuthSignin',
    'OAuthCallback',
    'OAuthCreateAccount',
    'OAuthAccountNotLinked',
  ];
  if (oauthCodes.includes(errorCode)) return 'google';
  if (errorCode === 'CredentialsSignin') return 'credentials';
  return undefined;
}

export function AuthErrorContent({
  errorCode,
  title,
  description,
}: AuthErrorContentProps) {
  const context: ErrorContext = {
    errorType: errorCode,
    message: description,
    url: typeof window !== 'undefined' ? window.location.href : '',
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
    provider: detectProvider(errorCode),
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <ErrorDisplay
        title={title}
        description={description}
        context={context}
        showBackButton={true}
        showHomeButton={true}
      />

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="text-primary underline-offset-4 hover:underline font-medium"
        >
          Retour a la connexion
        </Link>
      </p>
    </div>
  );
}
