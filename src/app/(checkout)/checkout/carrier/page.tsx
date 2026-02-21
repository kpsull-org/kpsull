'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCartStore } from '@/lib/stores/cart.store';
import { CheckoutStepper } from '@/components/checkout/checkout-stepper';
import { CartSummary } from '@/components/checkout/cart-summary';
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
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierSelection | null>(null);
  const [selectedRelayPoint, setSelectedRelayPoint] = useState<RelayPoint | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isRelayCarrier = (
    selectedCarrier?.carrier === 'mondial-relay' ||
    selectedCarrier?.carrier === 'relais-colis' ||
    selectedCarrier?.carrier === 'chronopost-pickup' ||
    selectedCarrier?.carrier === 'chronopost-shop2shop'
  );

  const items = useCartStore((state) => state.items);
  const getTotal = useCartStore((state) => state.getTotal);

  useEffect(() => {
    const unsubFinishHydration = useCartStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    if (useCartStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    // Vérifier que l'adresse de livraison est présente
    const addressResult = parseSessionStorage('shippingAddress', ShippingAddressSchema);
    if (!addressResult.success) {
      router.push('/checkout/shipping');
      return;
    }

    // Restaurer le transporteur précédemment sélectionné si présent
    const carrierResult = parseSessionStorage('selectedCarrier', CarrierSelectionSchema);
    if (carrierResult.success) {
      setSelectedCarrier(carrierResult.data);
      if (carrierResult.data.relayPoint) {
        setSelectedRelayPoint(carrierResult.data.relayPoint);
      }
    }

    return () => {
      unsubFinishHydration();
    };
  }, [router]);

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);

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
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  return (
    <div className="container py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/checkout/shipping">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Link>
      </Button>

      <h1 className="text-3xl font-bold mb-8">Mode de livraison</h1>

      <div className="mb-8">
        <CheckoutStepper currentStep="carrier" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-sans">Choisissez votre transporteur</CardTitle>
              <CardDescription className="font-sans">
                Sélectionnez le mode de livraison adapté à vos besoins
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
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
                <RelayPointSelector
                  carrierName={selectedCarrier.carrierName}
                  selectedRelayPoint={selectedRelayPoint}
                  onSelect={(point) => {
                    setSelectedRelayPoint(point);
                    setError(null);
                  }}
                />
              )}
            </CardContent>

            <CardFooter>
              <Button onClick={handleContinue} className="w-full" size="lg">
                Continuer vers le paiement
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <CartSummary
            subtotal={getTotal()}
            shippingEstimate={selectedCarrier?.price}
            formatPrice={formatPrice}
          />
        </div>
      </div>
    </div>
  );
}
