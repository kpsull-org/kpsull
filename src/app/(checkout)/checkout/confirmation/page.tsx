'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react';
import { CheckoutStepper } from '@/components/checkout/checkout-stepper';
import {
  OrderConfirmationSchema,
  parseSessionStorage,
  type OrderConfirmation,
} from '@/lib/schemas/checkout.schema';
import { useCartStore } from '@/lib/stores/cart.store';

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
      <div className="space-y-4">
        <div className="h-4 w-32 bg-black/10 animate-pulse" />
        <div className="h-96 bg-black/5 animate-pulse" />
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
      // Vider le panier localStorage après commande réussie (DB déjà vidée par create-session)
      useCartStore.getState().clear();
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

  // orderId présent mais pas de détails en sessionStorage → confirmation minimale
  if (orderId && !order) {
    return (
      <div className="container py-8 font-sans">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="border border-black p-6 inline-flex">
              <CheckCircle className="h-10 w-10 text-kpsull-green" strokeWidth={1.5} />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-wider uppercase mb-2">
              Merci pour votre commande !
            </h1>
            <p className="text-sm text-black/60 mb-1">Votre commande a bien été confirmée.</p>
            <p className="text-xs text-black/40">
              Référence :{' '}
              <span className="font-medium font-mono text-black">{orderId}</span>
            </p>
          </div>

          <div className="border border-black/10 p-4 flex items-center gap-4 text-left">
            <Mail className="h-5 w-5 text-black/40 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-bold tracking-wide">Confirmation envoyée par email</p>
              <p className="text-black/50 mt-0.5">
                Vous recevrez un email avec les détails de votre commande.
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-black text-white text-xs font-bold tracking-widest uppercase px-8 py-4 hover:bg-black/90 transition-colors"
          >
            Continuer mes achats
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  if (!orderId || !order) {
    return (
      <div className="container py-8 text-center font-sans">
        <h1 className="text-2xl font-bold tracking-wider uppercase mb-4">
          Commande introuvable
        </h1>
        <p className="text-sm text-black/60 mb-6">
          La page de confirmation a expiré ou la commande n&apos;existe pas.
        </p>
        <Link
          href="/"
          className="inline-block border border-black px-8 py-3 text-xs font-bold tracking-widest uppercase hover:bg-black hover:text-white transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8 font-sans">
      <div className="mb-10">
        <CheckoutStepper currentStep="confirmation" />
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="border border-black p-5 inline-flex">
              <CheckCircle className="h-8 w-8 text-kpsull-green" strokeWidth={1.5} />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wider uppercase mb-1">
              Merci pour votre commande !
            </h1>
            <p className="text-sm text-black/60">
              Commande <span className="font-medium text-black">{order.orderId}</span> confirmée
            </p>
          </div>
        </div>

        {/* Email notification */}
        <div className="border border-black/10 p-4 flex items-center gap-4">
          <Mail className="h-5 w-5 text-black/40 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-bold tracking-wide">Confirmation envoyée par email</p>
            <p className="text-black/50 mt-0.5">
              Vous recevrez un email de confirmation avec les détails de votre commande.
            </p>
          </div>
        </div>

        {/* Order details */}
        <div className="border border-black p-6">
          <h2 className="text-xs font-bold tracking-widest uppercase mb-1">
            Détails de la commande
          </h2>
          <p className="text-xs text-black/40 mb-4">
            #{order.orderId} — {new Date(order.paidAt).toLocaleDateString('fr-FR')}
          </p>

          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={`${item.productId}`} className="flex items-center gap-4">
                {item.image ? (
                  <div className="w-12 h-12 overflow-hidden flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-black/5 flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 text-black/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{item.name}</p>
                  <p className="text-xs text-black/50">Quantité : {item.quantity}</p>
                </div>
                <p className="text-sm font-bold">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-black/10 mt-4 pt-4 flex justify-between font-bold">
            <span className="uppercase tracking-wide text-sm">Total payé</span>
            <span className="text-lg">{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Shipping address */}
        <div className="border border-black/20 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-2">
            Adresse de livraison
          </p>
          <p className="text-sm font-medium">
            {order.shippingAddress.firstName} {order.shippingAddress.lastName}
          </p>
          <p className="text-xs text-black/60 mt-1">
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
        </div>

        {/* Next steps */}
        <div className="border border-black/10 p-6 space-y-4">
          <h2 className="text-xs font-bold tracking-widest uppercase">Et maintenant ?</h2>

          {[
            { n: 1, title: 'Préparation', desc: 'Le vendeur prépare votre commande' },
            { n: 2, title: 'Expédition', desc: 'Vous recevrez un email avec le numéro de suivi' },
            { n: 3, title: 'Livraison', desc: "Recevez votre commande à l'adresse indiquée" },
          ].map((step) => (
            <div key={step.n} className="flex items-start gap-3">
              <div className="w-6 h-6 bg-black text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {step.n}
              </div>
              <div>
                <p className="text-sm font-bold">{step.title}</p>
                <p className="text-xs text-black/50 mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-black text-white text-xs font-bold tracking-widest uppercase px-10 py-4 hover:bg-black/90 transition-colors"
          >
            Continuer mes achats
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
