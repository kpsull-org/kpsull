'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Building2,
  FileText,
  MapPin,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Briefcase,
  Calendar,
} from 'lucide-react';
import { submitProfessionalInfo, verifySiretInline } from './actions';
import type { InlineSiretResult } from './actions';
import { cn } from '@/lib/utils';

interface ProfessionalInfoFormProps {
  defaultValues: {
    brandName: string;
    siret: string;
    street: string;
    city: string;
    postalCode: string;
  };
}

interface ValidationState {
  isValid: boolean;
  error?: string;
}

type SiretApiStatus = 'idle' | 'checking' | 'recognized' | 'not-found' | 'error';

/**
 * Validates SIRET using Luhn algorithm
 */
function validateSiret(siret: string): ValidationState {
  const normalized = siret.replace(/[\s-]/g, '');

  if (!normalized) {
    return { isValid: false };
  }

  if (normalized.length !== 14) {
    return {
      isValid: false,
      error: `${normalized.length}/14 chiffres`,
    };
  }

  if (!/^\d{14}$/.test(normalized)) {
    return { isValid: false, error: 'Chiffres uniquement' };
  }

  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(normalized.charAt(i), 10);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  if (sum % 10 !== 0) {
    return { isValid: false, error: 'Numéro SIRET invalide' };
  }

  return { isValid: true };
}

/**
 * Validates French postal code (5 digits)
 */
function validatePostalCode(postalCode: string): ValidationState {
  if (!postalCode) {
    return { isValid: false };
  }

  if (!/^\d{5}$/.test(postalCode)) {
    return { isValid: false, error: '5 chiffres requis' };
  }

  return { isValid: true };
}

export function ProfessionalInfoForm({
  defaultValues,
}: ProfessionalInfoFormProps) {
  const router = useRouter();

  // Form state
  const [brandName, setBrandName] = useState(defaultValues.brandName);
  const [siret, setSiret] = useState(defaultValues.siret);
  const [street, setStreet] = useState(defaultValues.street);
  const [city, setCity] = useState(defaultValues.city);
  const [postalCode, setPostalCode] = useState(defaultValues.postalCode);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({
    siret: false,
    postalCode: false,
  });

  // SIRET API verification state
  const [siretApiStatus, setSiretApiStatus] = useState<SiretApiStatus>('idle');
  const [companyInfo, setCompanyInfo] = useState<InlineSiretResult['companyInfo'] | null>(null);
  const [siretApiError, setSiretApiError] = useState<string | null>(null);

  // Real-time validation
  const siretValidation = useMemo(() => validateSiret(siret), [siret]);
  const postalCodeValidation = useMemo(
    () => validatePostalCode(postalCode),
    [postalCode]
  );

  // Immediate SIRET verification when 14 valid digits are entered
  useEffect(() => {
    // Reset API state when SIRET changes
    setSiretApiStatus('idle');
    setCompanyInfo(null);
    setSiretApiError(null);

    // Only verify if format is valid (14 digits + Luhn OK)
    if (!siretValidation.isValid) {
      return;
    }

    let cancelled = false;

    async function verify() {
      setSiretApiStatus('checking');

      try {
        const result = await verifySiretInline(siret);
        if (cancelled) return;

        if (result.status === 'recognized') {
          setSiretApiStatus('recognized');
          setCompanyInfo(result.companyInfo ?? null);

          // Auto-fill form fields from API data
          if (result.companyInfo) {
            setBrandName(result.companyInfo.companyName);
            if (result.companyInfo.address) {
              setStreet(result.companyInfo.address.street);
              setCity(result.companyInfo.address.city);
              setPostalCode(result.companyInfo.address.postalCode);
            }
          }
        } else if (result.status === 'not-found') {
          setSiretApiStatus('not-found');
          setSiretApiError(result.error ?? 'SIRET non trouvé dans la base Sirene');
        } else {
          setSiretApiStatus('not-found');
          setSiretApiError(result.error ?? 'Impossible de vérifier ce SIRET');
        }
      } catch {
        if (!cancelled) {
          setSiretApiStatus('error');
          setSiretApiError('Erreur de connexion au service de vérification');
        }
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [siret, siretValidation.isValid]);

  // Format SIRET with spaces for display
  const formatSiret = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    const parts = [
      digits.slice(0, 3),
      digits.slice(3, 6),
      digits.slice(6, 9),
      digits.slice(9, 14),
    ].filter(Boolean);
    return parts.join(' ');
  }, []);

  const handleSiretChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, '').slice(0, 14);
      setSiret(raw);
    },
    []
  );

  // Handle paste: extract digits from pasted text and replace the whole field
  const handleSiretPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text');
      const raw = pasted.replace(/\D/g, '').slice(0, 14);
      setSiret(raw);
    },
    []
  );

  const handlePostalCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, '').slice(0, 5);
      setPostalCode(raw);
    },
    []
  );

  const handlePostalCodePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text');
      const raw = pasted.replace(/\D/g, '').slice(0, 5);
      setPostalCode(raw);
    },
    []
  );

  // Detect browser autofill: poll input values for changes not caught by onChange
  const siretInputRef = useRef<HTMLInputElement>(null);
  const postalCodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (siretInputRef.current) {
        const nativeValue = siretInputRef.current.value.replace(/\D/g, '');
        if (nativeValue !== siret && nativeValue.length > 0) {
          setSiret(nativeValue.slice(0, 14));
        }
      }
      if (postalCodeInputRef.current) {
        const nativeValue = postalCodeInputRef.current.value.replace(/\D/g, '');
        if (nativeValue !== postalCode && nativeValue.length > 0) {
          setPostalCode(nativeValue.slice(0, 5));
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [siret, postalCode]);

  const isFormValid = useMemo(() => {
    return (
      brandName.trim().length > 0 &&
      siretValidation.isValid &&
      street.trim().length > 0 &&
      city.trim().length > 0 &&
      postalCodeValidation.isValid
    );
  }, [brandName, siretValidation, street, city, postalCodeValidation]);

  // Determine SIRET input border color
  const siretBorderClass = useMemo(() => {
    if (siret.length !== 14) return '';
    if (!siretValidation.isValid) return 'border-red-500 focus-visible:ring-red-500';
    if (siretApiStatus === 'recognized') return 'border-green-500 focus-visible:ring-green-500';
    if (siretApiStatus === 'not-found' || siretApiStatus === 'error') return 'border-orange-500 focus-visible:ring-orange-500';
    return '';
  }, [siret.length, siretValidation.isValid, siretApiStatus]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const siretVerified = siretApiStatus === 'recognized';

    try {
      const result = await submitProfessionalInfo({
        brandName,
        siret,
        street,
        city,
        postalCode,
        siretVerifiedInline: siretVerified,
      });

      if (!result.success && result.error) {
        setError(result.error);
      } else {
        // Skip step 2 if SIRET verified inline, go directly to Stripe (step 3)
        const nextStep = siretVerified ? 3 : 2;
        router.push(`/onboarding/creator/step/${nextStep}`);
        router.refresh();
      }
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* SIRET first - triggers auto-fill */}
        <div className="space-y-2">
          <Label htmlFor="siret">
            <FileText className="mr-2 inline-block h-4 w-4" />
            Numéro SIRET
          </Label>
          <div className="relative">
            <Input
              ref={siretInputRef}
              id="siret"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="802 954 785 00028"
              value={formatSiret(siret)}
              onChange={handleSiretChange}
              onPaste={handleSiretPaste}
              onBlur={() => setTouched((t) => ({ ...t, siret: true }))}
              disabled={isLoading}
              required
              className={cn('pr-10', siretBorderClass)}
            />
            {siret.length > 0 && (
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                {siret.length < 14 ? (
                  <span className="text-xs text-muted-foreground">
                    {siret.length}/14
                  </span>
                ) : !siretValidation.isValid ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : siretApiStatus === 'checking' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : siretApiStatus === 'recognized' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : siretApiStatus === 'not-found' || siretApiStatus === 'error' ? (
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
          </div>

          {/* Validation messages */}
          {touched.siret && siretValidation.error && siret.length > 0 && (
            <p className="text-xs text-red-500">{siretValidation.error}</p>
          )}

          {/* API status messages */}
          {siretApiStatus === 'checking' && (
            <p className="text-xs text-muted-foreground">
              Vérification en cours auprès de la base Sirene...
            </p>
          )}
          {siretApiStatus === 'recognized' && (
            <p className="text-xs text-green-600">
              SIRET reconnu et actif
            </p>
          )}
          {siretApiStatus === 'not-found' && (
            <p className="text-xs text-orange-600">
              {siretApiError} (non bloquant, vérification manuelle possible)
            </p>
          )}
          {siretApiStatus === 'error' && (
            <p className="text-xs text-orange-600">
              {siretApiError} (non bloquant)
            </p>
          )}
          {siretApiStatus === 'idle' && siret.length === 0 && (
            <p className="text-xs text-muted-foreground">
              14 chiffres - vérifié automatiquement
            </p>
          )}
        </div>

        {/* Company info card - shown when SIRET is recognized (green) */}
        {siretApiStatus === 'recognized' && companyInfo && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
            <h4 className="mb-3 text-sm font-medium text-green-800 dark:text-green-300">
              Entreprise trouvée
            </h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Building2 className="mt-0.5 h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    {companyInfo.companyName}
                  </p>
                  {companyInfo.legalForm && (
                    <p className="text-xs text-green-700 dark:text-green-400">
                      {companyInfo.legalForm}
                    </p>
                  )}
                </div>
              </div>

              {companyInfo.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-green-600" />
                  <p className="text-xs text-green-700 dark:text-green-400">
                    {companyInfo.address.street && `${companyInfo.address.street}, `}
                    {companyInfo.address.postalCode} {companyInfo.address.city}
                  </p>
                </div>
              )}

              {companyInfo.activityCode && (
                <div className="flex items-start gap-2">
                  <Briefcase className="mt-0.5 h-4 w-4 text-green-600" />
                  <p className="text-xs text-green-700 dark:text-green-400">
                    NAF : {companyInfo.activityCode}
                    {companyInfo.activityLabel && ` - ${companyInfo.activityLabel}`}
                  </p>
                </div>
              )}

              {companyInfo.creationDate && (
                <div className="flex items-start gap-2">
                  <Calendar className="mt-0.5 h-4 w-4 text-green-600" />
                  <p className="text-xs text-green-700 dark:text-green-400">
                    Créée le {companyInfo.creationDate}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Warning card - shown when SIRET not found (orange) */}
        {(siretApiStatus === 'not-found' || siretApiStatus === 'error') && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-900/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
              <p className="text-xs text-orange-800 dark:text-orange-300">
                Ce SIRET n&apos;a pas pu être vérifié automatiquement.
                Vous pouvez continuer votre inscription, il sera vérifié manuellement par notre équipe.
              </p>
            </div>
          </div>
        )}

        {/* Brand name - auto-filled from API */}
        <div className="space-y-2">
          <Label htmlFor="brandName">
            <Building2 className="mr-2 inline-block h-4 w-4" />
            Nom de marque / Entreprise
          </Label>
          <Input
            id="brandName"
            type="text"
            placeholder="Ma Super Marque"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            disabled={isLoading}
            required
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            Le nom qui apparaîtra sur votre boutique
          </p>
        </div>

        {/* Professional address - structured fields */}
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="font-medium">Adresse professionnelle</span>
          </div>

          {/* Street */}
          <div className="space-y-2">
            <Label htmlFor="street">Rue</Label>
            <Input
              id="street"
              type="text"
              autoComplete="street-address"
              placeholder="10 rue de la Paix"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              disabled={isLoading}
              required
              maxLength={255}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Postal code with validation */}
            <div className="space-y-2">
              <Label htmlFor="postalCode">Code postal</Label>
              <div className="relative">
                <Input
                  ref={postalCodeInputRef}
                  id="postalCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="75001"
                  value={postalCode}
                  onChange={handlePostalCodeChange}
                  onPaste={handlePostalCodePaste}
                  onBlur={() => setTouched((t) => ({ ...t, postalCode: true }))}
                  disabled={isLoading}
                  required
                  className={cn(
                    'pr-10',
                    touched.postalCode &&
                      postalCode.length === 5 &&
                      (postalCodeValidation.isValid
                        ? 'border-green-500 focus-visible:ring-green-500'
                        : 'border-red-500 focus-visible:ring-red-500')
                  )}
                />
                {postalCode.length > 0 && postalCode.length === 5 && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    {postalCodeValidation.isValid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                type="text"
                autoComplete="address-level2"
                placeholder="Paris"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={isLoading}
                required
                maxLength={100}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Adresse de votre siège social (France uniquement)
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading || !isFormValid}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            'Continuer'
          )}
        </Button>
      </div>
    </form>
  );
}
