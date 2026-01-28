'use client';

import { useState, useCallback, useMemo } from 'react';
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
} from 'lucide-react';
import { submitProfessionalInfo } from './actions';
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

/**
 * Validates SIRET using Luhn algorithm
 */
function validateSiret(siret: string): ValidationState {
  // Remove spaces
  const normalized = siret.replace(/\s/g, '');

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

  // Luhn algorithm
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(normalized.charAt(i), 10);
    if (i % 2 === 1) {
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

  // Real-time validation
  const siretValidation = useMemo(() => validateSiret(siret), [siret]);
  const postalCodeValidation = useMemo(
    () => validatePostalCode(postalCode),
    [postalCode]
  );

  // Format SIRET with spaces for display
  const formatSiret = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    // Format: XXX XXX XXX XXXXX
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

  const handlePostalCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, '').slice(0, 5);
      setPostalCode(raw);
    },
    []
  );

  const isFormValid = useMemo(() => {
    return (
      brandName.trim().length > 0 &&
      siretValidation.isValid &&
      street.trim().length > 0 &&
      city.trim().length > 0 &&
      postalCodeValidation.isValid
    );
  }, [brandName, siretValidation, street, city, postalCodeValidation]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await submitProfessionalInfo({
        brandName,
        siret,
        street,
        city,
        postalCode,
      });

      if (!result.success && result.error) {
        setError(result.error);
      } else {
        router.push('/onboarding/creator/step/2');
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
        {/* Brand name */}
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

        {/* SIRET with real-time validation */}
        <div className="space-y-2">
          <Label htmlFor="siret">
            <FileText className="mr-2 inline-block h-4 w-4" />
            Numéro SIRET
          </Label>
          <div className="relative">
            <Input
              id="siret"
              type="text"
              placeholder="802 954 785 00028"
              value={formatSiret(siret)}
              onChange={handleSiretChange}
              onBlur={() => setTouched((t) => ({ ...t, siret: true }))}
              disabled={isLoading}
              required
              className={cn(
                'pr-10',
                touched.siret &&
                  siret.length === 14 &&
                  (siretValidation.isValid
                    ? 'border-green-500 focus-visible:ring-green-500'
                    : 'border-red-500 focus-visible:ring-red-500')
              )}
            />
            {siret.length > 0 && (
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                {siret.length === 14 && siretValidation.isValid ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : siret.length === 14 && !siretValidation.isValid ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {siret.length}/14
                  </span>
                )}
              </div>
            )}
          </div>
          {touched.siret && siretValidation.error && siret.length > 0 && (
            <p className="text-xs text-red-500">{siretValidation.error}</p>
          )}
          <p className="text-xs text-muted-foreground">
            14 chiffres - sera vérifié à l&apos;étape suivante
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
                  id="postalCode"
                  type="text"
                  placeholder="75001"
                  value={postalCode}
                  onChange={handlePostalCodeChange}
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
