# Story 12.2: Suivi Commande en Cours

Status: ready-for-dev

## Story

As a Client,
I want suivre ma commande en cours avec une timeline visuelle,
so that je puisse savoir exactement ou en est ma commande et quand je serai livre.

## Acceptance Criteria

1. **AC1 - Timeline visuelle des etapes**
   - **Given** un Client avec une commande en cours
   - **When** il consulte le detail de sa commande
   - **Then** une timeline affiche les etapes: Commande confirmee -> En preparation -> Expediee -> En livraison -> Livree
   - **And** l'etape actuelle est mise en evidence
   - **And** les etapes passees sont cochees avec leur date/heure

2. **AC2 - Lien tracking transporteur (AfterShip)**
   - **Given** une commande expediee avec numero de tracking
   - **When** le Client consulte la timeline
   - **Then** un bouton "Suivre mon colis" redirige vers la page AfterShip
   - **And** le lien direct vers le transporteur est egalement disponible
   - **And** les derniers evenements de tracking sont affiches

3. **AC3 - Notification email changement de statut**
   - **Given** une commande en cours de traitement
   - **When** le statut de la commande change (PAID -> SHIPPED, SHIPPED -> DELIVERED)
   - **Then** le Client recoit un email avec le nouveau statut
   - **And** l'email contient un lien vers le suivi de commande
   - **And** pour les expeditions, l'email inclut le numero de tracking

4. **AC4 - Estimation de livraison**
   - **Given** une commande expediee
   - **When** AfterShip fournit une estimation de livraison
   - **Then** la date estimee est affichee dans la timeline
   - **And** elle est mise a jour en temps reel

## Tasks / Subtasks

- [ ] **Task 1: Creer le composant TrackingTimeline** (AC: #1)
  - [ ] 1.1 Creer `src/components/account/tracking-timeline.tsx`
  - [ ] 1.2 Definir les etapes du workflow (CONFIRMED, PREPARING, SHIPPED, IN_TRANSIT, DELIVERED)
  - [ ] 1.3 Implementer l'affichage visuel avec icones et dates
  - [ ] 1.4 Gerer le style pour etape active/completee/a venir

- [ ] **Task 2: Integrer les evenements AfterShip** (AC: #2, #4)
  - [ ] 2.1 Creer `src/modules/orders/application/use-cases/get-tracking-events.use-case.ts`
  - [ ] 2.2 Appeler AfterShip API pour recuperer les checkpoints
  - [ ] 2.3 Mapper les evenements AfterShip vers la timeline
  - [ ] 2.4 Afficher les derniers evenements de tracking

- [ ] **Task 3: Creer le composant TrackingEvents** (AC: #2)
  - [ ] 3.1 Creer `src/components/account/tracking-events.tsx`
  - [ ] 3.2 Afficher la liste des checkpoints avec date/lieu/description
  - [ ] 3.3 Ajouter le bouton "Suivre sur AfterShip"
  - [ ] 3.4 Ajouter le lien direct transporteur

- [ ] **Task 4: Emails de notification statut** (AC: #3)
  - [ ] 4.1 Creer template `order-status-changed.tsx` avec React Email
  - [ ] 4.2 Creer template specifique `order-shipped.tsx` avec tracking
  - [ ] 4.3 Creer template `order-delivered.tsx`
  - [ ] 4.4 Integrer l'envoi dans les use cases de changement de statut

- [ ] **Task 5: Affichage estimation livraison** (AC: #4)
  - [ ] 5.1 Stocker `estimatedDelivery` dans Order depuis AfterShip
  - [ ] 5.2 Afficher dans la timeline avec mise en evidence
  - [ ] 5.3 Mettre a jour via les webhooks AfterShip

- [ ] **Task 6: Integrer dans la page de detail** (AC: #1, #2, #4)
  - [ ] 6.1 Modifier `src/app/(account)/account/orders/[id]/page.tsx`
  - [ ] 6.2 Ajouter TrackingTimeline et TrackingEvents
  - [ ] 6.3 Gerer le loading state pour les donnees AfterShip

- [ ] **Task 7: Ecrire les tests** (AC: #1-4)
  - [ ] 7.1 Tests unitaires pour TrackingTimeline (tous les etats)
  - [ ] 7.2 Tests unitaires pour GetTrackingEventsUseCase
  - [ ] 7.3 Tests des templates email
  - [ ] 7.4 Tests d'integration avec mock AfterShip

## Dev Notes

### Composant TrackingTimeline

```typescript
// src/components/account/tracking-timeline.tsx
"use client";

import { cn } from "@/lib/utils";
import { Check, Circle, Clock, MapPin, Package, Truck } from "lucide-react";

type OrderStep = "CONFIRMED" | "PREPARING" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED";

interface TimelineStep {
  key: OrderStep;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  completedAt?: Date;
}

interface TrackingTimelineProps {
  currentStatus: string;
  confirmedAt: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  estimatedDelivery?: Date;
  checkpoints?: Array<{
    status: string;
    timestamp: Date;
    location?: string;
  }>;
}

const STEPS: Omit<TimelineStep, "completedAt">[] = [
  { key: "CONFIRMED", label: "Commande confirmee", icon: Check },
  { key: "PREPARING", label: "En preparation", icon: Package },
  { key: "SHIPPED", label: "Expediee", icon: Package },
  { key: "IN_TRANSIT", label: "En cours de livraison", icon: Truck },
  { key: "DELIVERED", label: "Livree", icon: MapPin },
];

const STATUS_TO_STEP: Record<string, OrderStep> = {
  PAID: "PREPARING",
  SHIPPED: "SHIPPED",
  IN_TRANSIT: "IN_TRANSIT",
  DELIVERED: "DELIVERED",
};

export function TrackingTimeline({
  currentStatus,
  confirmedAt,
  shippedAt,
  deliveredAt,
  estimatedDelivery,
  checkpoints,
}: TrackingTimelineProps) {
  const currentStep = STATUS_TO_STEP[currentStatus] || "CONFIRMED";

  const getStepState = (stepKey: OrderStep): "completed" | "current" | "upcoming" => {
    const stepIndex = STEPS.findIndex((s) => s.key === stepKey);
    const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  const getStepDate = (stepKey: OrderStep): Date | undefined => {
    switch (stepKey) {
      case "CONFIRMED":
        return confirmedAt;
      case "SHIPPED":
        return shippedAt;
      case "DELIVERED":
        return deliveredAt;
      case "IN_TRANSIT":
        // Chercher dans les checkpoints
        return checkpoints?.find((c) => c.status === "InTransit")?.timestamp;
      default:
        return undefined;
    }
  };

  return (
    <div className="relative">
      {/* Ligne de progression */}
      <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-muted" />
      <div
        className="absolute left-4 top-8 w-0.5 bg-primary transition-all duration-500"
        style={{
          height: `${(STEPS.findIndex((s) => s.key === currentStep) / (STEPS.length - 1)) * 100}%`,
        }}
      />

      {/* Etapes */}
      <div className="space-y-6">
        {STEPS.map((step) => {
          const state = getStepState(step.key);
          const date = getStepDate(step.key);
          const Icon = step.icon;

          return (
            <div key={step.key} className="relative flex items-start gap-4 pl-10">
              {/* Icone */}
              <div
                className={cn(
                  "absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                  state === "completed" && "border-primary bg-primary text-primary-foreground",
                  state === "current" && "border-primary bg-background animate-pulse",
                  state === "upcoming" && "border-muted bg-muted text-muted-foreground"
                )}
              >
                {state === "completed" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>

              {/* Contenu */}
              <div className="flex-1 pb-2">
                <p
                  className={cn(
                    "font-medium",
                    state === "upcoming" && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                {date && (
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(date)}
                  </p>
                )}
                {step.key === "DELIVERED" && !deliveredAt && estimatedDelivery && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Livraison estimee: {formatDate(estimatedDelivery)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
  }).format(date);
}
```

### Composant TrackingEvents

```typescript
// src/components/account/tracking-events.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, MapPin, Package } from "lucide-react";

interface TrackingEvent {
  id: string;
  timestamp: Date;
  status: string;
  message: string;
  location?: string;
}

interface TrackingEventsProps {
  trackingNumber: string;
  carrier: string;
  carrierUrl: string;
  aftershipUrl: string;
  events: TrackingEvent[];
}

export function TrackingEvents({
  trackingNumber,
  carrier,
  carrierUrl,
  aftershipUrl,
  events,
}: TrackingEventsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Suivi du colis
        </CardTitle>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={carrierUrl} target="_blank" rel="noopener noreferrer">
              {carrier}
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
          <Button asChild size="sm">
            <a href={aftershipUrl} target="_blank" rel="noopener noreferrer">
              Suivi complet
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Numero de suivi: <span className="font-mono">{trackingNumber}</span>
        </p>

        {events.length > 0 ? (
          <div className="space-y-4">
            {events.slice(0, 5).map((event) => (
              <div key={event.id} className="flex gap-3 text-sm">
                <div className="flex-shrink-0 w-32 text-muted-foreground">
                  {formatEventDate(event.timestamp)}
                </div>
                <div className="flex-1">
                  <p>{event.message}</p>
                  {event.location && (
                    <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {events.length > 5 && (
              <p className="text-sm text-muted-foreground">
                + {events.length - 5} evenements anterieurs
              </p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            Aucun evenement de suivi pour le moment
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
```

### Use Case GetTrackingEvents

```typescript
// src/modules/orders/application/use-cases/get-tracking-events.use-case.ts
import { injectable, inject } from "tsyringe";
import { TrackingPort } from "../ports/tracking.port";
import { IOrderRepository } from "../../domain/repositories/order.repository.interface";

interface TrackingEventDTO {
  id: string;
  timestamp: Date;
  status: string;
  message: string;
  location?: string;
}

interface GetTrackingEventsInput {
  orderId: string;
  clientId: string;
}

interface GetTrackingEventsOutput {
  trackingNumber: string;
  carrier: string;
  carrierUrl: string;
  aftershipUrl: string;
  estimatedDelivery?: Date;
  events: TrackingEventDTO[];
}

@injectable()
export class GetTrackingEventsUseCase {
  constructor(
    @inject("IOrderRepository")
    private orderRepository: IOrderRepository,
    @inject("TrackingPort")
    private trackingPort: TrackingPort
  ) {}

  async execute(input: GetTrackingEventsInput): Promise<GetTrackingEventsOutput | null> {
    const order = await this.orderRepository.findById(input.orderId);

    if (!order || order.customerId !== input.clientId) {
      return null;
    }

    if (!order.trackingNumber || !order.carrier) {
      return null;
    }

    // Recuperer les evenements depuis AfterShip
    const tracking = await this.trackingPort.getTrackingDetails(
      order.trackingNumber,
      order.carrier
    );

    return {
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      carrierUrl: getCarrierUrl(order.carrier, order.trackingNumber),
      aftershipUrl: `https://track.aftership.com/${order.carrier}/${order.trackingNumber}`,
      estimatedDelivery: tracking.estimatedDelivery,
      events: tracking.checkpoints.map((cp, index) => ({
        id: `${order.id}-${index}`,
        timestamp: new Date(cp.checkpoint_time),
        status: cp.tag,
        message: cp.message,
        location: cp.location ? `${cp.city}, ${cp.country_name}` : undefined,
      })),
    };
  }
}

function getCarrierUrl(carrier: string, trackingNumber: string): string {
  const urls: Record<string, (n: string) => string> = {
    colissimo: (n) => `https://www.laposte.fr/outils/suivre-vos-envois?code=${n}`,
    "mondial-relay": (n) => `https://www.mondialrelay.fr/suivi-de-colis/?NumeroExpedition=${n}`,
    chronopost: (n) => `https://www.chronopost.fr/tracking-no-cms/suivi-page?liession=${n}`,
    ups: (n) => `https://www.ups.com/track?tracknum=${n}`,
    dhl: (n) => `https://www.dhl.com/fr-fr/home/tracking/tracking-express.html?submit=1&tracking-id=${n}`,
    fedex: (n) => `https://www.fedex.com/fedextrack/?trknbr=${n}`,
  };
  return urls[carrier]?.(trackingNumber) || "#";
}
```

### Extension Port Tracking

```typescript
// Ajouter dans src/modules/orders/application/ports/tracking.port.ts
export interface TrackingCheckpoint {
  tag: string;
  subtag?: string;
  message: string;
  checkpoint_time: string;
  city?: string;
  country_name?: string;
  location?: string;
}

export interface TrackingDetails {
  tag: string;
  subtag?: string;
  estimatedDelivery?: Date;
  checkpoints: TrackingCheckpoint[];
}

export interface TrackingPort {
  registerShipment(params: RegisterShipmentParams): Promise<{ id: string; status: string }>;
  getStatus(trackingNumber: string, carrier: string): Promise<TrackingStatus>;
  getTrackingDetails(trackingNumber: string, carrier: string): Promise<TrackingDetails>;
}
```

### Template Email Order Shipped

```typescript
// src/lib/emails/templates/order-shipped.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface OrderShippedEmailProps {
  customerName: string;
  orderNumber: string;
  creatorName: string;
  trackingNumber: string;
  carrier: string;
  trackingUrl: string;
  orderUrl: string;
  estimatedDelivery?: string;
}

export function OrderShippedEmail({
  customerName,
  orderNumber,
  creatorName,
  trackingNumber,
  carrier,
  trackingUrl,
  orderUrl,
  estimatedDelivery,
}: OrderShippedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Votre commande #{orderNumber} a ete expediee</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Votre commande est en route!</Heading>

          <Text style={text}>Bonjour {customerName},</Text>

          <Text style={text}>
            Bonne nouvelle! Votre commande #{orderNumber} chez{" "}
            <strong>{creatorName}</strong> vient d'etre expediee.
          </Text>

          <Section style={trackingSection}>
            <Text style={trackingLabel}>Numero de suivi</Text>
            <Text style={trackingNumber}>{trackingNumber}</Text>
            <Text style={carrierText}>
              Transporteur: <strong style={{ textTransform: "capitalize" }}>{carrier}</strong>
            </Text>
            {estimatedDelivery && (
              <Text style={estimatedText}>
                Livraison estimee: <strong>{estimatedDelivery}</strong>
              </Text>
            )}
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href={trackingUrl}>
              Suivre mon colis
            </Button>
          </Section>

          <Text style={text}>
            Vous pouvez egalement consulter le detail de votre commande sur{" "}
            <Link href={orderUrl}>votre espace client</Link>.
          </Text>

          <Text style={footer}>
            Merci pour votre confiance!
            <br />
            L'equipe Tyler
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = { backgroundColor: "#f6f9fc", fontFamily: "sans-serif" };
const container = { margin: "0 auto", padding: "40px 20px", maxWidth: "560px" };
const h1 = { color: "#1a1a1a", fontSize: "24px", fontWeight: "bold", margin: "0 0 24px" };
const text = { color: "#4a4a4a", fontSize: "16px", lineHeight: "24px", margin: "0 0 16px" };
const trackingSection = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  border: "1px solid #e5e5e5",
};
const trackingLabel = { color: "#6b7280", fontSize: "14px", margin: "0 0 8px" };
const trackingNumber = { color: "#1a1a1a", fontSize: "20px", fontFamily: "monospace", fontWeight: "bold", margin: "0 0 12px" };
const carrierText = { color: "#4a4a4a", fontSize: "14px", margin: "0 0 8px" };
const estimatedText = { color: "#4a4a4a", fontSize: "14px", margin: "0" };
const buttonSection = { textAlign: "center" as const, margin: "24px 0" };
const button = {
  backgroundColor: "#000000",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};
const footer = { color: "#6b7280", fontSize: "14px", margin: "32px 0 0" };

export default OrderShippedEmail;
```

### Template Email Order Delivered

```typescript
// src/lib/emails/templates/order-delivered.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface OrderDeliveredEmailProps {
  customerName: string;
  orderNumber: string;
  creatorName: string;
  orderUrl: string;
  reviewUrl: string;
}

export function OrderDeliveredEmail({
  customerName,
  orderNumber,
  creatorName,
  orderUrl,
  reviewUrl,
}: OrderDeliveredEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Votre commande #{orderNumber} a ete livree</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Votre commande est arrivee!</Heading>

          <Text style={text}>Bonjour {customerName},</Text>

          <Text style={text}>
            Votre commande #{orderNumber} chez <strong>{creatorName}</strong> vient
            d'etre livree. Nous esperons que vos articles vous plairont!
          </Text>

          <Section style={noteSection}>
            <Text style={noteText}>
              Si vous rencontrez un probleme avec votre commande, vous avez{" "}
              <strong>48 heures</strong> pour nous le signaler via votre espace client.
            </Text>
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href={orderUrl}>
              Voir ma commande
            </Button>
          </Section>

          <Text style={text}>
            Satisfait de votre achat?{" "}
            <Link href={reviewUrl}>Laissez un avis</Link> pour aider d'autres
            acheteurs et soutenir {creatorName}.
          </Text>

          <Text style={footer}>
            Merci pour votre achat!
            <br />
            L'equipe Tyler
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles (similaires a order-shipped)
const main = { backgroundColor: "#f6f9fc", fontFamily: "sans-serif" };
const container = { margin: "0 auto", padding: "40px 20px", maxWidth: "560px" };
const h1 = { color: "#1a1a1a", fontSize: "24px", fontWeight: "bold", margin: "0 0 24px" };
const text = { color: "#4a4a4a", fontSize: "16px", lineHeight: "24px", margin: "0 0 16px" };
const noteSection = {
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
  border: "1px solid #fcd34d",
};
const noteText = { color: "#92400e", fontSize: "14px", margin: "0" };
const buttonSection = { textAlign: "center" as const, margin: "24px 0" };
const button = {
  backgroundColor: "#000000",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};
const footer = { color: "#6b7280", fontSize: "14px", margin: "32px 0 0" };

export default OrderDeliveredEmail;
```

### Integration dans UpdateTrackingStatusUseCase

```typescript
// Modifier src/modules/orders/application/use-cases/update-tracking-status.use-case.ts
import { OrderShippedEmail } from "@/lib/emails/templates/order-shipped";
import { OrderDeliveredEmail } from "@/lib/emails/templates/order-delivered";

// Dans la methode execute(), apres avoir mis a jour le statut:

// Pour SHIPPED
if (input.trackingStatus === "SHIPPED" || input.trackingSubtag?.startsWith("InTransit")) {
  await this.emailService.send({
    to: order.customerEmail,
    subject: `Votre commande #${order.orderNumber} a ete expediee`,
    react: OrderShippedEmail({
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      creatorName: order.creatorName,
      trackingNumber: order.trackingNumber!,
      carrier: order.carrier!,
      trackingUrl: `https://track.aftership.com/${order.carrier}/${order.trackingNumber}`,
      orderUrl: `${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${order.id}`,
      estimatedDelivery: order.estimatedDelivery?.toLocaleDateString("fr-FR"),
    }),
  });
}

// Pour DELIVERED
if (input.trackingSubtag === "Delivered_001" && input.deliveredAt) {
  await this.emailService.send({
    to: order.customerEmail,
    subject: `Votre commande #${order.orderNumber} a ete livree`,
    react: OrderDeliveredEmail({
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      creatorName: order.creatorName,
      orderUrl: `${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${order.id}`,
      reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/c/${order.creatorSlug}/reviews/new?order=${order.id}`,
    }),
  });
}
```

### Page Detail Commande avec Timeline

```typescript
// src/app/(account)/account/orders/[id]/page.tsx
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth/auth-options";
import { container } from "@/lib/di/container";
import { GetClientOrderDetailUseCase } from "@/modules/orders/application/use-cases/get-client-order-detail.use-case";
import { GetTrackingEventsUseCase } from "@/modules/orders/application/use-cases/get-tracking-events.use-case";
import { OrderDetail } from "@/components/account/order-detail";
import { TrackingTimeline } from "@/components/account/tracking-timeline";
import { TrackingEvents } from "@/components/account/tracking-events";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/account/orders");
  }

  const { id } = await params;

  const orderUseCase = container.resolve(GetClientOrderDetailUseCase);
  const order = await orderUseCase.execute({
    orderId: id,
    clientId: session.user.id,
  });

  if (!order) {
    notFound();
  }

  // Recuperer les evenements de tracking si disponible
  let trackingData = null;
  if (order.tracking) {
    const trackingUseCase = container.resolve(GetTrackingEventsUseCase);
    trackingData = await trackingUseCase.execute({
      orderId: id,
      clientId: session.user.id,
    });
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/account/orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux commandes
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="lg:col-span-2">
          <OrderDetail order={order} />
        </div>

        {/* Sidebar - Timeline et Tracking */}
        <div className="space-y-6">
          <TrackingTimeline
            currentStatus={order.status}
            confirmedAt={order.createdAt}
            shippedAt={order.tracking ? new Date() : undefined} // A recuperer depuis order
            deliveredAt={order.deliveredAt}
            estimatedDelivery={trackingData?.estimatedDelivery}
            checkpoints={trackingData?.events.map((e) => ({
              status: e.status,
              timestamp: e.timestamp,
              location: e.location,
            }))}
          />

          {trackingData && (
            <TrackingEvents
              trackingNumber={trackingData.trackingNumber}
              carrier={trackingData.carrier}
              carrierUrl={trackingData.carrierUrl}
              aftershipUrl={trackingData.aftershipUrl}
              events={trackingData.events}
            />
          )}
        </div>
      </div>
    </div>
  );
}
```

### References

- [Source: architecture.md#AfterShip Integration]
- [Source: prd.md#FR46 - Suivi commande client]
- [Source: epics.md#Story 12.2]
- [Source: Story 9.1 - Integration AfterShip]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story creee | Claude Opus 4.5 |
