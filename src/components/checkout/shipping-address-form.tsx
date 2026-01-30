'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
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

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  street: string;
  streetComplement?: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
}

interface ShippingAddressFormProps {
  initialData?: Partial<ShippingAddress>;
  onSubmit: (address: ShippingAddress) => void;
  isLoading?: boolean;
}

const POSTAL_CODE_REGEX = /^\d{5}$/;
const PHONE_REGEX = /^(\+33|0)[1-9](\d{2}){4}$/;

/**
 * ShippingAddressForm component
 *
 * Form for entering shipping address with French postal code validation.
 *
 * Story 7-4: Saisie adresse livraison
 */
export function ShippingAddressForm({
  initialData,
  onSubmit,
  isLoading = false,
}: ShippingAddressFormProps) {
  const [address, setAddress] = useState<ShippingAddress>({
    firstName: initialData?.firstName ?? '',
    lastName: initialData?.lastName ?? '',
    street: initialData?.street ?? '',
    streetComplement: initialData?.streetComplement ?? '',
    city: initialData?.city ?? '',
    postalCode: initialData?.postalCode ?? '',
    country: initialData?.country ?? 'France',
    phone: initialData?.phone ?? '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingAddress, string>> = {};

    if (!address.firstName.trim()) {
      newErrors.firstName = 'Prenom requis';
    }

    if (!address.lastName.trim()) {
      newErrors.lastName = 'Nom requis';
    }

    if (!address.street.trim()) {
      newErrors.street = 'Adresse requise';
    }

    if (!address.city.trim()) {
      newErrors.city = 'Ville requise';
    }

    if (!address.postalCode.trim()) {
      newErrors.postalCode = 'Code postal requis';
    } else if (!POSTAL_CODE_REGEX.test(address.postalCode)) {
      newErrors.postalCode = 'Code postal invalide (5 chiffres)';
    }

    if (address.phone && !PHONE_REGEX.test(address.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Numero de telephone invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(address);
    }
  };

  const updateField = (field: keyof ShippingAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Adresse de livraison
        </CardTitle>
        <CardDescription>
          Entrez l&apos;adresse ou vous souhaitez recevoir votre commande
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prenom *</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Jean"
                value={address.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Dupont"
                value={address.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Street address */}
          <div className="space-y-2">
            <Label htmlFor="street">Adresse *</Label>
            <Input
              id="street"
              type="text"
              placeholder="123 rue de la Paix"
              value={address.street}
              onChange={(e) => updateField('street', e.target.value)}
            />
            {errors.street && (
              <p className="text-sm text-destructive">{errors.street}</p>
            )}
          </div>

          {/* Street complement */}
          <div className="space-y-2">
            <Label htmlFor="streetComplement">
              Complement d&apos;adresse <span className="text-muted-foreground">(optionnel)</span>
            </Label>
            <Input
              id="streetComplement"
              type="text"
              placeholder="Appartement, batiment, etage..."
              value={address.streetComplement}
              onChange={(e) => updateField('streetComplement', e.target.value)}
            />
          </div>

          {/* City and postal code */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Code postal *</Label>
              <Input
                id="postalCode"
                type="text"
                placeholder="75001"
                maxLength={5}
                value={address.postalCode}
                onChange={(e) => updateField('postalCode', e.target.value.replace(/\D/g, ''))}
              />
              {errors.postalCode && (
                <p className="text-sm text-destructive">{errors.postalCode}</p>
              )}
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                type="text"
                placeholder="Paris"
                value={address.city}
                onChange={(e) => updateField('city', e.target.value)}
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city}</p>
              )}
            </div>
          </div>

          {/* Country (read-only for now - France only) */}
          <div className="space-y-2">
            <Label htmlFor="country">Pays</Label>
            <Input
              id="country"
              type="text"
              value={address.country}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Livraison disponible en France metropolitaine uniquement
            </p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              Telephone <span className="text-muted-foreground">(optionnel)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="06 12 34 56 78"
              value={address.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Pour vous contacter en cas de probleme de livraison
            </p>
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? 'Chargement...' : 'Continuer vers le paiement'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
