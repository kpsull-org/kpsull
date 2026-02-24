'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckoutStepper } from '@/components/checkout/checkout-stepper';
import {
  OrderConfirmationSchema,
  parseSessionStorage,
  type OrderConfirmation,
} from '@/lib/schemas/checkout.schema';

/**
 * Order Confirmation Page
 *
 * Story 7-6: Confirmation commande email
 *
 * Acceptance Criteria:
 * - AC1: Affiche numero de commande
 * - AC2: Resume des articles commandes
 * - AC3: Adresse de livraison
 * - AC4: Message de confirmation
 * - AC5: Lien vers suivi de commande
 */
export default function ConfirmationPage() {
  return (
    <Suspense fallback={<ConfirmationSkeleton />}>
      <ConfirmationContent />
    </Suspense>
  );
}

function ConfirmationSkeleton() {
  return (
    <div className="container py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-96 bg-muted rounded" />
      </div>
    </div>
  );
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');
  const [order, setOrder] = useState<OrderConfirmation | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Load order confirmation from session storage with Zod validation (FIX-1.2)
    const result = parseSessionStorage('orderConfirmation', OrderConfirmationSchema);
    if (result.success) {
      setOrder(result.data);
      // Clear after loading (one-time view)
      sessionStorage.removeItem('orderConfirmation');
    } else if (result.error) {
      console.warn('Invalid order confirmation in sessionStorage:', result.error.issues);
      // Invalid data was already removed by parseSessionStorage
    }
  }, []);

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);

  if (!mounted) {
    return <ConfirmationSkeleton />;
  }

  // orderId présent mais pas de détails en sessionStorage → afficher confirmation minimale
  if (orderId && !order) {
    return (
      <div className="container py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Merci pour votre commande !</h1>
          <p className="text-muted-foreground mb-2">
            Votre commande a bien été confirmée.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Référence : <span className="font-medium font-mono">{orderId}</span>
          </p>
          <Card className="mb-6 text-left">
            <CardContent className="flex items-center gap-4 py-4">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Confirmation envoyée par email</p>
                <p className="text-sm text-muted-foreground">
                  Vous recevrez un email avec les détails de votre commande.
                </p>
              </div>
            </CardContent>
          </Card>
          <Button asChild>
            <Link href="/">
              Continuer mes achats
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!orderId || !order) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Commande introuvable</h1>
        <p className="text-muted-foreground mb-6">
          La page de confirmation a expire ou la commande n&apos;existe pas.
        </p>
        <Button asChild>
          <Link href="/">Retour a l&apos;accueil</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <CheckoutStepper currentStep="confirmation" />
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Success message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Merci pour votre commande !</h1>
          <p className="text-muted-foreground">
            Votre commande <span className="font-medium">{order.orderId}</span> a ete confirmee.
          </p>
        </div>

        {/* Email notification */}
        <Card className="mb-6">
          <CardContent className="flex items-center gap-4 py-4">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Confirmation envoyee par email</p>
              <p className="text-sm text-muted-foreground">
                Vous recevrez un email de confirmation avec les details de votre commande.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Order details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Details de la commande</CardTitle>
            <CardDescription>
              Commande #{order.orderId} - {new Date(order.paidAt).toLocaleDateString('fr-FR')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Items */}
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={`${item.productId}`}
                  className="flex items-center gap-4"
                >
                  {item.image ? (
                    <div className="w-12 h-12 relative rounded overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantite: {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between text-lg font-semibold">
              <span>Total paye</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Shipping address */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Adresse de livraison</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            </p>
            <p className="text-muted-foreground">
              {order.shippingAddress.street}
              {order.shippingAddress.streetComplement && (
                <>
                  <br />
                  {order.shippingAddress.streetComplement}
                </>
              )}
              <br />
              {order.shippingAddress.postalCode} {order.shippingAddress.city}
              <br />
              {order.shippingAddress.country}
            </p>
          </CardContent>
        </Card>

        {/* What's next */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Et maintenant ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Preparation</p>
                <p className="text-sm text-muted-foreground">
                  Le vendeur prepare votre commande
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Expedition</p>
                <p className="text-sm text-muted-foreground">
                  Vous recevrez un email avec le numero de suivi
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Livraison</p>
                <p className="text-sm text-muted-foreground">
                  Recevez votre commande a l&apos;adresse indiquee
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/">
              Continuer mes achats
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
