'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/lib/stores/cart.store';
import {
  ShippingAddressForm,
  ShippingAddress,
} from '@/components/checkout/shipping-address-form';
import { CheckoutStepper } from '@/components/checkout/checkout-stepper';
import { useCartHydration } from '@/lib/hooks/use-cart-hydration';

interface GuestInfo {
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * Shipping Address Page
 *
 * Story 7-4: Saisie adresse livraison
 *
 * Acceptance Criteria:
 * - AC1: Formulaire complet (nom, adresse, ville, code postal, pays)
 * - AC2: Validation cote client (code postal francais 5 chiffres)
 * - AC3: Pre-remplissage nom depuis guest checkout ou session
 * - AC4: Telephone optionnel pour livraison
 * - AC5: Sauvegarde pour etape suivante
 */
export default function ShippingPage() {
  const router = useRouter();
  const isHydrated = useCartHydration();
  const [isLoading, setIsLoading] = useState(false);
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);

  const items = useCartStore((state) => state.items);

  useEffect(() => {
    // Load guest info from session storage
    const stored = sessionStorage.getItem('guestCheckout');
    if (stored) {
      setGuestInfo(JSON.parse(stored));
    }
  }, []);

  const handleSubmit = (address: ShippingAddress) => {
    setIsLoading(true);

    // Store shipping address for payment step
    sessionStorage.setItem('shippingAddress', JSON.stringify(address));

    // Navigate to carrier selection step
    router.push('/checkout/carrier');
  };

  if (!isHydrated) {
    return (
      <div className="container py-8">
        <div className="space-y-4">
          <div className="h-4 w-32 bg-black/10 animate-pulse" />
          <div className="h-96 bg-black/5 animate-pulse" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  return (
    <div className="container py-8 font-sans">
      {/* Back link */}
      <div className="mb-8">
        <Link
          href="/checkout"
          className="inline-flex items-center gap-2 text-xs text-black/50 hover:text-black transition-colors tracking-wide"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-wider uppercase mb-8">
        Adresse de livraison
      </h1>

      {/* Stepper */}
      <div className="mb-10">
        <CheckoutStepper currentStep="shipping" />
      </div>

      <div className="max-w-xl mx-auto">
        <ShippingAddressForm
          initialData={
            guestInfo
              ? {
                  firstName: guestInfo.firstName,
                  lastName: guestInfo.lastName,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
