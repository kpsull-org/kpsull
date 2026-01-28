'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  MapPin,
  Briefcase,
  Calendar,
} from 'lucide-react';
import { verifySiret } from './actions';

interface CompanyInfo {
  companyName: string;
  legalForm?: string;
  address?: {
    street: string;
    postalCode: string;
    city: string;
  };
  activityCode?: string;
  activityLabel?: string;
  creationDate?: string;
}

interface SiretVerificationFormProps {
  siret: string;
  isVerified: boolean;
  brandName?: string;
}

type VerificationStatus =
  | 'pending'
  | 'verifying'
  | 'success'
  | 'pending_manual'
  | 'error';

export function SiretVerificationForm({
  siret,
  isVerified,
  brandName,
}: SiretVerificationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>(isVerified ? 'success' : 'pending');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  // Format SIRET for display
  const formattedSiret = siret
    ? `${siret.slice(0, 3)} ${siret.slice(3, 6)} ${siret.slice(6, 9)} ${siret.slice(9, 14)}`
    : '';

  async function handleVerify() {
    setIsLoading(true);
    setError(null);
    setVerificationStatus('verifying');

    try {
      const result = await verifySiret();

      if (result.success) {
        if (result.status === 'PENDING_MANUAL') {
          setVerificationStatus('pending_manual');
          setPendingMessage(
            result.message ||
              "L'API INSEE est temporairement indisponible. Votre SIRET sera vérifié manuellement."
          );
        } else {
          setVerificationStatus('success');
          if (result.companyInfo) {
            setCompanyInfo(result.companyInfo);
          }
        }
      } else if (result.error) {
        setError(result.error);
        setVerificationStatus('error');
      }
    } catch {
      setError('Une erreur est survenue lors de la vérification.');
      setVerificationStatus('error');
    } finally {
      setIsLoading(false);
    }
  }

  function handleContinue() {
    router.push('/onboarding/creator/step/3');
    router.refresh();
  }

  function handleRetry() {
    setError(null);
    setVerificationStatus('pending');
  }

  return (
    <div className="space-y-6">
      {/* SIRET Info Card */}
      <div className="rounded-lg border p-6">
        <div className="flex items-start gap-4">
          {verificationStatus === 'pending' && (
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
          )}
          {verificationStatus === 'verifying' && (
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          )}
          {verificationStatus === 'success' && (
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          )}
          {verificationStatus === 'pending_manual' && (
            <AlertTriangle className="h-6 w-6 text-orange-500" />
          )}
          {verificationStatus === 'error' && (
            <XCircle className="h-6 w-6 text-red-500" />
          )}

          <div className="flex-1">
            <h3 className="font-medium">Vérification du SIRET</h3>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-muted-foreground">
                Numéro SIRET :{' '}
                <span className="font-mono font-medium">{formattedSiret}</span>
              </p>
              {brandName && (
                <p className="text-sm text-muted-foreground">
                  Nom de marque : <span className="font-medium">{brandName}</span>
                </p>
              )}
            </div>

            {verificationStatus === 'success' && (
              <p className="mt-3 text-sm font-medium text-green-600">
                ✓ SIRET vérifié avec succès !
              </p>
            )}

            {verificationStatus === 'pending_manual' && (
              <p className="mt-3 text-sm text-orange-600">{pendingMessage}</p>
            )}

            {verificationStatus === 'error' && error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>
      </div>

      {/* Company Info Card - shown on success */}
      {companyInfo && verificationStatus === 'success' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-900/20">
          <h4 className="mb-4 font-medium text-green-800 dark:text-green-300">
            Informations de l&apos;entreprise
          </h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  {companyInfo.companyName}
                </p>
                {companyInfo.legalForm && (
                  <p className="text-xs text-green-700 dark:text-green-400">
                    Forme juridique : {companyInfo.legalForm}
                  </p>
                )}
              </div>
            </div>

            {companyInfo.address && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-green-600" />
                <p className="text-sm text-green-700 dark:text-green-400">
                  {companyInfo.address.street}
                  <br />
                  {companyInfo.address.postalCode} {companyInfo.address.city}
                </p>
              </div>
            )}

            {companyInfo.activityCode && (
              <div className="flex items-start gap-3">
                <Briefcase className="mt-0.5 h-4 w-4 text-green-600" />
                <p className="text-sm text-green-700 dark:text-green-400">
                  Code NAF : {companyInfo.activityCode}
                  {companyInfo.activityLabel && ` - ${companyInfo.activityLabel}`}
                </p>
              </div>
            )}

            {companyInfo.creationDate && (
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-green-600" />
                <p className="text-sm text-green-700 dark:text-green-400">
                  Créée le : {companyInfo.creationDate}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Card - shown when pending */}
      {verificationStatus === 'pending' && (
        <div className="rounded-lg bg-muted/50 p-4">
          <h4 className="text-sm font-medium">Comment ça marche ?</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Nous vérifions votre numéro SIRET auprès de l&apos;INSEE pour
            confirmer l&apos;existence et l&apos;activité de votre entreprise.
            Cette vérification est obligatoire pour vendre sur la plateforme.
          </p>
        </div>
      )}

      {/* Warning Card - shown when pending manual */}
      {verificationStatus === 'pending_manual' && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-900/20">
          <p className="text-sm text-orange-800 dark:text-orange-300">
            <strong>Note :</strong> Vous pouvez continuer le processus
            d&apos;inscription. Votre SIRET sera vérifié manuellement par notre
            équipe dans les 24-48h.
          </p>
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

        <div className="flex gap-2">
          {verificationStatus === 'error' && (
            <Button variant="outline" onClick={handleRetry} disabled={isLoading}>
              Réessayer
            </Button>
          )}

          {(verificationStatus === 'pending' ||
            verificationStatus === 'error') && (
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

          {(verificationStatus === 'success' ||
            verificationStatus === 'pending_manual') &&
            !isLoading && (
              <Button onClick={handleContinue}>Continuer</Button>
            )}
        </div>
      </div>
    </div>
  );
}
