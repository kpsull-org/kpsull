'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCartStore } from '@/lib/stores/cart.store';
import { useCartHydration } from '@/lib/hooks/use-cart-hydration';
import { getCartAction } from '@/app/cart/actions';
import { CheckoutStepper } from '@/components/checkout/checkout-stepper';
import {
  ShippingAddressSchema,
  CarrierSelectionSchema,
  parseSessionStorage,
  type ShippingAddress,
  type CarrierSelection,
} from '@/lib/schemas/checkout.schema';
import { stripePromise } from '@/lib/stripe/publishable';

/**
 * Payment Page
 *
 * Story 3.3: Intégration Stripe Elements
 *
 * Acceptance Criteria:
 * - AC1: Appel /api/checkout/create-session au chargement
 * - AC2: Affiche Stripe Elements (PaymentElement)
 * - AC3: Gestion des erreurs de paiement
 * - AC4: Redirection vers confirmation après paiement réussi
 */
export default function PaymentPage() {
  const router = useRouter();
  const isHydrated = useCartHydration();
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierSelection | null>(null);
  // cartChecked: true une fois qu'on a confirmé le contenu du panier (localStorage + éventuel DB)
  const [cartChecked, setCartChecked] = useState(false);

  const items = useCartStore((state) => state.items);
  const getTotal = useCartStore((state) => state.getTotal);
  // getTotal est utilisé dans CheckoutForm via le total passé en prop

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);

  useEffect(() => {
    const addressResult = parseSessionStorage('shippingAddress', ShippingAddressSchema);
    if (addressResult.success) {
      setShippingAddress(addressResult.data);
    } else if (addressResult.error) {
      console.warn('Invalid shipping address in sessionStorage:', addressResult.error.issues);
      router.push('/checkout/shipping');
      return;
    }

    const carrierResult = parseSessionStorage('selectedCarrier', CarrierSelectionSchema);
    if (carrierResult.success) {
      setSelectedCarrier(carrierResult.data);
    } else if (carrierResult.error) {
      router.push('/checkout/carrier');
    }
  }, [router]);

  useEffect(() => {
    if (!shippingAddress || !selectedCarrier) return;

    const shippingMode = selectedCarrier.relayPoint ? 'RELAY_POINT' : 'HOME_DELIVERY';

    setIsSessionLoading(true);
    setSessionError(null);

    // Les items sont envoyés en fallback si le cart DB est vide
    // (peut arriver si saveCartAction a échoué pour une contrainte FK)
    const currentItems = useCartStore.getState().items;

    fetch('/api/checkout/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shippingAddress,
        carrier: selectedCarrier,
        shippingMode,
        items: currentItems,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            (body as { error?: string }).error ?? 'Erreur lors de la création de la session'
          );
        }
        return res.json() as Promise<{ clientSecret: string; orderId: string }>;
      })
      .then(({ clientSecret: secret, orderId: id }) => {
        setClientSecret(secret);
        setOrderId(id);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Erreur inattendue';
        setSessionError(message);
      })
      .finally(() => {
        setIsSessionLoading(false);
      });
  }, [shippingAddress, selectedCarrier]);

  // Fallback DB : si le localStorage est vide après hydration (user authentifié dont le panier
  // est en DB), on tente un getCartAction() avant de rediriger vers /cart.
  useEffect(() => {
    if (!isHydrated) return;
    if (items.length > 0) {
      setCartChecked(true);
      return;
    }
    // items vides : peut-être user authentifié avec panier uniquement en DB
    getCartAction()
      .then((dbItems) => {
        if (dbItems.length > 0) {
          useCartStore.getState().replaceItems(dbItems);
        }
      })
      .catch(() => { /* localStorage reste vide → redirect dans le rendu */ })
      .finally(() => setCartChecked(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  if (!isHydrated || !cartChecked) {
    return (
      <div className="container py-8">
        <div className="space-y-4">
          <div className="h-4 w-32 bg-black/10 animate-pulse" />
          <div className="h-96 bg-black/5 animate-pulse" />
        </div>
      </div>
    );
  }

  // Rediriger uniquement si DB + localStorage confirment tous deux un panier vide.
  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  return (
    <div className="container py-8 font-sans">
      <div className="mb-8">
        <Link
          href="/checkout/carrier"
          className="inline-flex items-center gap-2 text-xs text-black/50 hover:text-black transition-colors tracking-wide"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-wider uppercase mb-8">Paiement</h1>

      <div className="mb-10">
        <CheckoutStepper currentStep="payment" />
      </div>

      <div className="max-w-xl mx-auto space-y-4">
          <div className="border border-black p-6">
            <h2 className="text-xs font-bold tracking-widest uppercase mb-1">
              Informations de paiement
            </h2>
            <p className="text-xs text-black/50 mb-6">
              Vos informations de paiement sont sécurisées
            </p>

            {/* Error state */}
            {sessionError && (
              <div className="mb-4 p-4 border border-red-300 bg-red-50 text-xs">
                {sessionError.includes('authentifi') || sessionError.includes('401') ? (
                  <>
                    <p className="font-bold mb-2">
                      Vous devez être connecté pour finaliser votre commande.
                    </p>
                    <Link
                      href="/login?callbackUrl=/checkout/shipping"
                      className="inline-block bg-black text-white px-4 py-2 text-xs font-bold tracking-widest uppercase hover:bg-black/90 transition-colors"
                    >
                      Se connecter
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="mb-2">{sessionError}</p>
                    <Link
                      href="/checkout/carrier"
                      className="inline-block border border-black px-4 py-2 text-xs font-bold tracking-widest uppercase hover:bg-black hover:text-white transition-colors"
                    >
                      Retour
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Loading state */}
            {isSessionLoading && (
              <div className="space-y-3">
                <div className="h-10 bg-black/5 animate-pulse" />
                <div className="h-10 bg-black/5 animate-pulse" />
                <div className="h-10 w-1/2 bg-black/5 animate-pulse" />
              </div>
            )}

            {/* Stripe Elements */}
            {clientSecret && orderId && !isSessionLoading && (
              <Elements stripe={stripePromise} options={{ clientSecret, locale: 'fr' }}>
                <CheckoutForm
                  orderId={orderId}
                  formatPrice={formatPrice}
                  total={getTotal() + (selectedCarrier?.price ?? 0)}
                />
              </Elements>
            )}

            {/* Security badge */}
            <div className="mt-6 flex items-start gap-3 p-4 bg-black/5">
              <ShieldCheck className="h-4 w-4 text-kpsull-green mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-bold tracking-wide">Paiement sécurisé</p>
                <p className="text-black/50 mt-0.5">
                  Vos informations sont chiffrées et sécurisées par Stripe. Les fonds seront
                  libérés au vendeur 48h après livraison confirmée.
                </p>
              </div>
            </div>
          </div>

          {/* Recap livraison */}
          <div className="border border-black/20 p-4 space-y-3 text-xs">
            {selectedCarrier && (
              <div>
                <p className="font-bold uppercase tracking-wide text-[10px] text-black/40 mb-1">
                  Transporteur
                </p>
                <p className="font-medium">{selectedCarrier.carrierName}</p>
                <p className="text-black/50">{selectedCarrier.estimatedDays}</p>
                <p className="text-black/50">{formatPrice(selectedCarrier.price)} de frais de port</p>
                {selectedCarrier.relayPoint && (
                  <p className="text-black/50 mt-0.5">
                    Point relais : {selectedCarrier.relayPoint.name},{' '}
                    {selectedCarrier.relayPoint.address},{' '}
                    {selectedCarrier.relayPoint.postalCode} {selectedCarrier.relayPoint.city}
                  </p>
                )}
              </div>
            )}

            {shippingAddress && (
              <div>
                <p className="font-bold uppercase tracking-wide text-[10px] text-black/40 mb-1">
                  Adresse de livraison
                </p>
                <p className="text-black/70">
                  {shippingAddress.firstName} {shippingAddress.lastName}
                  <br />
                  {shippingAddress.street}
                  {shippingAddress.streetComplement && (
                    <>
                      <br />
                      {shippingAddress.streetComplement}
                    </>
                  )}
                  <br />
                  {shippingAddress.postalCode} {shippingAddress.city}
                  <br />
                  {shippingAddress.country}
                </p>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}

interface CheckoutFormProps {
  orderId: string;
  formatPrice: (cents: number) => string;
  total: number;
}

function CheckoutForm({ orderId, formatPrice, total }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setErrorMessage('');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirmation?order=${orderId}`,
      },
    });

    // confirmPayment n'atteint ce code qu'en cas d'erreur.
    // Les paiements réussis redirigent automatiquement via return_url.
    if (error) {
      setErrorMessage(error.message ?? 'Erreur de paiement');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      {errorMessage && <p className="text-xs text-red-600">{errorMessage}</p>}

      <button
        type="submit"
        className="w-full bg-black text-white text-xs font-bold tracking-widest uppercase py-4 hover:bg-black/90 transition-colors disabled:opacity-50 mt-2"
        disabled={!stripe || isLoading}
      >
        {isLoading ? 'Traitement...' : <>Payer {formatPrice(total)}</>}
      </button>

      <p className="text-xs text-center text-black/40">
        En cliquant sur Payer, vous acceptez nos conditions générales de vente.
      </p>
    </form>
  );
}
