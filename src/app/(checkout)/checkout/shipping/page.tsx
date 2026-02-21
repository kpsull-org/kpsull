'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/stores/cart.store';
import {
  ShippingAddressForm,
  ShippingAddress,
} from '@/components/checkout/shipping-address-form';
import { CheckoutStepper } from '@/components/checkout/checkout-stepper';
import { CartSummary } from '@/components/checkout/cart-summary';

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
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);

  const items = useCartStore((state) => state.items);
  const getTotal = useCartStore((state) => state.getTotal);

  useEffect(() => {
    // Attendre que l'hydratation soit terminee
    const unsubFinishHydration = useCartStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // Si deja hydrate, mettre a jour immediatement
    if (useCartStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    // Load guest info from session storage
    const stored = sessionStorage.getItem('guestCheckout');
    if (stored) {
      setGuestInfo(JSON.parse(stored));
    }

    return () => {
      unsubFinishHydration();
    };
  }, []);

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);

  const handleSubmit = (address: ShippingAddress) => {
    setIsLoading(true);

    // Store shipping address for payment step
    sessionStorage.setItem('shippingAddress', JSON.stringify(address));

    // Navigate to carrier selection step
    router.push('/checkout/carrier');
  };

  // Attendre l'hydratation avant de rendre
  if (!isHydrated) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // Redirect if cart is empty
  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  return (
    <div className="container py-8">
      {/* Back link */}
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/checkout">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Link>
      </Button>

      <h1 className="text-3xl font-bold mb-8">Adresse de livraison</h1>

      {/* Stepper */}
      <div className="mb-8">
        <CheckoutStepper currentStep="shipping" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Shipping form */}
        <div className="lg:col-span-2">
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

        {/* Order summary */}
        <div className="lg:col-span-1">
          <CartSummary subtotal={getTotal()} formatPrice={formatPrice} />
        </div>
      </div>
    </div>
  );
}
