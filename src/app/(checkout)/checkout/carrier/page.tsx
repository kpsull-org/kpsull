'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/lib/stores/cart.store';
import { useCartHydration } from '@/lib/hooks/use-cart-hydration';
import { CheckoutStepper } from '@/components/checkout/checkout-stepper';
import { CarrierSelector } from '@/components/checkout/carrier-selector';
import { RelayPointSelector } from '@/components/checkout/relay-point-selector';
import {
  CarrierSelectionSchema,
  ShippingAddressSchema,
  parseSessionStorage,
  storeSessionStorage,
  type CarrierSelection,
  type RelayPoint,
} from '@/lib/schemas/checkout.schema';

/**
 * Carrier Selection Page
 *
 * Étape de sélection du transporteur dans le checkout.
 * Propose Mondial Relay, Relais Colis et Chronopost.
 * Stocke le choix dans sessionStorage pour l'étape de paiement.
 */
export default function CarrierPage() {
  const router = useRouter();
  const isHydrated = useCartHydration();
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierSelection | null>(null);
  const [selectedRelayPoint, setSelectedRelayPoint] = useState<RelayPoint | null>(null);
  const [shippingPostalCode, setShippingPostalCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const isRelayCarrier = selectedCarrier?.carrier === 'mondial-relay';

  const items = useCartStore((state) => state.items);

  useEffect(() => {
    // Vérifier que l'adresse de livraison est présente
    const addressResult = parseSessionStorage('shippingAddress', ShippingAddressSchema);
    if (!addressResult.success) {
      router.push('/checkout/shipping');
      return;
    }
    setShippingPostalCode(addressResult.data.postalCode);

    // Restaurer le transporteur précédemment sélectionné si présent
    const carrierResult = parseSessionStorage('selectedCarrier', CarrierSelectionSchema);
    if (carrierResult.success) {
      setSelectedCarrier(carrierResult.data);
      if (carrierResult.data.relayPoint) {
        setSelectedRelayPoint(carrierResult.data.relayPoint);
      }
    }
  }, [router]);

  useEffect(() => {
    if (isHydrated && items.length === 0) {
      router.push('/cart');
    }
  }, [isHydrated, items.length, router]);

  const handleContinue = () => {
    if (!selectedCarrier) {
      setError('Veuillez sélectionner un transporteur pour continuer.');
      return;
    }

    if (isRelayCarrier && !selectedRelayPoint) {
      setError('Veuillez sélectionner un point relais pour continuer.');
      return;
    }

    const carrierData: CarrierSelection = {
      ...selectedCarrier,
      relayPoint: isRelayCarrier ? selectedRelayPoint ?? undefined : undefined,
    };

    const stored = storeSessionStorage('selectedCarrier', carrierData, CarrierSelectionSchema);
    if (!stored) {
      setError('Une erreur est survenue, veuillez réessayer.');
      return;
    }

    router.push('/checkout/payment');
  };

  if (!isHydrated) {
    return (
      <div className="container py-8">
        <div className="space-y-4">
          <div className="h-4 w-32 bg-black/10 animate-pulse" />
          <div className="h-64 bg-black/5 animate-pulse" />
        </div>
      </div>
    );
  }

  if (isHydrated && items.length === 0) {
    return null;
  }

  return (
    <div className="container py-8 font-sans">
      <div className="mb-8">
        <Link
          href="/checkout/shipping"
          className="inline-flex items-center gap-2 text-xs text-black/50 hover:text-black transition-colors tracking-wide"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-wider uppercase mb-8">Mode de livraison</h1>

      <div className="mb-10">
        <CheckoutStepper currentStep="carrier" />
      </div>

      <div className="max-w-xl">
        <div className="space-y-6">
          <div className="border border-black p-6">
            <h2 className="text-xs font-bold tracking-widest uppercase mb-1">
              Choisissez votre transporteur
            </h2>
            <p className="text-xs text-black/50 mb-6">
              Sélectionnez le mode de livraison adapté à vos besoins
            </p>

            {error && (
              <div className="mb-4 p-3 text-xs text-red-700 bg-red-50 border border-red-200">
                {error}
              </div>
            )}

            <CarrierSelector
              selectedCarrier={selectedCarrier}
              onChange={(carrier) => {
                setSelectedCarrier(carrier);
                setSelectedRelayPoint(null);
                setError(null);
              }}
            />

            {isRelayCarrier && selectedCarrier && (
              <div className="mt-6">
                <RelayPointSelector
                  initialPostalCode={shippingPostalCode}
                  selectedRelayPoint={selectedRelayPoint}
                  onSelect={(point) => {
                    setSelectedRelayPoint(point);
                    setError(null);
                  }}
                />
              </div>
            )}

            <button
              onClick={handleContinue}
              className="mt-6 w-full bg-black text-white text-xs font-bold tracking-widest uppercase py-4 hover:bg-black/90 transition-colors"
            >
              Continuer vers le paiement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
