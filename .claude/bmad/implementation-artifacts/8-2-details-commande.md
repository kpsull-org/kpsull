# Story 8.2: Details d'une Commande

Status: ready-for-dev

## Story

As a Createur,
I want consulter le detail complet d'une commande,
so that je puisse preparer l'expedition avec toutes les informations necessaires.

## Acceptance Criteria

1. **AC1 - Affichage articles commandes**
   - **Given** un Createur sur la page detail commande
   - **When** il consulte la commande
   - **Then** il voit la liste des articles avec: image, nom, variante, quantite, prix unitaire

2. **AC2 - Affichage informations client**
   - **Given** le detail de la commande
   - **When** le Createur consulte les infos client
   - **Then** il voit: nom complet, email, telephone (si fourni)

3. **AC3 - Affichage adresse livraison**
   - **Given** le detail de la commande
   - **When** le Createur consulte l'adresse
   - **Then** il voit l'adresse complete formatee

4. **AC4 - Affichage notes client**
   - **Given** une commande avec notes
   - **When** le Createur consulte le detail
   - **Then** les notes du client sont visibles dans une section dediee

5. **AC5 - Historique de la commande**
   - **Given** le detail de la commande
   - **When** le Createur consulte l'historique
   - **Then** il voit la timeline: creation, paiement, expedition, livraison

## Tasks / Subtasks

- [ ] **Task 1: Creer l'use case GetOrderDetails** (AC: #1-5)
  - [ ] 1.1 Creer `src/modules/orders/application/use-cases/get-order-details.use-case.ts`
  - [ ] 1.2 Definir le DTO avec toutes les infos necessaires
  - [ ] 1.3 Verifier que le createur est bien proprietaire

- [ ] **Task 2: Creer la page de detail** (AC: #1-5)
  - [ ] 2.1 Creer `src/app/(dashboard)/dashboard/orders/[id]/page.tsx`
  - [ ] 2.2 Implementer le Server Component
  - [ ] 2.3 Gerer le cas commande inexistante (404)

- [ ] **Task 3: Creer le composant OrderHeader** (AC: #1)
  - [ ] 3.1 Creer `src/components/orders/order-header.tsx`
  - [ ] 3.2 Afficher numero, date, statut, actions

- [ ] **Task 4: Creer le composant OrderItems** (AC: #1)
  - [ ] 4.1 Creer `src/components/orders/order-items.tsx`
  - [ ] 4.2 Afficher la liste des articles avec images
  - [ ] 4.3 Afficher les totaux

- [ ] **Task 5: Creer le composant CustomerInfo** (AC: #2, #3, #4)
  - [ ] 5.1 Creer `src/components/orders/customer-info.tsx`
  - [ ] 5.2 Afficher les infos client
  - [ ] 5.3 Afficher l'adresse livraison
  - [ ] 5.4 Afficher les notes

- [ ] **Task 6: Creer le composant OrderTimeline** (AC: #5)
  - [ ] 6.1 Creer `src/components/orders/order-timeline.tsx`
  - [ ] 6.2 Afficher l'historique des evenements

- [ ] **Task 7: Ecrire les tests** (AC: #1-5)
  - [ ] 7.1 Tests unitaires pour GetOrderDetailsUseCase
  - [ ] 7.2 Tests de composants

## Dev Notes

### Use Case GetOrderDetails

```typescript
// src/modules/orders/application/use-cases/get-order-details.use-case.ts
import { injectable, inject } from "tsyringe";
import { IOrderRepository } from "../../domain/repositories/order.repository.interface";
import { UnauthorizedError, NotFoundError } from "@/shared/errors";

interface GetOrderDetailsInput {
  orderId: string;
  creatorId: string;
}

interface OrderItemDTO {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  variantId: string | null;
  variantLabel: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderTimelineEvent {
  type: "CREATED" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELED";
  timestamp: Date;
  details?: string;
}

interface OrderDetailsDTO {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: Date;
  paidAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  canceledAt: Date | null;

  // Customer
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };

  // Shipping
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };

  // Items
  items: OrderItemDTO[];
  subtotal: number;
  shippingCost: number;
  totalAmount: number;

  // Notes
  customerNotes: string | null;

  // Shipping info
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;

  // Timeline
  timeline: OrderTimelineEvent[];
}

@injectable()
export class GetOrderDetailsUseCase {
  constructor(
    @inject("IOrderRepository")
    private orderRepository: IOrderRepository
  ) {}

  async execute(input: GetOrderDetailsInput): Promise<OrderDetailsDTO> {
    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      throw new NotFoundError("Commande non trouvee");
    }

    if (order.creatorId !== input.creatorId) {
      throw new UnauthorizedError("Acces non autorise a cette commande");
    }

    return this.toDTO(order);
  }

  private toDTO(order: Order): OrderDetailsDTO {
    const timeline: OrderTimelineEvent[] = [
      { type: "CREATED", timestamp: order.createdAt },
    ];

    if (order.paidAt) {
      timeline.push({ type: "PAID", timestamp: order.paidAt });
    }
    if (order.shippedAt) {
      timeline.push({
        type: "SHIPPED",
        timestamp: order.shippedAt,
        details: order.carrier ? `Via ${order.carrier}` : undefined
      });
    }
    if (order.deliveredAt) {
      timeline.push({ type: "DELIVERED", timestamp: order.deliveredAt });
    }
    if (order.canceledAt) {
      timeline.push({
        type: "CANCELED",
        timestamp: order.canceledAt,
        details: order.cancelReason
      });
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      canceledAt: order.canceledAt,
      customer: {
        id: order.customerId,
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
      },
      shippingAddress: order.shippingAddress,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        variantId: item.variantId,
        variantLabel: item.variantLabel,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
      })),
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      totalAmount: order.totalAmount,
      customerNotes: order.customerNotes,
      carrier: order.carrier,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      timeline: timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
    };
  }
}
```

### Page de Detail

```typescript
// src/app/(dashboard)/dashboard/orders/[id]/page.tsx
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { container } from "@/lib/di/container";
import { GetOrderDetailsUseCase } from "@/modules/orders/application/use-cases/get-order-details.use-case";
import { OrderHeader } from "@/components/orders/order-header";
import { OrderItems } from "@/components/orders/order-items";
import { CustomerInfo } from "@/components/orders/customer-info";
import { OrderTimeline } from "@/components/orders/order-timeline";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.creatorId) {
    notFound();
  }

  const { id } = await params;

  try {
    const useCase = container.resolve(GetOrderDetailsUseCase);
    const order = await useCase.execute({
      orderId: id,
      creatorId: session.user.creatorId,
    });

    return (
      <div className="space-y-6">
        <OrderHeader order={order} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <OrderItems items={order.items} totals={{
              subtotal: order.subtotal,
              shipping: order.shippingCost,
              total: order.totalAmount,
            }} />
          </div>

          <div className="space-y-6">
            <CustomerInfo
              customer={order.customer}
              address={order.shippingAddress}
              notes={order.customerNotes}
            />
            <OrderTimeline events={order.timeline} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
```

### Composant OrderHeader

```typescript
// src/components/orders/order-header.tsx
import Link from "next/link";
import { ArrowLeft, Package, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/format";

interface OrderHeaderProps {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    createdAt: Date;
  };
}

const STATUS_CONFIG = {
  PENDING: { label: "En attente", color: "bg-yellow-100 text-yellow-800", icon: null },
  PAID: { label: "Payee", color: "bg-blue-100 text-blue-800", icon: Package },
  SHIPPED: { label: "Expediee", color: "bg-purple-100 text-purple-800", icon: Truck },
  DELIVERED: { label: "Livree", color: "bg-green-100 text-green-800", icon: null },
  CANCELED: { label: "Annulee", color: "bg-red-100 text-red-800", icon: XCircle },
};

export function OrderHeader({ order }: OrderHeaderProps) {
  const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
  const canShip = order.status === "PAID";
  const canCancel = ["PENDING", "PAID"].includes(order.status);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Commande {order.orderNumber}</h1>
            <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
          </div>
          <p className="text-muted-foreground">
            Passee le {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {canShip && (
          <Button asChild>
            <Link href={`/dashboard/orders/${order.id}/ship`}>
              <Truck className="h-4 w-4 mr-2" />
              Expedier
            </Link>
          </Button>
        )}
        {canCancel && (
          <Button variant="destructive" asChild>
            <Link href={`/dashboard/orders/${order.id}/cancel`}>
              <XCircle className="h-4 w-4 mr-2" />
              Annuler
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
```

### Composant OrderItems

```typescript
// src/components/orders/order-items.tsx
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils/format";

interface OrderItem {
  id: string;
  productName: string;
  productImage: string | null;
  variantLabel: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderItemsProps {
  items: OrderItem[];
  totals: {
    subtotal: number;
    shipping: number;
    total: number;
  };
}

export function OrderItems({ items, totals }: OrderItemsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Articles commandes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {items.map((item) => (
            <div key={item.id} className="py-4 flex gap-4">
              <div className="w-16 h-16 relative bg-muted rounded-md overflow-hidden">
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    ?
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.productName}</p>
                {item.variantLabel && (
                  <p className="text-sm text-muted-foreground">{item.variantLabel}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Qte: {item.quantity} x {formatPrice(item.unitPrice)}
                </p>
              </div>
              <div className="text-right font-medium">
                {formatPrice(item.totalPrice)}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Sous-total</span>
            <span>{formatPrice(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Livraison</span>
            <span>{totals.shipping > 0 ? formatPrice(totals.shipping) : "Gratuit"}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total</span>
            <span>{formatPrice(totals.total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Composant CustomerInfo

```typescript
// src/components/orders/customer-info.tsx
import { User, MapPin, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CustomerInfoProps {
  customer: {
    name: string;
    email: string;
    phone: string | null;
  };
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  notes: string | null;
}

export function CustomerInfo({ customer, address, notes }: CustomerInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Client
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="font-medium">{customer.name}</p>
          <p className="text-sm text-muted-foreground">{customer.email}</p>
          {customer.phone && (
            <p className="text-sm text-muted-foreground">{customer.phone}</p>
          )}
        </div>

        <div>
          <p className="text-sm font-medium flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4" />
            Adresse de livraison
          </p>
          <p className="text-sm text-muted-foreground">
            {address.street}<br />
            {address.postalCode} {address.city}<br />
            {address.country}
          </p>
        </div>

        {notes && (
          <div>
            <p className="text-sm font-medium flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4" />
              Notes du client
            </p>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              {notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Composant OrderTimeline

```typescript
// src/components/orders/order-timeline.tsx
import { Check, Clock, Package, Truck, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils/format";

interface TimelineEvent {
  type: "CREATED" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELED";
  timestamp: Date;
  details?: string;
}

interface OrderTimelineProps {
  events: TimelineEvent[];
}

const EVENT_CONFIG = {
  CREATED: { label: "Commande creee", icon: Clock, color: "text-gray-500" },
  PAID: { label: "Paiement recu", icon: Check, color: "text-blue-500" },
  SHIPPED: { label: "Commande expediee", icon: Truck, color: "text-purple-500" },
  DELIVERED: { label: "Commande livree", icon: Package, color: "text-green-500" },
  CANCELED: { label: "Commande annulee", icon: XCircle, color: "text-red-500" },
};

export function OrderTimeline({ events }: OrderTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {events.map((event, index) => {
            const config = EVENT_CONFIG[event.type];
            const Icon = config.icon;
            const isLast = index === events.length - 1;

            return (
              <div key={index} className="flex gap-4">
                <div className="relative flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center ${config.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {!isLast && (
                    <div className="w-0.5 h-full bg-muted absolute top-8" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="font-medium">{config.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(event.timestamp)}
                  </p>
                  {event.details && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.details}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

### References

- [Source: architecture.md#Order Management]
- [Source: prd.md#FR36 - Detail commande]
- [Source: epics.md#Story 8.2]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story creee | Claude Opus 4.5 |
