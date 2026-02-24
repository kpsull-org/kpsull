'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';

interface GuestInfo {
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * CheckoutAuth component
 *
 * Allows users to either:
 * - Sign in with Google (preserves cart)
 * - Continue as guest with email and name
 */
export function CheckoutAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    email: '',
    firstName: '',
    lastName: '',
  });
  const [errors, setErrors] = useState<Partial<GuestInfo>>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,63}$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<GuestInfo> = {};

    if (!guestInfo.email) {
      newErrors.email = 'Email requis';
    } else if (!validateEmail(guestInfo.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!guestInfo.firstName.trim()) newErrors.firstName = 'Prenom requis';
    if (!guestInfo.lastName.trim()) newErrors.lastName = 'Nom requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGuestCheckout = () => {
    if (!validateForm()) return;

    setIsLoading(true);

    // Store guest info in session storage for checkout
    sessionStorage.setItem('guestCheckout', JSON.stringify(guestInfo));

    // Navigate to shipping step
    router.push('/checkout/shipping');
  };

  const inputClass =
    'w-full border border-black px-3 py-2.5 text-sm outline-none focus:ring-0 bg-white placeholder:text-black/30';

  return (
    <div className="max-w-md mx-auto font-sans space-y-8">
      {/* Google Sign In */}
      <div className="border border-black p-6 space-y-4">
        <div>
          <h2 className="text-xs font-bold tracking-widest uppercase mb-1">Se connecter</h2>
          <p className="text-xs text-black/50">
            Retrouvez vos commandes et suivez vos livraisons
          </p>
        </div>
        <GoogleSignInButton mode="signin" callbackUrl="/checkout" />
        <p className="text-xs text-black/40 text-center">
          Votre panier sera conservé après la connexion
        </p>
      </div>

      {/* Separator */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-black/10" />
        <span className="text-xs uppercase tracking-widest text-black/40">Ou</span>
        <div className="flex-1 h-px bg-black/10" />
      </div>

      {/* Guest form */}
      <div className="border border-black p-6 space-y-5">
        <div>
          <h2 className="text-xs font-bold tracking-widest uppercase mb-1">
            Commander en tant qu&apos;invité
          </h2>
          <p className="text-xs text-black/50">Pas de compte nécessaire pour passer commande</p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold tracking-widest uppercase mb-1.5"
            >
              Email *
            </label>
            <input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={guestInfo.email}
              onChange={(e) => setGuestInfo((prev) => ({ ...prev, email: e.target.value }))}
              className={inputClass}
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-xs font-bold tracking-widest uppercase mb-1.5"
              >
                Prénom *
              </label>
              <input
                id="firstName"
                type="text"
                placeholder="Jean"
                value={guestInfo.firstName}
                onChange={(e) => setGuestInfo((prev) => ({ ...prev, firstName: e.target.value }))}
                className={inputClass}
              />
              {errors.firstName && (
                <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-xs font-bold tracking-widest uppercase mb-1.5"
              >
                Nom *
              </label>
              <input
                id="lastName"
                type="text"
                placeholder="Dupont"
                value={guestInfo.lastName}
                onChange={(e) => setGuestInfo((prev) => ({ ...prev, lastName: e.target.value }))}
                className={inputClass}
              />
              {errors.lastName && (
                <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleGuestCheckout}
          disabled={isLoading}
          className="w-full bg-black text-white text-xs font-bold tracking-widest uppercase py-4 hover:bg-black/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Chargement...' : 'Continuer'}
        </button>
      </div>

      <p className="text-xs text-center text-black/40">
        En continuant, vous acceptez nos conditions générales de vente et notre politique de
        confidentialité.
      </p>
    </div>
  );
}
