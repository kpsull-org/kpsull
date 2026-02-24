'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CreditCard, ShieldCheck } from 'lucide-react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
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
import { useCartHydration } from '@/lib/hooks/use-cart-hydration';
import { CheckoutStepper } from '@/components/checkout/checkout-stepper';
import { CartSummary } from '@/components/checkout/cart-summary';
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

  const items = useCartStore((state) => state.items);
  const getTotal = useCartStore((state) => state.getTotal);

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

    fetch('/api/checkout/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shippingAddress,
        carrier: selectedCarrier,
        shippingMode,
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

  if (items.length === 0 || !shippingAddress) {
    router.push('/cart');
    return null;
  }

  return (
    <div className="container py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/checkout/carrier">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Link>
      </Button>

      <h1 className="text-3xl font-bold mb-8">Paiement</h1>

      <div className="mb-8">
        <CheckoutStepper currentStep="payment" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Informations de paiement
              </CardTitle>
              <CardDescription>
                Vos informations de paiement sont securisees
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {sessionError && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {sessionError.includes('authentifi') || sessionError.includes('401') ? (
                    <>
                      <p className="font-medium mb-2">Vous devez être connecté pour finaliser votre commande.</p>
                      <Button size="sm" asChild>
                        <Link href={`/login?callbackUrl=/checkout/shipping`}>
                          Se connecter
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      {sessionError}
                      <div className="mt-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/checkout/carrier">Retour</Link>
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {isSessionLoading && (
                <div className="animate-pulse space-y-3">
                  <div className="h-10 bg-muted rounded" />
                  <div className="h-10 bg-muted rounded" />
                  <div className="h-10 w-1/2 bg-muted rounded" />
                </div>
              )}

              {clientSecret && orderId && !isSessionLoading && (
                <Elements
                  stripe={stripePromise}
                  options={{ clientSecret, locale: 'fr' }}
                >
                  <CheckoutForm
                    orderId={orderId}
                    formatPrice={formatPrice}
                    total={getTotal() + (selectedCarrier?.price ?? 0)}
                  />
                </Elements>
              )}

              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Paiement securise</p>
                  <p className="text-muted-foreground">
                    Vos informations sont chiffrees et securisees par Stripe.
                    Les fonds seront liberes au vendeur 48h apres livraison confirmee.
                  </p>
                </div>
              </div>

              <div className="p-4 border rounded-lg space-y-3">
                {selectedCarrier && (
                  <div>
                    <h4 className="font-medium mb-1">Transporteur</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedCarrier.carrierName} — {selectedCarrier.estimatedDays}
                      {' '}({formatPrice(selectedCarrier.price)} de frais de port)
                    </p>
                    {selectedCarrier.relayPoint && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Point relais : {selectedCarrier.relayPoint.name},{' '}
                        {selectedCarrier.relayPoint.address},{' '}
                        {selectedCarrier.relayPoint.postalCode} {selectedCarrier.relayPoint.city}
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <h4 className="font-medium mb-1">Adresse de livraison</h4>
                  <p className="text-sm text-muted-foreground">
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
              </div>
            </CardContent>
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

      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}

      <CardFooter className="px-0 flex-col gap-4">
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={!stripe || isLoading}
        >
          {isLoading ? 'Traitement...' : <>Payer {formatPrice(total)}</>}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          En cliquant sur Payer, vous acceptez nos conditions generales de vente.
        </p>
      </CardFooter>
    </form>
  );
}
