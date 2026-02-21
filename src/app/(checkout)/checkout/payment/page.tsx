'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CreditCard, ShieldCheck } from 'lucide-react';
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
  OrderConfirmationSchema,
  parseSessionStorage,
  storeSessionStorage,
  type ShippingAddress,
  type CarrierSelection,
} from '@/lib/schemas/checkout.schema';

/**
 * Payment Page
 *
 * Story 7-5: Paiement Stripe Connect Escrow
 *
 * Acceptance Criteria:
 * - AC1: Affiche formulaire de paiement securise
 * - AC2: Integration Stripe Elements (simule pour demo)
 * - AC3: Escrow 48h avant liberation des fonds
 * - AC4: Gestion des erreurs de paiement
 * - AC5: Redirection vers confirmation apres paiement
 */
export default function PaymentPage() {
  const router = useRouter();
  const isHydrated = useCartHydration();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierSelection | null>(null);

  const items = useCartStore((state) => state.items);
  const getTotal = useCartStore((state) => state.getTotal);
  const clear = useCartStore((state) => state.clear);

  useEffect(() => {
    // Load shipping address with Zod validation
    const result = parseSessionStorage('shippingAddress', ShippingAddressSchema);
    if (result.success) {
      setShippingAddress(result.data);
    } else if (result.error) {
      console.warn('Invalid shipping address in sessionStorage:', result.error.issues);
      router.push('/checkout/shipping');
    }

    // Load selected carrier
    const carrierResult = parseSessionStorage('selectedCarrier', CarrierSelectionSchema);
    if (carrierResult.success) {
      setSelectedCarrier(carrierResult.data);
    } else if (carrierResult.error) {
      router.push('/checkout/carrier');
    }
  }, [router]);

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // In production, this would:
      // 1. Call server action to create PaymentIntent with Stripe Connect
      // 2. Use Stripe Elements to confirm the payment
      // 3. Handle 3D Secure if needed
      // 4. Receive confirmation webhook

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate order ID (in production, comes from server)
      const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;

      // Store order confirmation with Zod validation
      const orderData = {
        orderId,
        items: items,
        total: getTotal(),
        shippingAddress: shippingAddress!,
        selectedCarrier: selectedCarrier ?? undefined,
        paidAt: new Date().toISOString(),
      };

      const stored = storeSessionStorage('orderConfirmation', orderData, OrderConfirmationSchema);
      if (!stored) {
        throw new Error('Failed to store order confirmation');
      }

      // Clear cart
      clear();

      // Clear checkout session data
      sessionStorage.removeItem('guestCheckout');
      sessionStorage.removeItem('shippingAddress');
      sessionStorage.removeItem('selectedCarrier');

      // Navigate to confirmation
      router.push(`/checkout/confirmation?order=${orderId}`);
    } catch {
      setError('Une erreur est survenue lors du paiement. Veuillez reessayer.');
      setIsLoading(false);
    }
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

  // Redirect if cart is empty or no shipping address
  if (items.length === 0 || !shippingAddress) {
    router.push('/cart');
    return null;
  }

  return (
    <div className="container py-8">
      {/* Back link */}
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/checkout/carrier">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Link>
      </Button>

      <h1 className="text-3xl font-bold mb-8">Paiement</h1>

      {/* Stepper */}
      <div className="mb-8">
        <CheckoutStepper currentStep="payment" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Payment form */}
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

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    {error}
                  </div>
                )}

                {/* Stripe Elements Placeholder - Demo Mode */}
                <div className="p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/30">
                  <div className="flex flex-col items-center justify-center text-center space-y-3">
                    <CreditCard className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">
                        Integration Stripe Elements
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Demo Mode - Le formulaire de paiement securise sera integre ici
                      </p>
                    </div>
                  </div>
                </div>

                {/* Security notice */}
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

                {/* Shipping address summary */}
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

              <CardFooter className="flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    'Traitement en cours...'
                  ) : (
                    <>Payer {formatPrice(getTotal() + (selectedCarrier?.price ?? 0))}</>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  En cliquant sur Payer, vous acceptez nos conditions generales de vente.
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Order summary */}
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
