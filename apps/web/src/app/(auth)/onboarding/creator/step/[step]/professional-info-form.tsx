'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Building2, FileText, MapPin } from 'lucide-react';
import { submitProfessionalInfo } from './actions';

interface ProfessionalInfoFormProps {
  defaultValues: {
    brandName: string;
    siret: string;
    professionalAddress: string;
  };
}

export function ProfessionalInfoForm({
  defaultValues,
}: ProfessionalInfoFormProps) {
  const router = useRouter();
  const [brandName, setBrandName] = useState(defaultValues.brandName);
  const [siret, setSiret] = useState(defaultValues.siret);
  const [professionalAddress, setProfessionalAddress] = useState(
    defaultValues.professionalAddress
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await submitProfessionalInfo({
        brandName,
        siret,
        professionalAddress,
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
          />
          <p className="text-xs text-muted-foreground">
            Le nom qui apparaîtra sur votre boutique
          </p>
        </div>

        {/* SIRET */}
        <div className="space-y-2">
          <Label htmlFor="siret">
            <FileText className="mr-2 inline-block h-4 w-4" />
            Numéro SIRET
          </Label>
          <Input
            id="siret"
            type="text"
            placeholder="12345678901234"
            value={siret}
            onChange={(e) => setSiret(e.target.value.replace(/\D/g, '').slice(0, 14))}
            disabled={isLoading}
            required
            maxLength={14}
            pattern="[0-9]{14}"
          />
          <p className="text-xs text-muted-foreground">
            14 chiffres - sera vérifié à l&apos;étape suivante
          </p>
        </div>

        {/* Professional address */}
        <div className="space-y-2">
          <Label htmlFor="professionalAddress">
            <MapPin className="mr-2 inline-block h-4 w-4" />
            Adresse professionnelle
          </Label>
          <Input
            id="professionalAddress"
            type="text"
            placeholder="123 rue du Commerce, 75001 Paris"
            value={professionalAddress}
            onChange={(e) => setProfessionalAddress(e.target.value)}
            disabled={isLoading}
            required
          />
          <p className="text-xs text-muted-foreground">
            Adresse de votre siège social
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Submit button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
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
