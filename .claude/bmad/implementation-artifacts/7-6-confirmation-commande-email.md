# Story 7.6: Confirmation de Commande et Email

Status: ready-for-dev

## Story

As a Client ayant paye,
I want recevoir une confirmation de commande,
so that j'aie une preuve de mon achat.

## Acceptance Criteria

1. **AC1 - Page de succes**
   - **Given** un paiement reussi
   - **When** le Client est redirige vers /checkout/success
   - **Then** il voit le numero de commande
   - **And** il voit un recapitulatif : articles, montant total, adresse de livraison
   - **And** un message de confirmation s'affiche

2. **AC2 - Email confirmation client**
   - **Given** une commande creee avec succes
   - **When** le systeme traite la confirmation
   - **Then** un email est envoye au client via Resend
   - **And** l'email contient : numero de commande, liste des articles, montant, adresse de livraison
   - **And** l'email est dans un format professionnel et responsive

3. **AC3 - Email notification createur**
   - **Given** une nouvelle commande sur la boutique d'un createur
   - **When** la commande est confirmee
   - **Then** le createur recoit un email "Nouvelle commande #XXX"
   - **And** l'email contient : articles commandes, montant (commission deduite), adresse client

4. **AC4 - Lien vers suivi commande**
   - **Given** un Client sur la page de succes
   - **When** il consulte la confirmation
   - **Then** un lien vers l'historique de ses commandes est affiche
   - **And** il peut voir le statut de sa commande

5. **AC5 - Partage sur reseaux sociaux (optionnel)**
   - **Given** un Client sur la page de succes
   - **When** il souhaite partager
   - **Then** des boutons de partage sont disponibles (Twitter, Facebook)

## Tasks / Subtasks

- [ ] **Task 1: Creer la page de succes** (AC: #1, #4)
  - [ ] 1.1 Creer `src/app/(checkout)/checkout/success/page.tsx`
  - [ ] 1.2 Recuperer les details de la commande depuis l'URL/session
  - [ ] 1.3 Afficher le recapitulatif complet

- [ ] **Task 2: Configurer Resend** (AC: #2, #3)
  - [ ] 2.1 Installer resend et react-email
  - [ ] 2.2 Creer `src/lib/resend/client.ts`
  - [ ] 2.3 Configurer les templates de base

- [ ] **Task 3: Creer le template email client** (AC: #2)
  - [ ] 3.1 Creer `src/emails/order-confirmation.tsx`
  - [ ] 3.2 Integrer le design responsive
  - [ ] 3.3 Ajouter les variables dynamiques

- [ ] **Task 4: Creer le template email createur** (AC: #3)
  - [ ] 4.1 Creer `src/emails/new-order-notification.tsx`
  - [ ] 4.2 Inclure les details commande et client
  - [ ] 4.3 Afficher le montant net (apres commission)

- [ ] **Task 5: Implementer le service d'envoi d'emails** (AC: #2, #3)
  - [ ] 5.1 Creer `src/modules/notifications/infrastructure/services/email.service.ts`
  - [ ] 5.2 Creer les fonctions sendOrderConfirmation et sendNewOrderNotification
  - [ ] 5.3 Integrer dans le webhook Stripe

- [ ] **Task 6: Ajouter le composant SuccessConfetti** (AC: #1)
  - [ ] 6.1 Installer canvas-confetti ou similaire
  - [ ] 6.2 Creer l'animation de celebration

- [ ] **Task 7: Ecrire les tests** (AC: #1-4)
  - [ ] 7.1 Tests pour la page de succes
  - [ ] 7.2 Tests pour le service d'emails (mock Resend)
  - [ ] 7.3 Tests pour les templates d'emails

## Dev Notes

### Configuration Resend

```typescript
// src/lib/resend/client.ts
import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_FROM = "Kpsull <noreply@kpsull.com>";
```

### Template Email Confirmation Client

```typescript
// src/emails/order-confirmation.tsx
import {
  Body,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  variantInfo?: string;
  image?: string;
}

interface OrderConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    postalCode: string;
    country: string;
  };
  creatorName: string;
  orderUrl: string;
}

export function OrderConfirmationEmail({
  customerName,
  orderNumber,
  orderDate,
  items,
  subtotal,
  shipping,
  total,
  shippingAddress,
  creatorName,
  orderUrl,
}: OrderConfirmationEmailProps) {
  const formatPrice = (cents: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);

  return (
    <Html>
      <Head />
      <Preview>Confirmation de votre commande #{orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src="https://kpsull.com/logo.png"
              width="120"
              height="40"
              alt="Kpsull"
            />
          </Section>

          {/* Titre */}
          <Section style={content}>
            <Heading style={h1}>Merci pour votre commande !</Heading>
            <Text style={text}>
              Bonjour {customerName},
            </Text>
            <Text style={text}>
              Votre commande aupres de <strong>{creatorName}</strong> a bien ete confirmee.
              Vous recevrez un email avec le suivi de livraison des que votre commande sera expediee.
            </Text>
          </Section>

          {/* Numero de commande */}
          <Section style={orderBox}>
            <Text style={orderLabel}>Numero de commande</Text>
            <Text style={orderNumberStyle}>{orderNumber}</Text>
            <Text style={orderDateStyle}>Commande du {orderDate}</Text>
          </Section>

          {/* Articles */}
          <Section style={content}>
            <Heading as="h2" style={h2}>
              Vos articles
            </Heading>
            {items.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column style={itemImageCol}>
                  {item.image && (
                    <Img
                      src={item.image}
                      width="80"
                      height="80"
                      alt={item.name}
                      style={itemImage}
                    />
                  )}
                </Column>
                <Column style={itemDetailsCol}>
                  <Text style={itemName}>{item.name}</Text>
                  {item.variantInfo && (
                    <Text style={itemVariant}>{item.variantInfo}</Text>
                  )}
                  <Text style={itemQty}>Quantite: {item.quantity}</Text>
                </Column>
                <Column style={itemPriceCol}>
                  <Text style={itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={hr} />

          {/* Totaux */}
          <Section style={content}>
            <Row style={totalRow}>
              <Column style={totalLabel}>Sous-total</Column>
              <Column style={totalValue}>{formatPrice(subtotal)}</Column>
            </Row>
            <Row style={totalRow}>
              <Column style={totalLabel}>Livraison</Column>
              <Column style={totalValue}>
                {shipping > 0 ? formatPrice(shipping) : "Gratuit"}
              </Column>
            </Row>
            <Row style={totalRowFinal}>
              <Column style={totalLabelFinal}>Total</Column>
              <Column style={totalValueFinal}>{formatPrice(total)}</Column>
            </Row>
          </Section>

          <Hr style={hr} />

          {/* Adresse */}
          <Section style={content}>
            <Heading as="h2" style={h2}>
              Adresse de livraison
            </Heading>
            <Text style={addressText}>
              {shippingAddress.firstName} {shippingAddress.lastName}
              <br />
              {shippingAddress.address1}
              {shippingAddress.address2 && (
                <>
                  <br />
                  {shippingAddress.address2}
                </>
              )}
              <br />
              {shippingAddress.postalCode} {shippingAddress.city}
              <br />
              {shippingAddress.country}
            </Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Link href={orderUrl} style={ctaButton}>
              Suivre ma commande
            </Link>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Une question ? Contactez le createur directement depuis votre espace client.
            </Text>
            <Text style={footerText}>
              Kpsull - La marketplace des createurs francais
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  padding: "20px 30px",
  borderBottom: "1px solid #e6ebf1",
};

const content = {
  padding: "0 30px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "32px",
  margin: "30px 0 16px",
};

const h2 = {
  color: "#1a1a1a",
  fontSize: "18px",
  fontWeight: "600",
  margin: "24px 0 16px",
};

const text = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const orderBox = {
  backgroundColor: "#f6f9fc",
  borderRadius: "8px",
  margin: "20px 30px",
  padding: "20px",
  textAlign: "center" as const,
};

const orderLabel = {
  color: "#8898aa",
  fontSize: "12px",
  textTransform: "uppercase" as const,
  margin: "0",
};

const orderNumberStyle = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  margin: "8px 0",
};

const orderDateStyle = {
  color: "#8898aa",
  fontSize: "14px",
  margin: "0",
};

const itemRow = {
  marginBottom: "16px",
};

const itemImageCol = {
  width: "80px",
  verticalAlign: "top" as const,
};

const itemImage = {
  borderRadius: "4px",
};

const itemDetailsCol = {
  paddingLeft: "16px",
  verticalAlign: "top" as const,
};

const itemName = {
  color: "#1a1a1a",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0 0 4px",
};

const itemVariant = {
  color: "#8898aa",
  fontSize: "12px",
  margin: "0 0 4px",
};

const itemQty = {
  color: "#525f7f",
  fontSize: "12px",
  margin: "0",
};

const itemPriceCol = {
  textAlign: "right" as const,
  verticalAlign: "top" as const,
};

const itemPrice = {
  color: "#1a1a1a",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 30px",
};

const totalRow = {
  marginBottom: "8px",
};

const totalLabel = {
  color: "#525f7f",
  fontSize: "14px",
};

const totalValue = {
  color: "#1a1a1a",
  fontSize: "14px",
  textAlign: "right" as const,
};

const totalRowFinal = {
  marginTop: "16px",
  paddingTop: "16px",
  borderTop: "1px solid #e6ebf1",
};

const totalLabelFinal = {
  color: "#1a1a1a",
  fontSize: "16px",
  fontWeight: "600",
};

const totalValueFinal = {
  color: "#1a1a1a",
  fontSize: "18px",
  fontWeight: "600",
  textAlign: "right" as const,
};

const addressText = {
  color: "#525f7f",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};

const ctaSection = {
  padding: "30px",
  textAlign: "center" as const,
};

const ctaButton = {
  backgroundColor: "#0070f3",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
};

const footer = {
  padding: "30px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#8898aa",
  fontSize: "12px",
  margin: "0 0 8px",
};

export default OrderConfirmationEmail;
```

### Template Email Notification Createur

```typescript
// src/emails/new-order-notification.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface NewOrderNotificationEmailProps {
  creatorName: string;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  platformFee: number;
  creatorPayout: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    city: string;
    postalCode: string;
  };
  dashboardUrl: string;
}

export function NewOrderNotificationEmail({
  creatorName,
  orderNumber,
  orderDate,
  customerName,
  customerEmail,
  items,
  total,
  platformFee,
  creatorPayout,
  shippingAddress,
  dashboardUrl,
}: NewOrderNotificationEmailProps) {
  const formatPrice = (cents: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);

  return (
    <Html>
      <Head />
      <Preview>Nouvelle commande #{orderNumber} sur Kpsull</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            <Heading style={h1}>Nouvelle commande !</Heading>
            <Text style={text}>
              Bonjour {creatorName},
            </Text>
            <Text style={text}>
              Bonne nouvelle ! Vous avez recu une nouvelle commande.
            </Text>
          </Section>

          <Section style={orderBox}>
            <Text style={orderLabel}>Commande</Text>
            <Text style={orderNumberStyle}>{orderNumber}</Text>
            <Text style={orderDateStyle}>{orderDate}</Text>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={h2}>Articles commandes</Heading>
            {items.map((item, index) => (
              <Text key={index} style={itemText}>
                {item.quantity}x {item.name} - {formatPrice(item.price * item.quantity)}
              </Text>
            ))}
          </Section>

          <Hr style={hr} />

          <Section style={content}>
            <Text style={totalText}>
              Total commande : <strong>{formatPrice(total)}</strong>
            </Text>
            <Text style={feeText}>
              Commission Kpsull (3%) : -{formatPrice(platformFee)}
            </Text>
            <Text style={payoutText}>
              Votre gain : <strong>{formatPrice(creatorPayout)}</strong>
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={content}>
            <Heading as="h2" style={h2}>Client</Heading>
            <Text style={text}>
              {customerName}
              <br />
              {customerEmail}
            </Text>

            <Heading as="h2" style={h2}>Adresse de livraison</Heading>
            <Text style={text}>
              {shippingAddress.firstName} {shippingAddress.lastName}
              <br />
              {shippingAddress.address1}
              <br />
              {shippingAddress.postalCode} {shippingAddress.city}
            </Text>
          </Section>

          <Section style={ctaSection}>
            <Link href={dashboardUrl} style={ctaButton}>
              Voir la commande
            </Link>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              N'oubliez pas de preparer et d'expedier cette commande rapidement !
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "600px",
};

const content = {
  padding: "0 30px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  margin: "30px 0 16px",
};

const h2 = {
  color: "#1a1a1a",
  fontSize: "16px",
  fontWeight: "600",
  margin: "24px 0 12px",
};

const text = {
  color: "#525f7f",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 12px",
};

const orderBox = {
  backgroundColor: "#dcfce7",
  borderRadius: "8px",
  margin: "20px 30px",
  padding: "20px",
  textAlign: "center" as const,
};

const orderLabel = {
  color: "#166534",
  fontSize: "12px",
  textTransform: "uppercase" as const,
  margin: "0",
};

const orderNumberStyle = {
  color: "#166534",
  fontSize: "24px",
  fontWeight: "600",
  margin: "8px 0",
};

const orderDateStyle = {
  color: "#166534",
  fontSize: "14px",
  margin: "0",
};

const itemText = {
  color: "#525f7f",
  fontSize: "14px",
  margin: "4px 0",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 30px",
};

const totalText = {
  color: "#1a1a1a",
  fontSize: "14px",
  margin: "0 0 8px",
};

const feeText = {
  color: "#8898aa",
  fontSize: "12px",
  margin: "0 0 8px",
};

const payoutText = {
  color: "#166534",
  fontSize: "16px",
  margin: "8px 0 0",
};

const ctaSection = {
  padding: "30px",
  textAlign: "center" as const,
};

const ctaButton = {
  backgroundColor: "#0070f3",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
};

const footer = {
  padding: "20px 30px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#8898aa",
  fontSize: "12px",
  margin: "0",
};

export default NewOrderNotificationEmail;
```

### Service d'Envoi d'Emails

```typescript
// src/modules/notifications/infrastructure/services/email.service.ts
import { resend, EMAIL_FROM } from "@/lib/resend/client";
import OrderConfirmationEmail from "@/emails/order-confirmation";
import NewOrderNotificationEmail from "@/emails/new-order-notification";

export interface OrderEmailData {
  orderNumber: string;
  orderDate: Date;
  customer: {
    name: string;
    email: string;
  };
  creator: {
    name: string;
    email: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    variantInfo?: string;
    image?: string;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  platformFee: number;
  creatorPayout: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  const orderUrl = `${process.env.NEXTAUTH_URL}/account/orders`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: data.customer.email,
    subject: `Confirmation de votre commande #${data.orderNumber}`,
    react: OrderConfirmationEmail({
      customerName: data.customer.name,
      orderNumber: data.orderNumber,
      orderDate: new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(data.orderDate),
      items: data.items,
      subtotal: data.subtotal,
      shipping: data.shipping,
      total: data.total,
      shippingAddress: data.shippingAddress,
      creatorName: data.creator.name,
      orderUrl,
    }),
  });
}

export async function sendNewOrderNotificationEmail(data: OrderEmailData) {
  const dashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard/orders`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: data.creator.email,
    subject: `Nouvelle commande #${data.orderNumber} sur Kpsull`,
    react: NewOrderNotificationEmail({
      creatorName: data.creator.name,
      orderNumber: data.orderNumber,
      orderDate: new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(data.orderDate),
      customerName: data.customer.name,
      customerEmail: data.customer.email,
      items: data.items,
      total: data.total,
      platformFee: data.platformFee,
      creatorPayout: data.creatorPayout,
      shippingAddress: data.shippingAddress,
      dashboardUrl,
    }),
  });
}

export async function sendOrderEmails(data: OrderEmailData) {
  await Promise.all([
    sendOrderConfirmationEmail(data),
    sendNewOrderNotificationEmail(data),
  ]);
}
```

### Page de Succes

```typescript
// src/app/(checkout)/checkout/success/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/client";
import { SuccessContent } from "@/components/checkout/success-content";

interface SuccessPageProps {
  searchParams: Promise<{
    payment_intent?: string;
  }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;

  if (!session?.user) {
    redirect("/login");
  }

  if (!params.payment_intent) {
    redirect("/cart");
  }

  // Recuperer la commande associee au PaymentIntent
  const order = await prisma.order.findFirst({
    where: {
      stripePaymentIntentId: params.payment_intent,
      buyerId: session.user.id,
    },
    include: {
      items: {
        include: { product: { include: { images: { take: 1 } } } },
      },
      shippingAddress: true,
      creator: true,
    },
  });

  if (!order) {
    redirect("/cart");
  }

  return (
    <SuccessContent
      order={{
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        items: order.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: Math.round(Number(item.price) * 100),
          image: item.product.images[0]?.url,
        })),
        total: Math.round(Number(order.total) * 100),
        shippingAddress: order.shippingAddress
          ? {
              firstName: order.shippingAddress.firstName,
              lastName: order.shippingAddress.lastName,
              address1: order.shippingAddress.address1,
              city: order.shippingAddress.city,
              postalCode: order.shippingAddress.postalCode,
            }
          : null,
        creatorName: order.creator.brandName,
      }}
    />
  );
}
```

### Composant SuccessContent avec Confetti

```typescript
// src/components/checkout/success-content.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCartStore } from "@/lib/stores/cart.store";

interface OrderData {
  orderNumber: string;
  createdAt: Date;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  total: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    city: string;
    postalCode: string;
  } | null;
  creatorName: string;
}

interface SuccessContentProps {
  order: OrderData;
}

export function SuccessContent({ order }: SuccessContentProps) {
  const clearCart = useCartStore((state) => state.clearCart);

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);

  useEffect(() => {
    // Vider le panier local
    clearCart();

    // Lancer les confettis
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#0070f3", "#10b981", "#f59e0b"],
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#0070f3", "#10b981", "#f59e0b"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, [clearCart]);

  return (
    <div className="container py-12 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold mb-2">Commande confirmee !</h1>
        <p className="text-muted-foreground">
          Merci pour votre achat aupres de {order.creatorName}
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Numero de commande</p>
              <p className="font-mono font-semibold">{order.orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{formatPrice(order.total)}</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Quantite: {item.quantity}
                  </p>
                </div>
                <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          {order.shippingAddress && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Livraison a</p>
              <p className="text-sm">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                <br />
                {order.shippingAddress.address1}
                <br />
                {order.shippingAddress.postalCode} {order.shippingAddress.city}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-blue-50 rounded-lg p-4 mb-8">
        <p className="text-sm text-blue-800">
          Un email de confirmation a ete envoye a votre adresse.
          Vous recevrez un autre email avec le suivi de livraison
          des que votre commande sera expediee.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild className="flex-1">
          <Link href="/account/orders">
            Suivre ma commande
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href="/">Continuer mes achats</Link>
        </Button>
      </div>
    </div>
  );
}
```

### Integration dans le Webhook Stripe

```typescript
// Ajouter dans src/app/api/webhooks/stripe/route.ts (handlePaymentSuccess)

import { sendOrderEmails } from "@/modules/notifications/infrastructure/services/email.service";

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  // ... code existant de creation de commande ...

  // Apres la creation de la commande, envoyer les emails
  await sendOrderEmails({
    orderNumber: order.orderNumber,
    orderDate: order.createdAt,
    customer: {
      name: order.buyer?.name || "Client",
      email: order.buyer?.email || "",
    },
    creator: {
      name: order.creator.brandName,
      email: order.creator.user?.email || "",
    },
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: Math.round(Number(item.price) * 100),
    })),
    subtotal: Math.round(Number(order.subtotal) * 100),
    shipping: Math.round(Number(order.shippingCost) * 100),
    total: Math.round(Number(order.total) * 100),
    platformFee: Math.round(Number(order.platformFee) * 100),
    creatorPayout: Math.round(Number(order.creatorPayout) * 100),
    shippingAddress: order.shippingAddress
      ? {
          firstName: order.shippingAddress.firstName,
          lastName: order.shippingAddress.lastName,
          address1: order.shippingAddress.address1,
          address2: order.shippingAddress.address2 || undefined,
          city: order.shippingAddress.city,
          postalCode: order.shippingAddress.postalCode,
          country: order.shippingAddress.country,
        }
      : {
          firstName: "",
          lastName: "",
          address1: "",
          city: "",
          postalCode: "",
          country: "FR",
        },
  });
}
```

### References

- [Source: architecture.md#Resend Integration]
- [Source: prd.md#FR34]
- [Source: epics.md#Story 7.6]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story creee | Claude Opus 4.5 |
