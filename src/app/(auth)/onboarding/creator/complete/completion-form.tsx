'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  CheckCircle2,
  Store,
  Building2,
  MapPin,
  CreditCard,
  PartyPopper,
} from 'lucide-react';
import { activateCreatorAccount } from '../step/[step]/actions';

interface OnboardingCompletionFormProps {
  brandName: string;
  siret: string;
  address: string;
  stripeAccountId: string;
}

export function OnboardingCompletionForm({
  brandName,
  siret,
  address,
  stripeAccountId,
}: OnboardingCompletionFormProps) {
  const router = useRouter();
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format SIRET for display
  const formattedSiret = siret
    ? `${siret.slice(0, 3)} ${siret.slice(3, 6)} ${siret.slice(6, 9)} ${siret.slice(9, 14)}`
    : '';

  async function handleActivate() {
    setIsActivating(true);
    setError(null);

    try {
      const result = await activateCreatorAccount();

      if (result.success) {
        // Redirect to dashboard
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(result.error ?? 'Une erreur est survenue');
        setIsActivating(false);
      }
    } catch {
      setError('Une erreur est survenue');
      setIsActivating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-900 dark:bg-green-900/20">
        <PartyPopper className="mx-auto h-12 w-12 text-green-600 dark:text-green-400" />
        <h2 className="mt-4 text-xl font-semibold text-green-800 dark:text-green-300">
          Félicitations !
        </h2>
        <p className="mt-2 text-sm text-green-700 dark:text-green-400">
          Vous avez complété toutes les étapes d&apos;inscription.
          <br />
          Votre compte créateur est prêt à être activé.
        </p>
      </div>

      {/* Summary Card */}
      <div className="rounded-lg border p-6">
        <h3 className="mb-4 font-medium">Récapitulatif de vos informations</h3>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Store className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Nom de marque</p>
              <p className="text-sm text-muted-foreground">{brandName}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Building2 className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">SIRET</p>
              <p className="font-mono text-sm text-muted-foreground">
                {formattedSiret}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Adresse professionnelle</p>
              <p className="text-sm text-muted-foreground">{address}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CreditCard className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Compte Stripe</p>
              <p className="text-sm text-muted-foreground">
                <CheckCircle2 className="mr-1 inline h-4 w-4 text-green-500" />
                Configuré ({stripeAccountId.slice(0, 12)}...)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* What's Next */}
      <div className="rounded-lg bg-muted/50 p-4">
        <h4 className="text-sm font-medium">Ce qui vous attend</h4>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>• Accès à votre tableau de bord créateur</li>
          <li>• Création de vos premiers produits</li>
          <li>• Personnalisation de votre page boutique</li>
          <li>• Commencez à vendre dès maintenant !</li>
        </ul>
      </div>

      {/* Plan Info */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Plan FREE :</strong> Vous commencez avec le plan gratuit qui
          vous permet de créer jusqu&apos;à 5 produits et réaliser 10 ventes par
          mois. Vous pourrez passer au plan Pro à tout moment.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/onboarding/creator/step/3')}
          disabled={isActivating}
        >
          Retour
        </Button>

        <Button onClick={handleActivate} disabled={isActivating} size="lg">
          {isActivating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Activation en cours...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Activer mon compte créateur
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
