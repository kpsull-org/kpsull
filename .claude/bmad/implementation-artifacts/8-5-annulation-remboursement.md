# Story 8.5: Annulation de Commande avec Remboursement

Status: ready-for-dev

## Story

As a Createur,
I want annuler une commande et rembourser automatiquement le client,
so that je puisse gerer les cas ou je ne peux pas honorer une commande.

## Acceptance Criteria

1. **AC1 - Confirmation avec raison obligatoire**
   - **Given** une commande annulable (PENDING ou PAID)
   - **When** le Createur clique sur "Annuler"
   - **Then** une modale de confirmation s'affiche
   - **And** une raison d'annulation est obligatoire

2. **AC2 - Refund Stripe automatique**
   - **Given** la confirmation validee
   - **When** la commande est au statut PAID
   - **Then** un remboursement Stripe est automatiquement cree
   - **And** le montant rembourse = totalAmount

3. **AC3 - Mise a jour statut CANCELED**
   - **Given** l'annulation confirmee
   - **When** le remboursement est effectue (ou statut PENDING)
   - **Then** le statut passe a CANCELED
   - **And** la date canceledAt est enregistree
   - **And** la raison est stockee

4. **AC4 - Email client**
   - **Given** l'annulation effectuee
   - **When** le statut passe a CANCELED
   - **Then** un email est envoye au client
   - **And** l'email contient la raison et les infos de remboursement

5. **AC5 - Non disponible si deja expedie**
   - **Given** une commande au statut SHIPPED ou DELIVERED
   - **When** le Createur consulte la commande
   - **Then** le bouton "Annuler" n'est pas affiche

## Tasks / Subtasks

- [ ] **Task 1: Creer l'use case CancelOrder** (AC: #2, #3)
  - [ ] 1.1 Creer `src/modules/orders/application/use-cases/cancel-order.use-case.ts`
  - [ ] 1.2 Valider le statut de la commande
  - [ ] 1.3 Orchestrer le refund Stripe si necessaire
  - [ ] 1.4 Mettre a jour le statut

- [ ] **Task 2: Creer le service StripeRefund** (AC: #2)
  - [ ] 2.1 Creer `src/modules/payments/application/services/stripe-refund.service.ts`
  - [ ] 2.2 Implementer la creation de refund
  - [ ] 2.3 Gerer les erreurs Stripe

- [ ] **Task 3: Creer la page d'annulation** (AC: #1)
  - [ ] 3.1 Creer `src/app/(dashboard)/dashboard/orders/[id]/cancel/page.tsx`
  - [ ] 3.2 Afficher le recapitulatif de la commande
  - [ ] 3.3 Implementer le formulaire de raison

- [ ] **Task 4: Creer le composant CancelOrderForm** (AC: #1)
  - [ ] 4.1 Creer `src/components/orders/cancel-order-form.tsx`
  - [ ] 4.2 Afficher les options de raison predefinies
  - [ ] 4.3 Permettre une raison personnalisee
  - [ ] 4.4 Modale de confirmation finale

- [ ] **Task 5: Ajouter l'email de notification** (AC: #4)
  - [ ] 5.1 Creer le template email annulation
  - [ ] 5.2 Integrer dans OrderNotificationService
  - [ ] 5.3 Inclure les infos de remboursement

- [ ] **Task 6: Proteger le bouton Annuler** (AC: #5)
  - [ ] 6.1 Mettre a jour OrderHeader
  - [ ] 6.2 Cacher le bouton si SHIPPED/DELIVERED

- [ ] **Task 7: Ecrire les tests** (AC: #1-5)
  - [ ] 7.1 Tests unitaires pour CancelOrderUseCase
  - [ ] 7.2 Tests d'integration avec mock Stripe
  - [ ] 7.3 Tests pour les differents statuts

## Dev Notes

### Use Case CancelOrder

```typescript
// src/modules/orders/application/use-cases/cancel-order.use-case.ts
import { injectable, inject } from "tsyringe";
import { IOrderRepository } from "../../domain/repositories/order.repository.interface";
import { IStripeRefundService } from "@/modules/payments/domain/services/stripe-refund.service.interface";
import { CancelReason } from "../../domain/value-objects/cancel-reason.vo";
import { InvalidOperationError, NotFoundError, UnauthorizedError } from "@/shared/errors";

interface CancelOrderInput {
  orderId: string;
  creatorId: string;
  reason: CancelReason;
  customReason?: string;
}

interface CancelOrderOutput {
  orderId: string;
  orderNumber: string;
  status: "CANCELED";
  refundId: string | null;
  refundAmount: number | null;
  customerEmail: string;
  customerName: string;
  reason: string;
}

@injectable()
export class CancelOrderUseCase {
  constructor(
    @inject("IOrderRepository")
    private orderRepository: IOrderRepository,
    @inject("IStripeRefundService")
    private stripeRefundService: IStripeRefundService
  ) {}

  async execute(input: CancelOrderInput): Promise<CancelOrderOutput> {
    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      throw new NotFoundError("Commande non trouvee");
    }

    if (order.creatorId !== input.creatorId) {
      throw new UnauthorizedError("Acces non autorise a cette commande");
    }

    // Validate cancellable status
    if (!["PENDING", "PAID"].includes(order.status)) {
      throw new InvalidOperationError(
        "Seule une commande en attente ou payee peut etre annulee"
      );
    }

    let refundId: string | null = null;
    let refundAmount: number | null = null;

    // Process refund if order was paid
    if (order.status === "PAID" && order.stripePaymentIntentId) {
      const refund = await this.stripeRefundService.createRefund({
        paymentIntentId: order.stripePaymentIntentId,
        amount: order.totalAmount,
        reason: "requested_by_customer",
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          cancelReason: input.reason,
        },
      });

      refundId = refund.id;
      refundAmount = refund.amount;
    }

    // Build reason text
    const reasonText = input.reason === "OTHER" && input.customReason
      ? input.customReason
      : CANCEL_REASON_LABELS[input.reason];

    // Cancel the order
    order.cancel({
      reason: reasonText,
      refundId,
    });

    await this.orderRepository.update(order);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: "CANCELED",
      refundId,
      refundAmount,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      reason: reasonText,
    };
  }
}

const CANCEL_REASON_LABELS: Record<CancelReason, string> = {
  OUT_OF_STOCK: "Produit en rupture de stock",
  CANNOT_FULFILL: "Impossible de preparer la commande",
  CUSTOMER_REQUEST: "A la demande du client",
  FRAUD_SUSPECTED: "Suspicion de fraude",
  OTHER: "Autre raison",
};
```

### Value Object CancelReason

```typescript
// src/modules/orders/domain/value-objects/cancel-reason.vo.ts
export type CancelReason =
  | "OUT_OF_STOCK"
  | "CANNOT_FULFILL"
  | "CUSTOMER_REQUEST"
  | "FRAUD_SUSPECTED"
  | "OTHER";

export const CANCEL_REASONS: CancelReason[] = [
  "OUT_OF_STOCK",
  "CANNOT_FULFILL",
  "CUSTOMER_REQUEST",
  "FRAUD_SUSPECTED",
  "OTHER",
];

export const CANCEL_REASON_OPTIONS = [
  { value: "OUT_OF_STOCK", label: "Produit en rupture de stock" },
  { value: "CANNOT_FULFILL", label: "Impossible de preparer la commande" },
  { value: "CUSTOMER_REQUEST", label: "A la demande du client" },
  { value: "FRAUD_SUSPECTED", label: "Suspicion de fraude" },
  { value: "OTHER", label: "Autre raison (a preciser)" },
];

export function isValidCancelReason(value: string): value is CancelReason {
  return CANCEL_REASONS.includes(value as CancelReason);
}
```

### Service Stripe Refund

```typescript
// src/modules/payments/application/services/stripe-refund.service.ts
import { injectable, inject } from "tsyringe";
import Stripe from "stripe";
import { IStripeRefundService, CreateRefundInput, RefundResult } from "../../domain/services/stripe-refund.service.interface";

@injectable()
export class StripeRefundService implements IStripeRefundService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-12-18.acacia",
    });
  }

  async createRefund(input: CreateRefundInput): Promise<RefundResult> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: input.paymentIntentId,
        amount: input.amount, // In cents
        reason: input.reason,
        metadata: input.metadata,
      });

      return {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        createdAt: new Date(refund.created * 1000),
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new Error(`Erreur Stripe: ${error.message}`);
      }
      throw error;
    }
  }
}
```

### Interface Stripe Refund Service

```typescript
// src/modules/payments/domain/services/stripe-refund.service.interface.ts
export interface CreateRefundInput {
  paymentIntentId: string;
  amount: number;
  reason: "requested_by_customer" | "duplicate" | "fraudulent";
  metadata?: Record<string, string>;
}

export interface RefundResult {
  id: string;
  amount: number;
  status: string;
  createdAt: Date;
}

export interface IStripeRefundService {
  createRefund(input: CreateRefundInput): Promise<RefundResult>;
}
```

### Page d'Annulation

```typescript
// src/app/(dashboard)/dashboard/orders/[id]/cancel/page.tsx
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { container } from "@/lib/di/container";
import { GetOrderDetailsUseCase } from "@/modules/orders/application/use-cases/get-order-details.use-case";
import { CancelOrderForm } from "@/components/orders/cancel-order-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CancelOrderPage({ params }: PageProps) {
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

    // Cannot cancel shipped/delivered orders
    if (!["PENDING", "PAID"].includes(order.status)) {
      redirect(`/dashboard/orders/${id}`);
    }

    const willRefund = order.status === "PAID";

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">
          Annuler la commande {order.orderNumber}
        </h1>

        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Attention - Action irreversible
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Vous etes sur le point d'annuler cette commande.</p>

            {willRefund && (
              <div className="p-4 bg-background rounded-lg">
                <p className="font-medium">Un remboursement sera effectue :</p>
                <p className="text-2xl font-bold mt-2">
                  {formatPrice(order.totalAmount)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Le client sera rembourse sous 5-10 jours ouvrables
                </p>
              </div>
            )}

            <div className="p-4 bg-background rounded-lg">
              <p className="font-medium">Client concerne :</p>
              <p>{order.customer.name}</p>
              <p className="text-muted-foreground">{order.customer.email}</p>
            </div>
          </CardContent>
        </Card>

        <CancelOrderForm
          orderId={id}
          orderNumber={order.orderNumber}
          willRefund={willRefund}
          refundAmount={order.totalAmount}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
```

### Composant CancelOrderForm

```typescript
// src/components/orders/cancel-order-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CANCEL_REASON_OPTIONS, CancelReason } from "@/modules/orders/domain/value-objects/cancel-reason.vo";
import { cancelOrder } from "./actions";
import { formatPrice } from "@/lib/utils/format";

const cancelOrderSchema = z.object({
  reason: z.enum(["OUT_OF_STOCK", "CANNOT_FULFILL", "CUSTOMER_REQUEST", "FRAUD_SUSPECTED", "OTHER"]),
  customReason: z.string().optional(),
}).refine(
  (data) => data.reason !== "OTHER" || (data.customReason && data.customReason.trim().length >= 10),
  {
    message: "Veuillez preciser la raison (minimum 10 caracteres)",
    path: ["customReason"],
  }
);

type CancelOrderFormData = z.infer<typeof cancelOrderSchema>;

interface CancelOrderFormProps {
  orderId: string;
  orderNumber: string;
  willRefund: boolean;
  refundAmount: number;
}

export function CancelOrderForm({
  orderId,
  orderNumber,
  willRefund,
  refundAmount,
}: CancelOrderFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CancelOrderFormData | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CancelOrderFormData>({
    resolver: zodResolver(cancelOrderSchema),
    defaultValues: {
      reason: "OUT_OF_STOCK",
      customReason: "",
    },
  });

  const selectedReason = watch("reason");

  const onSubmit = (data: CancelOrderFormData) => {
    setFormData(data);
    setShowConfirmation(true);
  };

  const confirmCancellation = async () => {
    if (!formData) return;

    setIsSubmitting(true);
    setShowConfirmation(false);
    setError(null);

    try {
      const result = await cancelOrder(orderId, formData);

      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/dashboard/orders/${orderId}`);
        router.refresh();
      }
    } catch (err) {
      setError("Une erreur est survenue lors de l'annulation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Raison de l'annulation</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <RadioGroup
              value={selectedReason}
              onValueChange={(value) => setValue("reason", value as CancelReason)}
              className="space-y-3"
            >
              {CANCEL_REASON_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-3">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {selectedReason === "OTHER" && (
              <div className="space-y-2">
                <Label htmlFor="customReason">Precisez la raison</Label>
                <Textarea
                  id="customReason"
                  placeholder="Expliquez pourquoi vous annulez cette commande..."
                  rows={3}
                  {...register("customReason")}
                />
                {errors.customReason && (
                  <p className="text-sm text-destructive">{errors.customReason.message}</p>
                )}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Retour
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Annuler la commande
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'annulation</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Etes-vous sur de vouloir annuler la commande <strong>{orderNumber}</strong> ?
              </p>
              {willRefund && (
                <p>
                  Un remboursement de <strong>{formatPrice(refundAmount)}</strong> sera effectue.
                </p>
              )}
              <p className="text-destructive font-medium">
                Cette action est irreversible.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancellation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmer l'annulation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

### Server Action

```typescript
// src/app/(dashboard)/dashboard/orders/[id]/cancel/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { container } from "@/lib/di/container";
import { CancelOrderUseCase } from "@/modules/orders/application/use-cases/cancel-order.use-case";
import { OrderNotificationService } from "@/modules/notifications/application/services/order-notification.service";
import { CancelReason } from "@/modules/orders/domain/value-objects/cancel-reason.vo";

interface CancelOrderData {
  reason: CancelReason;
  customReason?: string;
}

export async function cancelOrder(orderId: string, data: CancelOrderData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.creatorId) {
    return { error: "Non autorise" };
  }

  try {
    const cancelOrderUseCase = container.resolve(CancelOrderUseCase);
    const notificationService = container.resolve(OrderNotificationService);

    const result = await cancelOrderUseCase.execute({
      orderId,
      creatorId: session.user.creatorId,
      reason: data.reason,
      customReason: data.customReason,
    });

    // Send notification email
    await notificationService.sendCancellationConfirmation({
      to: result.customerEmail,
      customerName: result.customerName,
      orderNumber: result.orderNumber,
      reason: result.reason,
      refundAmount: result.refundAmount,
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

### Template Email Annulation

```typescript
// src/emails/cancellation-confirmation.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { formatPrice } from "@/lib/utils/format";

interface CancellationConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  reason: string;
  refundAmount: number | null;
}

export function CancellationConfirmationEmail({
  customerName,
  orderNumber,
  reason,
  refundAmount,
}: CancellationConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Votre commande {orderNumber} a ete annulee</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Commande annulee</Heading>

          <Text style={text}>
            Bonjour {customerName},
          </Text>

          <Text style={text}>
            Nous vous informons que votre commande <strong>{orderNumber}</strong> a ete annulee.
          </Text>

          <Section style={reasonSection}>
            <Text style={reasonLabel}>Raison de l'annulation :</Text>
            <Text style={reasonText}>{reason}</Text>
          </Section>

          {refundAmount && (
            <Section style={refundSection}>
              <Text style={refundLabel}>Remboursement</Text>
              <Text style={refundAmount}>{formatPrice(refundAmount)}</Text>
              <Text style={refundNote}>
                Le remboursement sera credite sur votre moyen de paiement
                initial sous 5 a 10 jours ouvrables.
              </Text>
            </Section>
          )}

          <Text style={text}>
            Nous nous excusons pour la gene occasionnee.
          </Text>

          <Text style={footer}>
            L'equipe Kpsull
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f9fc", fontFamily: "sans-serif" };
const container = { backgroundColor: "#ffffff", margin: "0 auto", padding: "40px", borderRadius: "8px" };
const h1 = { color: "#dc2626", fontSize: "24px" };
const text = { color: "#555", fontSize: "16px", lineHeight: "24px" };
const reasonSection = { backgroundColor: "#fef2f2", padding: "20px", borderRadius: "8px", margin: "20px 0", borderLeft: "4px solid #dc2626" };
const reasonLabel = { color: "#888", fontSize: "12px", margin: "0 0 4px 0" };
const reasonText = { color: "#333", fontSize: "16px", margin: "0" };
const refundSection = { backgroundColor: "#f0fdf4", padding: "20px", borderRadius: "8px", margin: "20px 0" };
const refundLabel = { color: "#888", fontSize: "12px", margin: "0 0 4px 0" };
const refundAmount = { color: "#16a34a", fontSize: "24px", fontWeight: "bold", margin: "0 0 8px 0" };
const refundNote = { color: "#555", fontSize: "14px", margin: "0" };
const footer = { color: "#888", fontSize: "14px", marginTop: "32px" };
```

### References

- [Source: architecture.md#Order Cancellation]
- [Source: prd.md#FR39 - Annulation et remboursement]
- [Source: epics.md#Story 8.5]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story creee | Claude Opus 4.5 |
