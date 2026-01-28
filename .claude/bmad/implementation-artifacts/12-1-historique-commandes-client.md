# Story 12.1: Historique Commandes Client

Status: ready-for-dev

## Story

As a Client,
I want voir l'historique de toutes mes commandes,
so that je puisse suivre mes achats et retrouver facilement les details.

## Acceptance Criteria

1. **AC1 - Affichage liste commandes**
   - **Given** un Client connecte avec des commandes
   - **When** il accede a /account/orders
   - **Then** la liste affiche: date, createur (boutique), montant total, statut
   - **And** les commandes sont triees par date decroissante

2. **AC2 - Filtrage par statut**
   - **Given** la liste des commandes
   - **When** le Client selectionne un filtre statut (PAID, SHIPPED, DELIVERED, CANCELED)
   - **Then** seules les commandes avec ce statut sont affichees

3. **AC3 - Filtrage par periode**
   - **Given** la liste des commandes
   - **When** le Client selectionne une periode (7j, 30j, 90j, 1 an)
   - **Then** seules les commandes de cette periode sont affichees

4. **AC4 - Detail commande avec produits**
   - **Given** la liste des commandes
   - **When** le Client clique sur une commande
   - **Then** le detail affiche: produits (image, nom, variante, quantite, prix), adresse de livraison
   - **And** le numero de tracking est affiche si disponible
   - **And** un lien vers le suivi transporteur est disponible

5. **AC5 - Pagination**
   - **Given** plus de 20 commandes
   - **When** le Client navigue dans la liste
   - **Then** la pagination affiche 20 commandes par page

## Tasks / Subtasks

- [ ] **Task 1: Creer l'use case GetClientOrders** (AC: #1)
  - [ ] 1.1 Creer `src/modules/orders/application/use-cases/get-client-orders.use-case.ts`
  - [ ] 1.2 Implementer les filtres et la pagination
  - [ ] 1.3 Definir le DTO de sortie avec createur (boutique)

- [ ] **Task 2: Creer l'use case GetClientOrderDetail** (AC: #4)
  - [ ] 2.1 Creer `src/modules/orders/application/use-cases/get-client-order-detail.use-case.ts`
  - [ ] 2.2 Inclure les items avec variantes et images
  - [ ] 2.3 Inclure l'adresse de livraison et tracking

- [ ] **Task 3: Etendre le OrderRepository** (AC: #1-5)
  - [ ] 3.1 Ajouter la methode `findByClient(options)` dans `IOrderRepository`
  - [ ] 3.2 Implementer dans `PrismaOrderRepository`
  - [ ] 3.3 Ajouter les methodes de filtrage et recherche client

- [ ] **Task 4: Creer la page account/orders** (AC: #1, #5)
  - [ ] 4.1 Creer `src/app/(account)/account/orders/page.tsx`
  - [ ] 4.2 Implementer le Server Component avec fetch initial
  - [ ] 4.3 Gerer les searchParams pour filtres

- [ ] **Task 5: Creer le composant OrdersList** (AC: #1, #2, #3, #5)
  - [ ] 5.1 Creer `src/components/account/orders-list.tsx`
  - [ ] 5.2 Afficher les colonnes: date, boutique (createur), montant, statut
  - [ ] 5.3 Ajouter le badge de statut colore
  - [ ] 5.4 Implementer la pagination

- [ ] **Task 6: Creer les composants de filtres** (AC: #2, #3)
  - [ ] 6.1 Creer `src/components/account/orders-filters.tsx`
  - [ ] 6.2 Implementer le filtre par statut
  - [ ] 6.3 Implementer le filtre par periode

- [ ] **Task 7: Creer la page de detail commande** (AC: #4)
  - [ ] 7.1 Creer `src/app/(account)/account/orders/[id]/page.tsx`
  - [ ] 7.2 Creer `src/components/account/order-detail.tsx`
  - [ ] 7.3 Afficher les produits avec images et variantes
  - [ ] 7.4 Afficher l'adresse de livraison
  - [ ] 7.5 Afficher le tracking avec lien transporteur

- [ ] **Task 8: Ecrire les tests** (AC: #1-5)
  - [ ] 8.1 Tests unitaires pour GetClientOrdersUseCase
  - [ ] 8.2 Tests unitaires pour GetClientOrderDetailUseCase
  - [ ] 8.3 Tests d'integration pour le repository

## Dev Notes

### Use Case GetClientOrders

```typescript
// src/modules/orders/application/use-cases/get-client-orders.use-case.ts
import { injectable, inject } from "tsyringe";
import { IOrderRepository } from "../../domain/repositories/order.repository.interface";
import { OrderStatus } from "../../domain/value-objects/order-status.vo";

interface GetClientOrdersInput {
  clientId: string;
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
}

interface OrderSummaryDTO {
  id: string;
  orderNumber: string;
  createdAt: Date;
  creatorName: string;
  creatorSlug: string;
  totalAmount: number;
  status: OrderStatus;
  itemsCount: number;
  hasTracking: boolean;
}

interface GetClientOrdersOutput {
  orders: OrderSummaryDTO[];
  total: number;
  page: number;
  totalPages: number;
}

@injectable()
export class GetClientOrdersUseCase {
  constructor(
    @inject("IOrderRepository")
    private orderRepository: IOrderRepository
  ) {}

  async execute(input: GetClientOrdersInput): Promise<GetClientOrdersOutput> {
    const { orders, total } = await this.orderRepository.findByClient({
      clientId: input.clientId,
      status: input.status,
      startDate: input.startDate,
      endDate: input.endDate,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    });

    return {
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        creatorName: order.creator.name,
        creatorSlug: order.creator.slug,
        totalAmount: order.totalAmount,
        status: order.status,
        itemsCount: order.items.length,
        hasTracking: !!order.trackingNumber,
      })),
      total,
      page: input.page,
      totalPages: Math.ceil(total / input.limit),
    };
  }
}
```

### Use Case GetClientOrderDetail

```typescript
// src/modules/orders/application/use-cases/get-client-order-detail.use-case.ts
import { injectable, inject } from "tsyringe";
import { IOrderRepository } from "../../domain/repositories/order.repository.interface";

interface OrderItemDTO {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantName?: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ShippingAddressDTO {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
}

interface TrackingDTO {
  number: string;
  carrier: string;
  carrierUrl: string;
  status?: string;
  estimatedDelivery?: Date;
}

interface OrderDetailDTO {
  id: string;
  orderNumber: string;
  createdAt: Date;
  creator: {
    name: string;
    slug: string;
    avatarUrl?: string;
  };
  items: OrderItemDTO[];
  shippingAddress: ShippingAddressDTO;
  tracking?: TrackingDTO;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  status: string;
  deliveredAt?: Date;
}

interface GetClientOrderDetailInput {
  orderId: string;
  clientId: string;
}

@injectable()
export class GetClientOrderDetailUseCase {
  constructor(
    @inject("IOrderRepository")
    private orderRepository: IOrderRepository
  ) {}

  async execute(input: GetClientOrderDetailInput): Promise<OrderDetailDTO | null> {
    const order = await this.orderRepository.findByIdWithDetails(input.orderId);

    if (!order || order.customerId !== input.clientId) {
      return null;
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      creator: {
        name: order.creator.name,
        slug: order.creator.slug,
        avatarUrl: order.creator.avatarUrl,
      },
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productSlug: item.productSlug,
        variantName: item.variantName,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
      })),
      shippingAddress: {
        fullName: order.shippingAddress.fullName,
        address: order.shippingAddress.address,
        city: order.shippingAddress.city,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
        phone: order.shippingAddress.phone,
      },
      tracking: order.trackingNumber
        ? {
            number: order.trackingNumber,
            carrier: order.carrier,
            carrierUrl: getCarrierTrackingUrl(order.carrier, order.trackingNumber),
            status: order.trackingStatus,
            estimatedDelivery: order.estimatedDelivery,
          }
        : undefined,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      totalAmount: order.totalAmount,
      status: order.status,
      deliveredAt: order.deliveredAt,
    };
  }
}

function getCarrierTrackingUrl(carrier: string, trackingNumber: string): string {
  const urls: Record<string, (n: string) => string> = {
    colissimo: (n) => `https://www.laposte.fr/outils/suivre-vos-envois?code=${n}`,
    "mondial-relay": (n) => `https://www.mondialrelay.fr/suivi-de-colis/?NumeroExpedition=${n}`,
    chronopost: (n) => `https://www.chronopost.fr/tracking-no-cms/suivi-page?liession=${n}`,
    ups: (n) => `https://www.ups.com/track?tracknum=${n}`,
    dhl: (n) => `https://www.dhl.com/fr-fr/home/tracking/tracking-express.html?submit=1&tracking-id=${n}`,
    fedex: (n) => `https://www.fedex.com/fedextrack/?trknbr=${n}`,
  };

  return urls[carrier]?.(trackingNumber) || `#`;
}
```

### Repository Interface Extension

```typescript
// Ajouter dans src/modules/orders/domain/repositories/order.repository.interface.ts
interface FindByClientOptions {
  clientId: string;
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
  skip: number;
  take: number;
}

export interface IOrderRepository {
  // ... existants
  findByClient(options: FindByClientOptions): Promise<{ orders: Order[]; total: number }>;
  findByIdWithDetails(id: string): Promise<Order | null>;
}
```

### Prisma Repository Extension

```typescript
// Ajouter dans src/modules/orders/infrastructure/repositories/prisma-order.repository.ts
async findByClient(options: FindByClientOptions) {
  const where = {
    customerId: options.clientId,
    ...(options.status && { status: options.status }),
    ...(options.startDate && { createdAt: { gte: options.startDate } }),
    ...(options.endDate && { createdAt: { lte: options.endDate } }),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: true,
        creator: { select: { name: true, slug: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: options.skip,
      take: options.take,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders: orders.map(this.toDomain), total };
}

async findByIdWithDetails(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: { select: { name: true, slug: true } },
          variant: { select: { name: true } },
        },
      },
      creator: { select: { name: true, slug: true, avatarUrl: true } },
      shippingAddress: true,
    },
  });

  return order ? this.toDomainWithDetails(order) : null;
}
```

### Page Server Component

```typescript
// src/app/(account)/account/orders/page.tsx
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth-options";
import { container } from "@/lib/di/container";
import { GetClientOrdersUseCase } from "@/modules/orders/application/use-cases/get-client-orders.use-case";
import { OrdersList } from "@/components/account/orders-list";
import { OrdersFilters } from "@/components/account/orders-filters";
import { OrdersListSkeleton } from "@/components/account/orders-list-skeleton";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    period?: string;
    page?: string;
  }>;
}

export default async function ClientOrdersPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/account/orders");
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 20;

  const dateRange = getDateRange(params.period);

  const useCase = container.resolve(GetClientOrdersUseCase);
  const result = await useCase.execute({
    clientId: session.user.id,
    status: params.status as any,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    page,
    limit,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes commandes</h1>
        <p className="text-muted-foreground">
          Retrouvez l'historique de tous vos achats
        </p>
      </div>

      <OrdersFilters
        currentStatus={params.status}
        currentPeriod={params.period}
      />

      <Suspense fallback={<OrdersListSkeleton />}>
        <OrdersList
          orders={result.orders}
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
        />
      </Suspense>
    </div>
  );
}

function getDateRange(period?: string) {
  const now = new Date();
  switch (period) {
    case "7d":
      return { startDate: new Date(now.setDate(now.getDate() - 7)), endDate: new Date() };
    case "30d":
      return { startDate: new Date(now.setDate(now.getDate() - 30)), endDate: new Date() };
    case "90d":
      return { startDate: new Date(now.setDate(now.getDate() - 90)), endDate: new Date() };
    case "1y":
      return { startDate: new Date(now.setFullYear(now.getFullYear() - 1)), endDate: new Date() };
    default:
      return { startDate: undefined, endDate: undefined };
  }
}
```

### Composant OrdersList

```typescript
// src/components/account/orders-list.tsx
"use client";

import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { ChevronRight, Package, Store } from "lucide-react";

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELED: "bg-red-100 text-red-800",
};

const STATUS_LABELS = {
  PENDING: "En attente",
  PAID: "Payee",
  SHIPPED: "En cours de livraison",
  DELIVERED: "Livree",
  CANCELED: "Annulee",
};

interface Order {
  id: string;
  orderNumber: string;
  createdAt: Date;
  creatorName: string;
  creatorSlug: string;
  totalAmount: number;
  status: keyof typeof STATUS_COLORS;
  itemsCount: number;
  hasTracking: boolean;
}

interface OrdersListProps {
  orders: Order[];
  page: number;
  totalPages: number;
  total: number;
}

export function OrdersList({ orders, page, totalPages, total }: OrdersListProps) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Aucune commande</h3>
          <p className="mt-2 text-muted-foreground">
            Vous n'avez pas encore passe de commande
          </p>
          <Button asChild className="mt-4">
            <Link href="/explore">Decouvrir les createurs</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {total} commande{total > 1 ? "s" : ""}
      </p>

      <div className="space-y-3">
        {orders.map((order) => (
          <Link key={order.id} href={`/account/orders/${order.id}`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{order.creatorName}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={STATUS_COLORS[order.status]}>
                      {STATUS_LABELS[order.status]}
                    </Badge>
                    <span className="font-medium">{formatPrice(order.totalAmount)}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Commande #{order.orderNumber}</span>
                  <span>{order.itemsCount} article{order.itemsCount > 1 ? "s" : ""}</span>
                  {order.hasTracking && order.status === "SHIPPED" && (
                    <span className="text-primary">Suivi disponible</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} />
      )}
    </div>
  );
}
```

### Composant OrderDetail

```typescript
// src/components/account/order-detail.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, MapPin, Package, Store, Truck } from "lucide-react";

interface OrderDetailProps {
  order: {
    id: string;
    orderNumber: string;
    createdAt: Date;
    creator: { name: string; slug: string; avatarUrl?: string };
    items: Array<{
      id: string;
      productName: string;
      productSlug: string;
      variantName?: string;
      imageUrl: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    shippingAddress: {
      fullName: string;
      address: string;
      city: string;
      postalCode: string;
      country: string;
      phone?: string;
    };
    tracking?: {
      number: string;
      carrier: string;
      carrierUrl: string;
      status?: string;
      estimatedDelivery?: Date;
    };
    subtotal: number;
    shippingCost: number;
    totalAmount: number;
    status: string;
    deliveredAt?: Date;
  };
}

export function OrderDetail({ order }: OrderDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Commande #{order.orderNumber}</h1>
          <p className="text-muted-foreground">
            Passee le {formatDate(order.createdAt)}
          </p>
        </div>
        <Badge className={getStatusColor(order.status)}>
          {getStatusLabel(order.status)}
        </Badge>
      </div>

      {/* Createur */}
      <Card>
        <CardContent className="py-4">
          <Link href={`/c/${order.creator.slug}`} className="flex items-center gap-3 hover:underline">
            <Store className="h-5 w-5" />
            <span className="font-medium">{order.creator.name}</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>

      {/* Tracking */}
      {order.tracking && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Suivi de livraison
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono">{order.tracking.number}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {order.tracking.carrier}
                </p>
              </div>
              <Button asChild variant="outline">
                <a href={order.tracking.carrierUrl} target="_blank" rel="noopener noreferrer">
                  Suivre le colis
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
            {order.tracking.estimatedDelivery && (
              <p className="text-sm">
                Livraison estimee: <strong>{formatDate(order.tracking.estimatedDelivery)}</strong>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Produits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Articles ({order.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
                <Image
                  src={item.imageUrl}
                  alt={item.productName}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.productName}</p>
                {item.variantName && (
                  <p className="text-sm text-muted-foreground">{item.variantName}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Quantite: {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatPrice(item.totalPrice)}</p>
                {item.quantity > 1 && (
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(item.unitPrice)} / unite
                  </p>
                )}
              </div>
            </div>
          ))}

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Sous-total</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Frais de livraison</span>
              <span>{formatPrice(order.shippingCost)}</span>
            </div>
            <div className="flex justify-between font-medium text-lg">
              <span>Total</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adresse */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Adresse de livraison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-medium">{order.shippingAddress.fullName}</p>
          <p>{order.shippingAddress.address}</p>
          <p>
            {order.shippingAddress.postalCode} {order.shippingAddress.city}
          </p>
          <p>{order.shippingAddress.country}</p>
          {order.shippingAddress.phone && (
            <p className="mt-2 text-muted-foreground">{order.shippingAddress.phone}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PAID: "bg-blue-100 text-blue-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELED: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "En attente",
    PAID: "Payee",
    SHIPPED: "En cours de livraison",
    DELIVERED: "Livree",
    CANCELED: "Annulee",
  };
  return labels[status] || status;
}
```

### References

- [Source: architecture.md#Order Management]
- [Source: prd.md#FR45 - Espace client]
- [Source: epics.md#Story 12.1]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story creee | Claude Opus 4.5 |
