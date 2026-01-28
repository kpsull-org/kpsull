'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { verifySiret } from './actions';

interface SiretVerificationFormProps {
  siret: string;
  isVerified: boolean;
}

export function SiretVerificationForm({
  siret,
  isVerified,
}: SiretVerificationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    'pending' | 'success' | 'error'
  >(isVerified ? 'success' : 'pending');

  async function handleVerify() {
    setIsLoading(true);
    setError(null);

    try {
      const result = await verifySiret();

      if (!result.success && result.error) {
        setError(result.error);
        setVerificationStatus('error');
      } else {
        setVerificationStatus('success');
        // Wait a moment to show success state, then redirect
        setTimeout(() => {
          router.push('/onboarding/creator/step/3');
          router.refresh();
        }, 1500);
      }
    } catch {
      setError('Une erreur est survenue lors de la vérification.');
      setVerificationStatus('error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6">
        <div className="flex items-start gap-4">
          {verificationStatus === 'pending' && (
            <AlertCircle className="h-6 w-6 text-yellow-500" />
          )}
          {verificationStatus === 'success' && (
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          )}
          {verificationStatus === 'error' && (
            <XCircle className="h-6 w-6 text-red-500" />
          )}

          <div className="flex-1">
            <h3 className="font-medium">Vérification du SIRET</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Numéro SIRET : <span className="font-mono">{siret}</span>
            </p>

            {verificationStatus === 'success' && (
              <p className="mt-2 text-sm text-green-600">
                SIRET vérifié avec succès !
              </p>
            )}

            {verificationStatus === 'error' && error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 p-4">
        <h4 className="text-sm font-medium">Comment ça marche ?</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          Nous vérifions votre numéro SIRET auprès de l&apos;INSEE pour
          confirmer l&apos;existence et l&apos;activité de votre entreprise.
          Cette vérification est obligatoire pour vendre sur la plateforme.
        </p>
      </div>

      {/* Error message */}
      {error && verificationStatus !== 'error' && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/onboarding/creator/step/1')}
          disabled={isLoading}
        >
          Retour
        </Button>

        {verificationStatus !== 'success' && (
          <Button onClick={handleVerify} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Vérification...
              </>
            ) : (
              'Vérifier le SIRET'
            )}
          </Button>
        )}

        {verificationStatus === 'success' && !isLoading && (
          <Button
            onClick={() => {
              router.push('/onboarding/creator/step/3');
              router.refresh();
            }}
          >
            Continuer
          </Button>
        )}
      </div>
    </div>
  );
}
