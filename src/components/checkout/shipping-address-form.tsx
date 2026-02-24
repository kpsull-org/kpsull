'use client';

import { useState } from 'react';

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

    if (!address.firstName.trim()) newErrors.firstName = 'Prénom requis';
    if (!address.lastName.trim()) newErrors.lastName = 'Nom requis';
    if (!address.street.trim()) newErrors.street = 'Adresse requise';
    if (!address.city.trim()) newErrors.city = 'Ville requise';

    if (!address.postalCode.trim()) {
      newErrors.postalCode = 'Code postal requis';
    } else if (!POSTAL_CODE_REGEX.test(address.postalCode)) {
      newErrors.postalCode = 'Code postal invalide (5 chiffres)';
    }

    if (address.phone && !PHONE_REGEX.test(address.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Numéro de téléphone invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) onSubmit(address);
  };

  const updateField = (field: keyof ShippingAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const inputClass =
    'w-full border border-black px-3 py-2.5 text-sm outline-none focus:ring-0 bg-white placeholder:text-black/30 disabled:bg-black/5 disabled:text-black/40';
  const labelClass = 'block text-xs font-bold tracking-widest uppercase mb-1.5 font-sans';
  const errorClass = 'text-xs text-red-600 mt-1';

  return (
    <div className="border border-black p-6 font-sans">
      <h2 className="text-xs font-bold tracking-widest uppercase mb-6">
        Adresse de livraison
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Prénom / Nom */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className={labelClass}>
              Prénom *
            </label>
            <input
              id="firstName"
              type="text"
              placeholder="Jean"
              value={address.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              className={inputClass}
            />
            {errors.firstName && <p className={errorClass}>{errors.firstName}</p>}
          </div>

          <div>
            <label htmlFor="lastName" className={labelClass}>
              Nom *
            </label>
            <input
              id="lastName"
              type="text"
              placeholder="Dupont"
              value={address.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              className={inputClass}
            />
            {errors.lastName && <p className={errorClass}>{errors.lastName}</p>}
          </div>
        </div>

        {/* Adresse */}
        <div>
          <label htmlFor="street" className={labelClass}>
            Adresse *
          </label>
          <input
            id="street"
            type="text"
            placeholder="123 rue de la Paix"
            value={address.street}
            onChange={(e) => updateField('street', e.target.value)}
            className={inputClass}
          />
          {errors.street && <p className={errorClass}>{errors.street}</p>}
        </div>

        {/* Complément */}
        <div>
          <label htmlFor="streetComplement" className={labelClass}>
            Complément{' '}
            <span className="font-normal text-black/40 normal-case tracking-normal">
              (optionnel)
            </span>
          </label>
          <input
            id="streetComplement"
            type="text"
            placeholder="Appartement, bâtiment, étage..."
            value={address.streetComplement}
            onChange={(e) => updateField('streetComplement', e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Code postal / Ville */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="postalCode" className={labelClass}>
              Code postal *
            </label>
            <input
              id="postalCode"
              type="text"
              placeholder="75001"
              maxLength={5}
              value={address.postalCode}
              onChange={(e) => updateField('postalCode', e.target.value.replace(/\D/g, ''))}
              className={inputClass}
            />
            {errors.postalCode && <p className={errorClass}>{errors.postalCode}</p>}
          </div>

          <div className="col-span-2">
            <label htmlFor="city" className={labelClass}>
              Ville *
            </label>
            <input
              id="city"
              type="text"
              placeholder="Paris"
              value={address.city}
              onChange={(e) => updateField('city', e.target.value)}
              className={inputClass}
            />
            {errors.city && <p className={errorClass}>{errors.city}</p>}
          </div>
        </div>

        {/* Pays (read-only) */}
        <div>
          <label htmlFor="country" className={labelClass}>
            Pays
          </label>
          <input
            id="country"
            type="text"
            value={address.country}
            disabled
            className={inputClass}
          />
          <p className="text-xs text-black/40 mt-1">
            Livraison disponible en France métropolitaine uniquement
          </p>
        </div>

        {/* Téléphone */}
        <div>
          <label htmlFor="phone" className={labelClass}>
            Téléphone{' '}
            <span className="font-normal text-black/40 normal-case tracking-normal">
              (optionnel)
            </span>
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="06 12 34 56 78"
            value={address.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className={inputClass}
          />
          {errors.phone && <p className={errorClass}>{errors.phone}</p>}
          <p className="text-xs text-black/40 mt-1">
            Pour vous contacter en cas de problème de livraison
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-black text-white text-xs font-bold tracking-widest uppercase py-4 mt-2 hover:bg-black/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Chargement...' : 'Continuer vers le transporteur'}
        </button>
      </form>
    </div>
  );
}
