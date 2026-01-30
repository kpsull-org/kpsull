# Story 7.5: Paiement Stripe Connect avec Escrow

Status: ready-for-dev

## Story

As a Client au checkout,
I want payer ma commande de maniere securisee,
so that mes fonds soient proteges jusqu'a reception.

## Acceptance Criteria

1. **AC1 - Recapitulatif commande**
   - **Given** un Client a l'etape paiement
   - **When** il voit le recapitulatif
   - **Then** il voit : liste des articles, sous-total, frais de livraison, total TTC
   - **And** l'adresse de livraison selectionnee est affichee

2. **AC2 - Formulaire Stripe Elements**
   - **Given** un Client pret a payer
   - **When** le formulaire de paiement s'affiche
   - **Then** Stripe Elements est integre pour la saisie securisee de la carte
   - **And** les methodes de paiement acceptees sont indiquees

3. **AC3 - Creation PaymentIntent avec escrow**
   - **Given** un Client qui valide le paiement
   - **When** le systeme traite la requete
   - **Then** un PaymentIntent est cree avec transfer_data vers le createur
   - **And** application_fee_amount = 3% du total (commission Kpsull)
   - **And** les fonds sont bloques (pas de transfert immediat)

4. **AC4 - Paiement reussi**
   - **Given** un paiement valide par Stripe
   - **When** le webhook payment_intent.succeeded est recu
   - **Then** une Order est creee avec statut PAID
   - **And** stripePaymentIntentId est enregistre
   - **And** platformFee et creatorPayout sont calcules

5. **AC5 - Gestion des erreurs de paiement**
   - **Given** un paiement qui echoue
   - **When** l'erreur est retournee par Stripe
   - **Then** un message d'erreur clair s'affiche au client
   - **And** il peut reessayer avec une autre carte

## Tasks / Subtasks

- [ ] **Task 1: Configurer Stripe Elements** (AC: #2)
  - [ ] 1.1 Installer @stripe/stripe-js et @stripe/react-stripe-js
  - [ ] 1.2 Creer le provider Stripe dans l'app
  - [ ] 1.3 Configurer les cles publiques et secretes

- [ ] **Task 2: Creer l'API PaymentIntent** (AC: #3)
  - [ ] 2.1 Creer `src/app/api/checkout/create-payment-intent/route.ts`
  - [ ] 2.2 Calculer le total avec commission 3%
  - [ ] 2.3 Creer le PaymentIntent avec transfer_data

- [ ] **Task 3: Creer le composant PaymentForm** (AC: #2, #5)
  - [ ] 3.1 Creer `src/components/checkout/payment-form.tsx`
  - [ ] 3.2 Integrer Stripe PaymentElement
  - [ ] 3.3 Gerer les erreurs et l'etat de chargement

- [ ] **Task 4: Creer le composant OrderSummary** (AC: #1)
  - [ ] 4.1 Creer `src/components/checkout/order-summary.tsx`
  - [ ] 4.2 Afficher articles, totaux, adresse
  - [ ] 4.3 Calculer et afficher la commission (transparent pour info)

- [ ] **Task 5: Implementer le webhook handler** (AC: #4)
  - [ ] 5.1 Mettre a jour `src/app/api/webhooks/stripe/route.ts`
  - [ ] 5.2 Gerer payment_intent.succeeded
  - [ ] 5.3 Creer l'Order et les OrderItems

- [ ] **Task 6: Creer le use case CreateOrder** (AC: #4)
  - [ ] 6.1 Creer `src/modules/orders/application/use-cases/create-order.use-case.ts`
  - [ ] 6.2 Calculer platformFee et creatorPayout
  - [ ] 6.3 Mettre a jour les stats du createur

- [ ] **Task 7: Ecrire les tests** (AC: #1-5)
  - [ ] 7.1 Tests unitaires pour le calcul de commission
  - [ ] 7.2 Tests pour le webhook handler (mock Stripe)
  - [ ] 7.3 Tests integration pour le flow complet

## Dev Notes

### Configuration Stripe Provider

```typescript
// src/lib/stripe/provider.tsx
"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripeProviderProps {
  children: React.ReactNode;
  clientSecret: string;
}

export function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#0070f3",
        colorBackground: "#ffffff",
        colorText: "#1a1a1a",
        colorDanger: "#ef4444",
        fontFamily: "system-ui, sans-serif",
        borderRadius: "8px",
      },
    },
    locale: "fr",
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
```

### API Create PaymentIntent

```typescript
// src/app/api/checkout/create-payment-intent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const PLATFORM_FEE_PERCENT = 0.03; // 3%

const createPaymentSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    quantity: z.number().int().positive(),
  })),
  addressId: z.string(),
  creatorId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const body = await request.json();
    const { items, addressId, creatorId } = createPaymentSchema.parse(body);

    // Recuperer le createur et son compte Stripe
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: { stripeAccountId: true, brandName: true },
    });

    if (!creator?.stripeAccountId) {
      return NextResponse.json(
        { error: "Ce createur ne peut pas recevoir de paiements" },
        { status: 400 }
      );
    }

    // Calculer le total
    const products = await prisma.product.findMany({
      where: {
        id: { in: items.map((i) => i.productId) },
        status: "PUBLISHED",
      },
      include: { variants: true },
    });

    let subtotal = 0;
    const orderItems: Array<{
      productId: string;
      variantId?: string;
      name: string;
      price: number;
      quantity: number;
    }> = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Produit ${item.productId} non trouve` },
          { status: 400 }
        );
      }

      let price = Number(product.price);

      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (variant?.price) {
          price = Number(variant.price);
        }
      }

      subtotal += price * item.quantity;

      orderItems.push({
        productId: product.id,
        variantId: item.variantId,
        name: product.name,
        price: Math.round(price * 100), // en centimes
        quantity: item.quantity,
      });
    }

    // Calculer les montants
    const subtotalCents = Math.round(subtotal * 100);
    const shippingCents = 0; // TODO: calculer selon adresse
    const totalCents = subtotalCents + shippingCents;
    const platformFeeCents = Math.round(totalCents * PLATFORM_FEE_PERCENT);

    // Creer le PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "eur",
      automatic_payment_methods: {
        enabled: true,
      },
      transfer_data: {
        destination: creator.stripeAccountId,
      },
      application_fee_amount: platformFeeCents,
      metadata: {
        userId: session.user.id,
        creatorId,
        addressId,
        orderItems: JSON.stringify(orderItems),
      },
      description: `Commande Kpsull - ${creator.brandName}`,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amounts: {
        subtotal: subtotalCents,
        shipping: shippingCents,
        platformFee: platformFeeCents,
        total: totalCents,
        creatorPayout: totalCents - platformFeeCents,
      },
    });
  } catch (error) {
    console.error("Create payment intent error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation du paiement" },
      { status: 500 }
    );
  }
}
```

### Composant PaymentForm

```typescript
// src/components/checkout/payment-form.tsx
"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";

interface PaymentFormProps {
  onSuccess: () => void;
  amounts: {
    subtotal: number;
    shipping: number;
    total: number;
  };
}

export function PaymentForm({ onSuccess, amounts }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "Une erreur est survenue");
      setIsLoading(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    });

    if (confirmError) {
      // Erreur affichee au client
      if (confirmError.type === "card_error" || confirmError.type === "validation_error") {
        setError(confirmError.message || "Erreur de validation de la carte");
      } else {
        setError("Une erreur inattendue est survenue");
      }
      setIsLoading(false);
    }
    // Si pas d'erreur, le client est redirige vers return_url
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-muted p-4 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span>Sous-total</span>
          <span>{formatPrice(amounts.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Livraison</span>
          <span>{amounts.shipping > 0 ? formatPrice(amounts.shipping) : "Gratuit"}</span>
        </div>
        <div className="flex justify-between font-semibold text-lg pt-2 border-t">
          <span>Total</span>
          <span>{formatPrice(amounts.total)}</span>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isLoading || !stripe || !elements}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Traitement en cours...
          </>
        ) : (
          `Payer ${formatPrice(amounts.total)}`
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        <span>Paiement securise par Stripe - Vos donnees sont protegees</span>
      </div>
    </form>
  );
}
```

### Webhook Handler Payment Success

```typescript
// src/app/api/webhooks/stripe/route.ts
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/prisma/client";
import Stripe from "stripe";

const PLATFORM_FEE_PERCENT = 0.03;

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed");
    return new NextResponse("Webhook Error", { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded":
      await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
      break;

    case "payment_intent.payment_failed":
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      break;

    case "account.updated":
      await handleAccountUpdated(event.data.object as Stripe.Account);
      break;
  }

  return new NextResponse("OK", { status: 200 });
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata;
  const { userId, creatorId, addressId, orderItems } = metadata;

  if (!userId || !creatorId || !addressId || !orderItems) {
    console.error("Missing metadata in payment intent");
    return;
  }

  const items = JSON.parse(orderItems);
  const totalCents = paymentIntent.amount;
  const platformFeeCents = Math.round(totalCents * PLATFORM_FEE_PERCENT);
  const creatorPayoutCents = totalCents - platformFeeCents;

  // Generer un numero de commande unique
  const orderNumber = `KP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // Creer la commande
  const order = await prisma.order.create({
    data: {
      orderNumber,
      buyerId: userId,
      creatorId,
      status: "PAID",
      subtotal: totalCents / 100,
      shippingCost: 0,
      taxAmount: 0,
      total: totalCents / 100,
      platformFee: platformFeeCents / 100,
      creatorPayout: creatorPayoutCents / 100,
      stripePaymentIntentId: paymentIntent.id,
      shippingAddressId: addressId,
      paidAt: new Date(),
      items: {
        create: items.map((item: any) => ({
          productId: item.productId,
          name: item.name,
          price: item.price / 100,
          quantity: item.quantity,
          variantInfo: item.variantId ? JSON.stringify({ variantId: item.variantId }) : null,
        })),
      },
    },
    include: {
      items: true,
      buyer: true,
      creator: true,
    },
  });

  // Mettre a jour les stats du createur
  await prisma.creator.update({
    where: { id: creatorId },
    data: {
      totalOrders: { increment: 1 },
      totalRevenue: { increment: creatorPayoutCents / 100 },
    },
  });

  // Mettre a jour currentSalesCount de la subscription
  await prisma.subscription.updateMany({
    where: { creatorId },
    data: { currentSalesCount: { increment: 1 } },
  });

  // Creer ou mettre a jour le customer
  const buyer = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (buyer) {
    await prisma.customer.upsert({
      where: {
        creatorId_email: { creatorId, email: buyer.email },
      },
      create: {
        creatorId,
        email: buyer.email,
        name: buyer.name,
        totalSpent: totalCents / 100,
        totalOrders: 1,
        lastOrderAt: new Date(),
      },
      update: {
        totalSpent: { increment: totalCents / 100 },
        totalOrders: { increment: 1 },
        lastOrderAt: new Date(),
      },
    });
  }

  console.log(`Order ${orderNumber} created successfully`);

  // TODO: Envoyer l'email de confirmation (voir Story 7.6)
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment failed: ${paymentIntent.id}`);
  // Optionnel: Logger l'echec pour analytics
}

async function handleAccountUpdated(account: Stripe.Account) {
  if (account.charges_enabled && account.payouts_enabled && account.details_submitted) {
    await prisma.creator.updateMany({
      where: { stripeAccountId: account.id },
      data: {
        stripeOnboarded: true,
        stripeOnboardedAt: new Date(),
      },
    });
  }
}
```

### Composant OrderSummary

```typescript
// src/components/checkout/order-summary.tsx
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { CartItem } from "@/lib/stores/cart.store";

interface OrderSummaryProps {
  items: CartItem[];
  address: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string | null;
    city: string;
    postalCode: string;
    country: string;
  };
  amounts: {
    subtotal: number;
    shipping: number;
    platformFee: number;
    total: number;
  };
}

export function OrderSummary({ items, address, amounts }: OrderSummaryProps) {
  const formatPrice = (cents: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recapitulatif</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Articles */}
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId || "default"}`}
              className="flex gap-3"
            >
              <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                <Image
                  src={item.image || "/placeholder-product.png"}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {item.quantity}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                {item.variantInfo && (
                  <p className="text-xs text-muted-foreground">
                    {item.variantInfo.value}
                  </p>
                )}
                <p className="text-sm">{formatPrice(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Adresse */}
        <div>
          <p className="text-sm font-medium mb-2">Livraison a</p>
          <p className="text-sm text-muted-foreground">
            {address.firstName} {address.lastName}
          </p>
          <p className="text-sm text-muted-foreground">{address.address1}</p>
          {address.address2 && (
            <p className="text-sm text-muted-foreground">{address.address2}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {address.postalCode} {address.city}
          </p>
        </div>

        <Separator />

        {/* Totaux */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Sous-total</span>
            <span>{formatPrice(amounts.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Livraison</span>
            <span>{amounts.shipping > 0 ? formatPrice(amounts.shipping) : "Gratuit"}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatPrice(amounts.total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### References

- [Source: architecture.md#Stripe Connect Integration]
- [Source: prd.md#FR33, FR41, FR47]
- [Source: epics.md#Story 7.5]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story creee | Claude Opus 4.5 |
