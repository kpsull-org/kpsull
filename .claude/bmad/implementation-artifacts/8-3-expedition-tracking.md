# Story 8.3: Expedition avec Numero de Suivi

Status: ready-for-dev

## Story

As a Createur,
I want marquer une commande comme expediee avec un numero de suivi,
so that mon client puisse suivre son colis.

## Acceptance Criteria

1. **AC1 - Formulaire d'expedition**
   - **Given** une commande au statut PAID
   - **When** le Createur clique sur "Expedier"
   - **Then** un formulaire s'affiche avec: selection transporteur, numero de suivi

2. **AC2 - Mise a jour statut SHIPPED**
   - **Given** le formulaire rempli
   - **When** le Createur valide l'expedition
   - **Then** le statut passe a SHIPPED
   - **And** la date shippedAt est enregistree

3. **AC3 - Email client avec lien suivi**
   - **Given** l'expedition validee
   - **When** le statut passe a SHIPPED
   - **Then** un email est envoye au client
   - **And** l'email contient le lien de suivi du transporteur

4. **AC4 - Affichage infos expedition**
   - **Given** une commande expediee
   - **When** le Createur consulte le detail
   - **Then** il voit: transporteur, numero suivi, lien suivi, date expedition

## Tasks / Subtasks

- [ ] **Task 1: Creer l'use case ShipOrder** (AC: #2)
  - [ ] 1.1 Creer `src/modules/orders/application/use-cases/ship-order.use-case.ts`
  - [ ] 1.2 Valider que la commande est au statut PAID
  - [ ] 1.3 Mettre a jour le statut et les infos expedition

- [ ] **Task 2: Creer le service de tracking URL** (AC: #3, #4)
  - [ ] 2.1 Creer `src/modules/orders/domain/services/tracking-url.service.ts`
  - [ ] 2.2 Implementer la generation d'URL par transporteur
  - [ ] 2.3 Supporter les transporteurs: Colissimo, Mondial Relay, Chronopost, UPS, DHL

- [ ] **Task 3: Creer la page d'expedition** (AC: #1)
  - [ ] 3.1 Creer `src/app/(dashboard)/dashboard/orders/[id]/ship/page.tsx`
  - [ ] 3.2 Implementer le formulaire
  - [ ] 3.3 Gerer la validation et redirection

- [ ] **Task 4: Creer le composant ShipOrderForm** (AC: #1)
  - [ ] 4.1 Creer `src/components/orders/ship-order-form.tsx`
  - [ ] 4.2 Implementer la selection transporteur
  - [ ] 4.3 Implementer la saisie numero de suivi
  - [ ] 4.4 Ajouter la validation cote client

- [ ] **Task 5: Creer le service d'envoi email** (AC: #3)
  - [ ] 5.1 Creer `src/modules/notifications/application/services/order-notification.service.ts`
  - [ ] 5.2 Creer le template email expedition
  - [ ] 5.3 Integrer avec Resend

- [ ] **Task 6: Creer la Server Action** (AC: #2, #3)
  - [ ] 6.1 Creer `src/app/(dashboard)/dashboard/orders/[id]/ship/actions.ts`
  - [ ] 6.2 Orchestrer use case + notification
  - [ ] 6.3 Gerer les erreurs

- [ ] **Task 7: Ecrire les tests** (AC: #1-4)
  - [ ] 7.1 Tests unitaires pour ShipOrderUseCase
  - [ ] 7.2 Tests unitaires pour TrackingUrlService
  - [ ] 7.3 Tests d'integration

## Dev Notes

### Use Case ShipOrder

```typescript
// src/modules/orders/application/use-cases/ship-order.use-case.ts
import { injectable, inject } from "tsyringe";
import { IOrderRepository } from "../../domain/repositories/order.repository.interface";
import { TrackingUrlService } from "../../domain/services/tracking-url.service";
import { Carrier } from "../../domain/value-objects/carrier.vo";
import { InvalidOperationError, NotFoundError, UnauthorizedError } from "@/shared/errors";

interface ShipOrderInput {
  orderId: string;
  creatorId: string;
  carrier: Carrier;
  trackingNumber: string;
}

interface ShipOrderOutput {
  orderId: string;
  orderNumber: string;
  trackingUrl: string;
  customerEmail: string;
  customerName: string;
}

@injectable()
export class ShipOrderUseCase {
  constructor(
    @inject("IOrderRepository")
    private orderRepository: IOrderRepository,
    @inject("TrackingUrlService")
    private trackingUrlService: TrackingUrlService
  ) {}

  async execute(input: ShipOrderInput): Promise<ShipOrderOutput> {
    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      throw new NotFoundError("Commande non trouvee");
    }

    if (order.creatorId !== input.creatorId) {
      throw new UnauthorizedError("Acces non autorise a cette commande");
    }

    if (order.status !== "PAID") {
      throw new InvalidOperationError(
        "Seule une commande payee peut etre expediee"
      );
    }

    // Generate tracking URL
    const trackingUrl = this.trackingUrlService.generateUrl(
      input.carrier,
      input.trackingNumber
    );

    // Update order
    order.ship({
      carrier: input.carrier,
      trackingNumber: input.trackingNumber,
      trackingUrl,
    });

    await this.orderRepository.update(order);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      trackingUrl,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
    };
  }
}
```

### Service Tracking URL

```typescript
// src/modules/orders/domain/services/tracking-url.service.ts
import { injectable } from "tsyringe";
import { Carrier } from "../value-objects/carrier.vo";

interface CarrierConfig {
  name: string;
  trackingUrlTemplate: string;
  trackingNumberPattern: RegExp;
}

@injectable()
export class TrackingUrlService {
  private readonly carriers: Record<string, CarrierConfig> = {
    COLISSIMO: {
      name: "Colissimo",
      trackingUrlTemplate: "https://www.laposte.fr/outils/suivre-vos-envois?code={trackingNumber}",
      trackingNumberPattern: /^[A-Z0-9]{11,15}$/,
    },
    MONDIAL_RELAY: {
      name: "Mondial Relay",
      trackingUrlTemplate: "https://www.mondialrelay.fr/suivi-de-colis/?numeroExpedition={trackingNumber}",
      trackingNumberPattern: /^[0-9]{8,12}$/,
    },
    CHRONOPOST: {
      name: "Chronopost",
      trackingUrlTemplate: "https://www.chronopost.fr/tracking-no-cms/suivi-page?liession={trackingNumber}",
      trackingNumberPattern: /^[A-Z]{2}[0-9]{9}[A-Z]{2}$/,
    },
    UPS: {
      name: "UPS",
      trackingUrlTemplate: "https://www.ups.com/track?tracknum={trackingNumber}",
      trackingNumberPattern: /^1Z[A-Z0-9]{16}$/,
    },
    DHL: {
      name: "DHL",
      trackingUrlTemplate: "https://www.dhl.com/fr-fr/home/tracking.html?tracking-id={trackingNumber}",
      trackingNumberPattern: /^[0-9]{10,22}$/,
    },
    OTHER: {
      name: "Autre",
      trackingUrlTemplate: "",
      trackingNumberPattern: /^.+$/,
    },
  };

  generateUrl(carrier: Carrier, trackingNumber: string): string {
    const config = this.carriers[carrier];

    if (!config || carrier === "OTHER") {
      return "";
    }

    return config.trackingUrlTemplate.replace("{trackingNumber}", trackingNumber);
  }

  validateTrackingNumber(carrier: Carrier, trackingNumber: string): boolean {
    const config = this.carriers[carrier];

    if (!config) {
      return false;
    }

    return config.trackingNumberPattern.test(trackingNumber);
  }

  getCarrierName(carrier: Carrier): string {
    return this.carriers[carrier]?.name || carrier;
  }

  getSupportedCarriers(): Array<{ value: Carrier; label: string }> {
    return Object.entries(this.carriers).map(([value, config]) => ({
      value: value as Carrier,
      label: config.name,
    }));
  }
}
```

### Value Object Carrier

```typescript
// src/modules/orders/domain/value-objects/carrier.vo.ts
export type Carrier =
  | "COLISSIMO"
  | "MONDIAL_RELAY"
  | "CHRONOPOST"
  | "UPS"
  | "DHL"
  | "OTHER";

export const CARRIERS: Carrier[] = [
  "COLISSIMO",
  "MONDIAL_RELAY",
  "CHRONOPOST",
  "UPS",
  "DHL",
  "OTHER",
];

export function isValidCarrier(value: string): value is Carrier {
  return CARRIERS.includes(value as Carrier);
}
```

### Page d'Expedition

```typescript
// src/app/(dashboard)/dashboard/orders/[id]/ship/page.tsx
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { container } from "@/lib/di/container";
import { GetOrderDetailsUseCase } from "@/modules/orders/application/use-cases/get-order-details.use-case";
import { ShipOrderForm } from "@/components/orders/ship-order-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ShipOrderPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.creatorId) {
    notFound();
  }

  const { id } = await params;

  const useCase = container.resolve(GetOrderDetailsUseCase);

  try {
    const order = await useCase.execute({
      orderId: id,
      creatorId: session.user.creatorId,
    });

    if (order.status !== "PAID") {
      redirect(`/dashboard/orders/${id}`);
    }

    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          Expedier la commande {order.orderNumber}
        </h1>

        <ShipOrderForm orderId={id} orderNumber={order.orderNumber} />
      </div>
    );
  } catch {
    notFound();
  }
}
```

### Composant ShipOrderForm

```typescript
// src/components/orders/ship-order-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { shipOrder } from "./actions";

const CARRIERS = [
  { value: "COLISSIMO", label: "Colissimo" },
  { value: "MONDIAL_RELAY", label: "Mondial Relay" },
  { value: "CHRONOPOST", label: "Chronopost" },
  { value: "UPS", label: "UPS" },
  { value: "DHL", label: "DHL" },
  { value: "OTHER", label: "Autre" },
];

const shipOrderSchema = z.object({
  carrier: z.enum(["COLISSIMO", "MONDIAL_RELAY", "CHRONOPOST", "UPS", "DHL", "OTHER"]),
  trackingNumber: z.string().min(1, "Le numero de suivi est requis"),
});

type ShipOrderFormData = z.infer<typeof shipOrderSchema>;

interface ShipOrderFormProps {
  orderId: string;
  orderNumber: string;
}

export function ShipOrderForm({ orderId, orderNumber }: ShipOrderFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ShipOrderFormData>({
    resolver: zodResolver(shipOrderSchema),
    defaultValues: {
      carrier: "COLISSIMO",
      trackingNumber: "",
    },
  });

  const selectedCarrier = watch("carrier");

  const onSubmit = async (data: ShipOrderFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await shipOrder(orderId, data);

      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/dashboard/orders/${orderId}`);
        router.refresh();
      }
    } catch (err) {
      setError("Une erreur est survenue lors de l'expedition");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Informations d'expedition
        </CardTitle>
        <CardDescription>
          Renseignez les informations de suivi pour la commande {orderNumber}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="carrier">Transporteur</Label>
            <Select
              value={selectedCarrier}
              onValueChange={(value) => setValue("carrier", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectionnez un transporteur" />
              </SelectTrigger>
              <SelectContent>
                {CARRIERS.map((carrier) => (
                  <SelectItem key={carrier.value} value={carrier.value}>
                    {carrier.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trackingNumber">Numero de suivi</Label>
            <Input
              id="trackingNumber"
              placeholder="Ex: 1Z999AA10123456784"
              {...register("trackingNumber")}
            />
            {errors.trackingNumber && (
              <p className="text-sm text-destructive">{errors.trackingNumber.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Le client recevra un email avec le lien de suivi
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmer l'expedition
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Server Action

```typescript
// src/app/(dashboard)/dashboard/orders/[id]/ship/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { container } from "@/lib/di/container";
import { ShipOrderUseCase } from "@/modules/orders/application/use-cases/ship-order.use-case";
import { OrderNotificationService } from "@/modules/notifications/application/services/order-notification.service";
import { Carrier } from "@/modules/orders/domain/value-objects/carrier.vo";

interface ShipOrderData {
  carrier: Carrier;
  trackingNumber: string;
}

export async function shipOrder(orderId: string, data: ShipOrderData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.creatorId) {
    return { error: "Non autorise" };
  }

  try {
    const shipOrderUseCase = container.resolve(ShipOrderUseCase);
    const notificationService = container.resolve(OrderNotificationService);

    const result = await shipOrderUseCase.execute({
      orderId,
      creatorId: session.user.creatorId,
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
    });

    // Send notification email
    await notificationService.sendShippingConfirmation({
      to: result.customerEmail,
      customerName: result.customerName,
      orderNumber: result.orderNumber,
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
      trackingUrl: result.trackingUrl,
    });

    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath("/dashboard/orders");

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Une erreur est survenue" };
  }
}
```

### Service de Notification

```typescript
// src/modules/notifications/application/services/order-notification.service.ts
import { injectable, inject } from "tsyringe";
import { IEmailService } from "../../domain/services/email.service.interface";

interface ShippingConfirmationData {
  to: string;
  customerName: string;
  orderNumber: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
}

@injectable()
export class OrderNotificationService {
  constructor(
    @inject("IEmailService")
    private emailService: IEmailService
  ) {}

  async sendShippingConfirmation(data: ShippingConfirmationData): Promise<void> {
    await this.emailService.send({
      to: data.to,
      subject: `Votre commande ${data.orderNumber} a ete expediee`,
      template: "shipping-confirmation",
      data: {
        customerName: data.customerName,
        orderNumber: data.orderNumber,
        carrier: data.carrier,
        trackingNumber: data.trackingNumber,
        trackingUrl: data.trackingUrl,
      },
    });
  }
}
```

### Template Email (React Email)

```typescript
// src/emails/shipping-confirmation.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface ShippingConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
}

export function ShippingConfirmationEmail({
  customerName,
  orderNumber,
  carrier,
  trackingNumber,
  trackingUrl,
}: ShippingConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Votre commande {orderNumber} a ete expediee</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Bonne nouvelle, {customerName} !</Heading>

          <Text style={text}>
            Votre commande <strong>{orderNumber}</strong> a ete expediee.
          </Text>

          <Section style={trackingSection}>
            <Text style={trackingLabel}>Transporteur</Text>
            <Text style={trackingValue}>{carrier}</Text>

            <Text style={trackingLabel}>Numero de suivi</Text>
            <Text style={trackingValue}>{trackingNumber}</Text>
          </Section>

          {trackingUrl && (
            <Button style={button} href={trackingUrl}>
              Suivre mon colis
            </Button>
          )}

          <Text style={footer}>
            Merci pour votre confiance !
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f9fc", fontFamily: "sans-serif" };
const container = { backgroundColor: "#ffffff", margin: "0 auto", padding: "40px", borderRadius: "8px" };
const h1 = { color: "#333", fontSize: "24px" };
const text = { color: "#555", fontSize: "16px", lineHeight: "24px" };
const trackingSection = { backgroundColor: "#f9f9f9", padding: "20px", borderRadius: "8px", margin: "20px 0" };
const trackingLabel = { color: "#888", fontSize: "12px", margin: "0 0 4px 0" };
const trackingValue = { color: "#333", fontSize: "16px", fontWeight: "bold", margin: "0 0 16px 0" };
const button = { backgroundColor: "#000", color: "#fff", padding: "12px 24px", borderRadius: "6px", textDecoration: "none" };
const footer = { color: "#888", fontSize: "14px", marginTop: "32px" };
```

### References

- [Source: architecture.md#Order Management]
- [Source: prd.md#FR37 - Expedition commandes]
- [Source: epics.md#Story 8.3]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story creee | Claude Opus 4.5 |
