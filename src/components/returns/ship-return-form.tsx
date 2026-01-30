'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, Package, Loader2, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface ShipReturnFormProps {
  returnId: string;
  orderNumber: string;
  returnAddress?: {
    name: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  onSubmit: (
    returnId: string,
    trackingNumber: string,
    carrier: string
  ) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
}

export interface ShipReturnFormData {
  trackingNumber: string;
  carrier: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const CARRIERS = [
  { value: 'colissimo', label: 'Colissimo' },
  { value: 'chronopost', label: 'Chronopost' },
  { value: 'mondial_relay', label: 'Mondial Relay' },
  { value: 'relais_colis', label: 'Relais Colis' },
  { value: 'ups', label: 'UPS' },
  { value: 'fedex', label: 'FedEx' },
  { value: 'dhl', label: 'DHL' },
  { value: 'gls', label: 'GLS' },
  { value: 'dpd', label: 'DPD' },
  { value: 'other', label: 'Autre transporteur' },
] as const;

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * ShipReturnForm Component
 *
 * Form for customers to add tracking information when shipping a return.
 * Includes carrier selection and tracking number input.
 */
export function ShipReturnForm({
  returnId,
  orderNumber,
  returnAddress,
  onSubmit,
  onCancel,
}: ShipReturnFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<ShipReturnFormData>({
    trackingNumber: '',
    carrier: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ShipReturnFormData, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ShipReturnFormData, string>> = {};

    if (!formData.carrier) {
      newErrors.carrier = 'Veuillez selectionner un transporteur';
    }

    if (!formData.trackingNumber.trim()) {
      newErrors.trackingNumber = 'Le numero de suivi est requis';
    } else if (formData.trackingNumber.trim().length < 5) {
      newErrors.trackingNumber = 'Le numero de suivi doit contenir au moins 5 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateField = (field: keyof ShipReturnFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    startTransition(async () => {
      const result = await onSubmit(
        returnId,
        formData.trackingNumber.trim(),
        formData.carrier
      );

      if (result.success) {
        router.refresh();
      } else {
        setSubmitError(result.error ?? "Une erreur s'est produite");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Expedier le retour
        </CardTitle>
        <CardDescription>
          Entrez les informations de suivi pour le retour de la commande {orderNumber}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Return address info */}
          {returnAddress && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Package className="h-4 w-4" />
                Adresse de retour
              </div>
              <div className="text-sm text-muted-foreground pl-6">
                <p>{returnAddress.name}</p>
                <p>{returnAddress.street}</p>
                <p>
                  {returnAddress.postalCode} {returnAddress.city}
                </p>
                <p>{returnAddress.country}</p>
              </div>
            </div>
          )}

          {/* Submit error */}
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Carrier selection */}
          <div className="space-y-2">
            <Label htmlFor="carrier">
              Transporteur <span className="text-destructive">*</span>
            </Label>
            <select
              id="carrier"
              value={formData.carrier}
              onChange={(e) => updateField('carrier', e.target.value)}
              disabled={isPending}
              className={cn(
                'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                errors.carrier && 'border-destructive'
              )}
            >
              <option value="">Selectionnez un transporteur</option>
              {CARRIERS.map((carrier) => (
                <option key={carrier.value} value={carrier.value}>
                  {carrier.label}
                </option>
              ))}
            </select>
            {errors.carrier && (
              <p className="text-sm text-destructive">{errors.carrier}</p>
            )}
          </div>

          {/* Tracking number */}
          <div className="space-y-2">
            <Label htmlFor="trackingNumber">
              Numero de suivi <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="trackingNumber"
                type="text"
                placeholder="Ex: 8V12345678901"
                value={formData.trackingNumber}
                onChange={(e) => updateField('trackingNumber', e.target.value)}
                disabled={isPending}
                className={cn('pl-10', errors.trackingNumber && 'border-destructive')}
              />
            </div>
            {errors.trackingNumber && (
              <p className="text-sm text-destructive">{errors.trackingNumber}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Le numero de suivi fourni par votre transporteur
            </p>
          </div>

          {/* Info box */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
            <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Informations importantes</p>
              <ul className="list-disc list-inside mt-1 space-y-1 text-blue-700">
                <li>Conservez votre preuve d&apos;envoi</li>
                <li>Emballez soigneusement le produit dans son emballage d&apos;origine si possible</li>
                <li>Le remboursement sera effectue apres reception et verification du produit</li>
              </ul>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex gap-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              Annuler
            </Button>
          )}
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Truck className="mr-2 h-4 w-4" />
                Confirmer l&apos;expedition
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
