'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, CheckCircle2, ExternalLink } from 'lucide-react';

interface StripeConnectFormProps {
  stripeAccountId: string | null;
  isOnboarded: boolean;
}

export function StripeConnectForm({
  stripeAccountId,
  isOnboarded,
}: StripeConnectFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleConnectStripe() {
    setIsLoading(true);

    // TODO: Implement Stripe Connect OAuth flow in Story 2-4
    // For now, simulate a delay and show that this is coming soon
    setTimeout(() => {
      setIsLoading(false);
      alert(
        'La connexion Stripe sera disponible dans une prochaine version. Cette fonctionnalité est en cours de développement.'
      );
    }, 1000);
  }

  if (isOnboarded && stripeAccountId) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-900/20">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            <div>
              <h3 className="font-medium text-green-800 dark:text-green-300">
                Compte Stripe connecté
              </h3>
              <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                Votre compte Stripe est configuré et prêt à recevoir des
                paiements.
              </p>
              <p className="mt-2 text-xs text-green-600 dark:text-green-500">
                ID du compte : {stripeAccountId}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/onboarding/creator/step/2')}
          >
            Retour
          </Button>
          <Button onClick={() => router.push('/dashboard')}>
            Accéder au dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6">
        <div className="flex items-start gap-4">
          <CreditCard className="h-6 w-6 text-primary" />
          <div className="flex-1">
            <h3 className="font-medium">Configuration des paiements</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Connectez votre compte Stripe pour recevoir les paiements de vos
              ventes. Stripe est notre partenaire de paiement sécurisé.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 p-4">
        <h4 className="text-sm font-medium">Pourquoi Stripe ?</h4>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>• Paiements sécurisés et conformes aux normes PCI</li>
          <li>• Virements automatiques sur votre compte bancaire</li>
          <li>• Tableau de bord pour suivre vos revenus</li>
          <li>• Protection contre la fraude intégrée</li>
        </ul>
      </div>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          <strong>Note :</strong> La connexion Stripe sera activée
          prochainement. Vous pouvez continuer à explorer la plateforme en
          attendant.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/onboarding/creator/step/2')}
          disabled={isLoading}
        >
          Retour
        </Button>

        <Button onClick={handleConnectStripe} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connexion...
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
