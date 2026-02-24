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
  readonly initialData?: Partial<ShippingAddress>;
  readonly onSubmit: (address: ShippingAddress) => void;
  readonly isLoading?: boolean;
}

const POSTAL_CODE_REGEX = /^\d{5}$/;
const PHONE_REGEX = /^(\+33|0)[1-9](\d{2}){4}$/;

const emptyAddress = (): ShippingAddress => ({
  firstName: '',
  lastName: '',
  street: '',
  streetComplement: '',
  city: '',
  postalCode: '',
  country: 'France',
  phone: '',
});

function validateAddress(addr: ShippingAddress): Partial<Record<keyof ShippingAddress, string>> {
  const errs: Partial<Record<keyof ShippingAddress, string>> = {};
  if (!addr.firstName.trim()) errs.firstName = 'Prénom requis';
  if (!addr.lastName.trim()) errs.lastName = 'Nom requis';
  if (!addr.street.trim()) errs.street = 'Adresse requise';
  if (!addr.city.trim()) errs.city = 'Ville requise';
  if (!addr.postalCode.trim()) {
    errs.postalCode = 'Code postal requis';
  } else if (!POSTAL_CODE_REGEX.test(addr.postalCode)) {
    errs.postalCode = 'Code postal invalide (5 chiffres)';
  }
  if (addr.phone && !PHONE_REGEX.test(addr.phone.replaceAll(' ', ''))) {
    errs.phone = 'Numéro de téléphone invalide';
  }
  return errs;
}

/**
 * ShippingAddressForm component
 *
 * Form for entering shipping address with French postal code validation.
 * Includes an optional separate billing address when addresses differ.
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

  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [billingAddress, setBillingAddress] = useState<ShippingAddress>(emptyAddress());
  const [billingErrors, setBillingErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const shippingErrs = validateAddress(address);
    setErrors(shippingErrs);

    let billingErrs: Partial<Record<keyof ShippingAddress, string>> = {};
    if (!sameAsBilling) {
      billingErrs = validateAddress(billingAddress);
      setBillingErrors(billingErrs);
    }

    if (Object.keys(shippingErrs).length > 0 || Object.keys(billingErrs).length > 0) return;

    const billing = sameAsBilling ? address : billingAddress;
    sessionStorage.setItem(
      'billingAddress',
      JSON.stringify({ ...billing, sameAsShipping: sameAsBilling })
    );

    onSubmit(address);
  };

  const updateField = (field: keyof ShippingAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const updateBillingField = (field: keyof ShippingAddress, value: string) => {
    setBillingAddress((prev) => ({ ...prev, [field]: value }));
    if (billingErrors[field]) setBillingErrors((prev) => ({ ...prev, [field]: undefined }));
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
            <label htmlFor="firstName" className={labelClass}>Prénom *</label>
            <input id="firstName" type="text" placeholder="Jean" value={address.firstName}
              onChange={(e) => updateField('firstName', e.target.value)} className={inputClass} />
            {errors.firstName && <p className={errorClass}>{errors.firstName}</p>}
          </div>
          <div>
            <label htmlFor="lastName" className={labelClass}>Nom *</label>
            <input id="lastName" type="text" placeholder="Dupont" value={address.lastName}
              onChange={(e) => updateField('lastName', e.target.value)} className={inputClass} />
            {errors.lastName && <p className={errorClass}>{errors.lastName}</p>}
          </div>
        </div>

        {/* Adresse */}
        <div>
          <label htmlFor="street" className={labelClass}>Adresse *</label>
          <input id="street" type="text" placeholder="123 rue de la Paix" value={address.street}
            onChange={(e) => updateField('street', e.target.value)} className={inputClass} />
          {errors.street && <p className={errorClass}>{errors.street}</p>}
        </div>

        {/* Complément */}
        <div>
          <label htmlFor="streetComplement" className={labelClass}>
            Complément{' '}
            <span className="font-normal text-black/40 normal-case tracking-normal">(optionnel)</span>
          </label>
          <input id="streetComplement" type="text" placeholder="Appartement, bâtiment, étage..."
            value={address.streetComplement}
            onChange={(e) => updateField('streetComplement', e.target.value)} className={inputClass} />
        </div>

        {/* Code postal / Ville */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="postalCode" className={labelClass}>Code postal *</label>
            <input id="postalCode" type="text" placeholder="75001" maxLength={5}
              value={address.postalCode}
              onChange={(e) => updateField('postalCode', e.target.value.replaceAll(/\D/gu, ''))}
              className={inputClass} />
            {errors.postalCode && <p className={errorClass}>{errors.postalCode}</p>}
          </div>
          <div className="col-span-2">
            <label htmlFor="city" className={labelClass}>Ville *</label>
            <input id="city" type="text" placeholder="Paris" value={address.city}
              onChange={(e) => updateField('city', e.target.value)} className={inputClass} />
            {errors.city && <p className={errorClass}>{errors.city}</p>}
          </div>
        </div>

        {/* Pays (read-only) */}
        <div>
          <label htmlFor="country" className={labelClass}>Pays</label>
          <input id="country" type="text" value={address.country} disabled className={inputClass} />
          <p className="text-xs text-black/40 mt-1">
            Livraison disponible en France métropolitaine uniquement
          </p>
        </div>

        {/* Téléphone */}
        <div>
          <label htmlFor="phone" className={labelClass}>
            Téléphone{' '}
            <span className="font-normal text-black/40 normal-case tracking-normal">(optionnel)</span>
          </label>
          <input id="phone" type="tel" placeholder="06 12 34 56 78" value={address.phone}
            onChange={(e) => updateField('phone', e.target.value)} className={inputClass} />
          {errors.phone && <p className={errorClass}>{errors.phone}</p>}
          <p className="text-xs text-black/40 mt-1">
            Pour vous contacter en cas de problème de livraison
          </p>
        </div>

        {/* ── Adresse de facturation ── */}
        <div className="border-t border-black/10 pt-4 mt-2">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sameAsBilling}
              onChange={(e) => setSameAsBilling(e.target.checked)}
              className="h-4 w-4 border border-black accent-black"
            />
            <span className="text-xs font-bold tracking-widest uppercase">
              Adresse de facturation identique à l&apos;adresse de livraison
            </span>
          </label>
        </div>

        {!sameAsBilling && (
          <div className="border border-black/20 p-4 space-y-4">
            <h3 className="text-xs font-bold tracking-widest uppercase">
              Adresse de facturation
            </h3>

            {/* Prénom / Nom facturation */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="billing-firstName" className={labelClass}>Prénom *</label>
                <input id="billing-firstName" type="text" placeholder="Jean"
                  value={billingAddress.firstName}
                  onChange={(e) => updateBillingField('firstName', e.target.value)}
                  className={inputClass} />
                {billingErrors.firstName && <p className={errorClass}>{billingErrors.firstName}</p>}
              </div>
              <div>
                <label htmlFor="billing-lastName" className={labelClass}>Nom *</label>
                <input id="billing-lastName" type="text" placeholder="Dupont"
                  value={billingAddress.lastName}
                  onChange={(e) => updateBillingField('lastName', e.target.value)}
                  className={inputClass} />
                {billingErrors.lastName && <p className={errorClass}>{billingErrors.lastName}</p>}
              </div>
            </div>

            {/* Adresse facturation */}
            <div>
              <label htmlFor="billing-street" className={labelClass}>Adresse *</label>
              <input id="billing-street" type="text" placeholder="123 rue de la Paix"
                value={billingAddress.street}
                onChange={(e) => updateBillingField('street', e.target.value)}
                className={inputClass} />
              {billingErrors.street && <p className={errorClass}>{billingErrors.street}</p>}
            </div>

            {/* Complément facturation */}
            <div>
              <label htmlFor="billing-streetComplement" className={labelClass}>
                Complément{' '}
                <span className="font-normal text-black/40 normal-case tracking-normal">(optionnel)</span>
              </label>
              <input id="billing-streetComplement" type="text"
                placeholder="Appartement, bâtiment, étage..."
                value={billingAddress.streetComplement}
                onChange={(e) => updateBillingField('streetComplement', e.target.value)}
                className={inputClass} />
            </div>

            {/* Code postal / Ville facturation */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="billing-postalCode" className={labelClass}>Code postal *</label>
                <input id="billing-postalCode" type="text" placeholder="75001" maxLength={5}
                  value={billingAddress.postalCode}
                  onChange={(e) => updateBillingField('postalCode', e.target.value.replaceAll(/\D/gu, ''))}
                  className={inputClass} />
                {billingErrors.postalCode && <p className={errorClass}>{billingErrors.postalCode}</p>}
              </div>
              <div className="col-span-2">
                <label htmlFor="billing-city" className={labelClass}>Ville *</label>
                <input id="billing-city" type="text" placeholder="Paris"
                  value={billingAddress.city}
                  onChange={(e) => updateBillingField('city', e.target.value)}
                  className={inputClass} />
                {billingErrors.city && <p className={errorClass}>{billingErrors.city}</p>}
              </div>
            </div>

            {/* Pays facturation (read-only) */}
            <div>
              <label htmlFor="billing-country" className={labelClass}>Pays</label>
              <input id="billing-country" type="text" value={billingAddress.country} disabled
                className={inputClass} />
            </div>
          </div>
        )}

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
