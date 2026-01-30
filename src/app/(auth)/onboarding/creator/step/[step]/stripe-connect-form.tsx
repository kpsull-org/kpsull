'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  CreditCard,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { createStripeAccount, checkStripeStatus } from './actions';

interface StripeConnectFormProps {
  stripeAccountId: string | null;
  isOnboarded: boolean;
}

type FormStatus = 'idle' | 'creating' | 'checking' | 'success' | 'error';

export function StripeConnectForm({
  stripeAccountId,
  isOnboarded,
}: StripeConnectFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<FormStatus>(isOnboarded ? 'success' : 'idle');
  const [error, setError] = useState<string | null>(null);

  // Check for return from Stripe
  const success = searchParams.get('success');
  const refresh = searchParams.get('refresh');

  useEffect(() => {
    if (success === 'true' && stripeAccountId && !isOnboarded) {
      // User returned from Stripe onboarding, check status
      handleCheckStatus();
    } else if (refresh === 'true' && stripeAccountId) {
      // User needs to resume onboarding
      setError('Votre session Stripe a expiré. Cliquez pour reprendre.');
    }
  }, [success, refresh, stripeAccountId, isOnboarded]);

  async function handleCheckStatus() {
    setStatus('checking');
    setError(null);

    try {
      const result = await checkStripeStatus();

      if (result.success && result.isOnboarded) {
        setStatus('success');
        router.refresh();
      } else if (result.success && !result.isOnboarded) {
        setError('Votre configuration Stripe n\'est pas encore terminée. Cliquez pour reprendre.');
        setStatus('idle');
      } else {
        setError(result.error ?? 'Erreur lors de la vérification');
        setStatus('error');
      }
    } catch {
      setError('Une erreur est survenue');
      setStatus('error');
    }
  }

  async function handleConnectStripe() {
    setStatus('creating');
    setError(null);

    try {
      const result = await createStripeAccount();

      if (result.success && result.onboardingUrl) {
        // Redirect to Stripe onboarding
        window.location.href = result.onboardingUrl;
      } else {
        setError(result.error ?? 'Erreur lors de la création du compte');
        setStatus('error');
      }
    } catch {
      setError('Une erreur est survenue');
      setStatus('error');
    }
  }

  function handleGoToComplete() {
    router.push('/onboarding/creator/complete');
    router.refresh();
  }

  // Success state
  if (status === 'success' || isOnboarded) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-900/20">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            <div>
              <h3 className="font-medium text-green-800 dark:text-green-300">
                Compte Stripe connecté !
              </h3>
              <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                Votre compte Stripe est configuré et prêt à recevoir des
                paiements. Vous pouvez maintenant accéder à votre tableau de bord créateur.
              </p>
              {stripeAccountId && (
                <p className="mt-2 text-xs text-green-600 dark:text-green-500">
                  ID du compte : {stripeAccountId}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-muted/50 p-4">
          <h4 className="text-sm font-medium">Félicitations !</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Vous avez terminé toutes les étapes d&apos;inscription créateur.
            Passez à l&apos;étape finale pour activer votre compte.
          </p>
        </div>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/onboarding/creator/step/2')}
          >
            Retour
          </Button>
          <Button onClick={handleGoToComplete}>
            Finaliser l&apos;inscription
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="rounded-lg border p-6">
        <div className="flex items-start gap-4">
          <CreditCard className="h-6 w-6 text-primary" />
          <div className="flex-1">
            <h3 className="font-medium">Configuration des paiements</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {stripeAccountId
                ? 'Reprenez la configuration de votre compte Stripe pour recevoir vos paiements.'
                : 'Connectez votre compte Stripe pour recevoir les paiements de vos ventes.'}
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="rounded-lg bg-muted/50 p-4">
        <h4 className="text-sm font-medium">Pourquoi Stripe ?</h4>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>• Paiements sécurisés et conformes aux normes PCI</li>
          <li>• Virements automatiques sur votre compte bancaire</li>
          <li>• Tableau de bord pour suivre vos revenus</li>
          <li>• Protection contre la fraude intégrée</li>
        </ul>
      </div>

      {/* Status Messages */}
      {status === 'checking' && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Vérification de votre compte Stripe...
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/onboarding/creator/step/2')}
          disabled={status === 'creating' || status === 'checking'}
        >
          Retour
        </Button>

        <Button
          onClick={handleConnectStripe}
          disabled={status === 'creating' || status === 'checking'}
        >
          {status === 'creating' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connexion...
            </>
          ) : stripeAccountId ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reprendre la configuration
            </>
          ) : (
            <>
              <ExternalLink className="mr-2 h-4 w-4" />
              Connecter Stripe
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
