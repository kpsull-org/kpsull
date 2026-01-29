'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, Package } from 'lucide-react';
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

/**
 * Common carriers for shipping in France
 */
export const CARRIERS = [
  { value: 'colissimo', label: 'Colissimo' },
  { value: 'chronopost', label: 'Chronopost' },
  { value: 'mondial_relay', label: 'Mondial Relay' },
  { value: 'ups', label: 'UPS' },
  { value: 'fedex', label: 'FedEx' },
  { value: 'dhl', label: 'DHL' },
  { value: 'gls', label: 'GLS' },
  { value: 'dpd', label: 'DPD' },
  { value: 'other', label: 'Autre' },
] as const;

export type CarrierValue = (typeof CARRIERS)[number]['value'];

export interface ShippingFormData {
  trackingNumber: string;
  carrier: string;
}

interface ShippingFormProps {
  orderId: string;
  orderNumber: string;
  onSubmit: (data: ShippingFormData) => Promise<void>;
}

/**
 * ShippingForm component
 *
 * Form for entering shipping tracking information.
 *
 * Story 8-3: Expedition tracking
 *
 * Acceptance Criteria:
 * - AC1: Formulaire pour saisir numero de suivi et transporteur
 */
export function ShippingForm({ orderId, orderNumber, onSubmit }: ShippingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ShippingFormData>({
    trackingNumber: '',
    carrier: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingFormData, string>> = {};

    if (!formData.trackingNumber.trim()) {
      newErrors.trackingNumber = 'Le numero de suivi est requis';
    } else if (formData.trackingNumber.trim().length < 5) {
      newErrors.trackingNumber = 'Le numero de suivi doit contenir au moins 5 caracteres';
    }

    if (!formData.carrier.trim()) {
      newErrors.carrier = 'Le transporteur est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await onSubmit(formData);
      router.push(`/dashboard/orders/${orderId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof ShippingFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (error) {
      setError(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Expedier la commande
        </CardTitle>
        <CardDescription>
          Entrez les informations de suivi pour la commande {orderNumber}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Carrier selection */}
          <div className="space-y-2">
            <Label htmlFor="carrier">Transporteur *</Label>
            <select
              id="carrier"
              value={formData.carrier}
              onChange={(e) => updateField('carrier', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
            <Label htmlFor="trackingNumber">Numero de suivi *</Label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="trackingNumber"
                type="text"
                placeholder="Ex: 8V12345678901"
                value={formData.trackingNumber}
                onChange={(e) => updateField('trackingNumber', e.target.value)}
                className="pl-10"
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
          <Alert>
            <Truck className="h-4 w-4" />
            <AlertDescription>
              Une fois la commande marquee comme expediee, le client recevra une notification
              avec les informations de suivi.
            </AlertDescription>
          </Alert>
        </CardContent>

        <CardFooter className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? 'Expedition en cours...' : 'Confirmer expedition'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
