# Story 8.1: Liste des Commandes Recues

Status: ready-for-dev

## Story

As a Createur,
I want consulter la liste de toutes mes commandes recues,
so that je puisse gerer efficacement mes ventes et expeditions.

## Acceptance Criteria

1. **AC1 - Affichage liste commandes**
   - **Given** un Createur connecte avec des commandes
   - **When** il accede a /dashboard/orders
   - **Then** la liste affiche: numero, date, client, montant, statut
   - **And** les commandes sont triees par date decroissante

2. **AC2 - Filtrage par statut**
   - **Given** la liste des commandes
   - **When** le Createur selectionne un filtre statut (PENDING, PAID, SHIPPED, DELIVERED, CANCELED)
   - **Then** seules les commandes avec ce statut sont affichees

3. **AC3 - Filtrage par periode**
   - **Given** la liste des commandes
   - **When** le Createur selectionne une periode (7j, 30j, 90j, personnalise)
   - **Then** seules les commandes de cette periode sont affichees

4. **AC4 - Recherche par numero**
   - **Given** la liste des commandes
   - **When** le Createur saisit un numero de commande
   - **Then** les commandes correspondantes sont affichees
   - **And** la recherche est insensible a la casse

5. **AC5 - Pagination**
   - **Given** plus de 20 commandes
   - **When** le Createur navigue dans la liste
   - **Then** la pagination affiche 20 commandes par page

## Tasks / Subtasks

- [ ] **Task 1: Creer l'use case GetCreatorOrders** (AC: #1)
  - [ ] 1.1 Creer `src/modules/orders/application/use-cases/get-creator-orders.use-case.ts`
  - [ ] 1.2 Implementer les filtres et la pagination
  - [ ] 1.3 Definir le DTO de sortie

- [ ] **Task 2: Creer le repository OrderRepository** (AC: #1-5)
  - [ ] 2.1 Creer l'interface `IOrderRepository`
  - [ ] 2.2 Implementer `PrismaOrderRepository`
  - [ ] 2.3 Ajouter les methodes de filtrage et recherche

- [ ] **Task 3: Creer la page dashboard/orders** (AC: #1)
  - [ ] 3.1 Creer `src/app/(dashboard)/dashboard/orders/page.tsx`
  - [ ] 3.2 Implementer le Server Component avec fetch initial
  - [ ] 3.3 Gerer les searchParams pour filtres

- [ ] **Task 4: Creer le composant OrdersTable** (AC: #1, #5)
  - [ ] 4.1 Creer `src/components/orders/orders-table.tsx`
  - [ ] 4.2 Afficher les colonnes: numero, date, client, montant, statut
  - [ ] 4.3 Ajouter le badge de statut colore
  - [ ] 4.4 Implementer la pagination

- [ ] **Task 5: Creer les composants de filtres** (AC: #2, #3, #4)
  - [ ] 5.1 Creer `src/components/orders/orders-filters.tsx`
  - [ ] 5.2 Implementer le filtre par statut
  - [ ] 5.3 Implementer le filtre par periode avec date picker
  - [ ] 5.4 Implementer la barre de recherche

- [ ] **Task 6: Ecrire les tests** (AC: #1-5)
  - [ ] 6.1 Tests unitaires pour GetCreatorOrdersUseCase
  - [ ] 6.2 Tests unitaires pour les filtres
  - [ ] 6.3 Tests d'integration pour le repository

## Dev Notes

### Use Case GetCreatorOrders

```typescript
// src/modules/orders/application/use-cases/get-creator-orders.use-case.ts
import { injectable, inject } from "tsyringe";
import { IOrderRepository } from "../../domain/repositories/order.repository.interface";
import { OrderStatus } from "../../domain/value-objects/order-status.vo";

interface GetCreatorOrdersInput {
  creatorId: string;
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page: number;
  limit: number;
}

interface OrderSummaryDTO {
  id: string;
  orderNumber: string;
  createdAt: Date;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: OrderStatus;
  itemsCount: number;
}

interface GetCreatorOrdersOutput {
  orders: OrderSummaryDTO[];
  total: number;
  page: number;
  totalPages: number;
}

@injectable()
export class GetCreatorOrdersUseCase {
  constructor(
    @inject("IOrderRepository")
    private orderRepository: IOrderRepository
  ) {}

  async execute(input: GetCreatorOrdersInput): Promise<GetCreatorOrdersOutput> {
    const { orders, total } = await this.orderRepository.findByCreator({
      creatorId: input.creatorId,
      status: input.status,
      startDate: input.startDate,
      endDate: input.endDate,
      search: input.search,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    });

    return {
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        totalAmount: order.totalAmount,
        status: order.status,
        itemsCount: order.items.length,
      })),
      total,
      page: input.page,
      totalPages: Math.ceil(total / input.limit),
    };
  }
}
```

### Repository Interface

```typescript
// src/modules/orders/domain/repositories/order.repository.interface.ts
import { Order } from "../entities/order.entity";
import { OrderStatus } from "../value-objects/order-status.vo";

interface FindByCreatorOptions {
  creatorId: string;
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  skip: number;
  take: number;
}

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  findByCreator(options: FindByCreatorOptions): Promise<{ orders: Order[]; total: number }>;
  save(order: Order): Promise<void>;
  update(order: Order): Promise<void>;
}
```

### Prisma Repository Implementation

```typescript
// src/modules/orders/infrastructure/repositories/prisma-order.repository.ts
import { injectable } from "tsyringe";
import { prisma } from "@/lib/prisma/client";
import { IOrderRepository, FindByCreatorOptions } from "../../domain/repositories/order.repository.interface";
import { Order } from "../../domain/entities/order.entity";

@injectable()
export class PrismaOrderRepository implements IOrderRepository {
  async findByCreator(options: FindByCreatorOptions) {
    const where = {
      creatorId: options.creatorId,
      ...(options.status && { status: options.status }),
      ...(options.startDate && { createdAt: { gte: options.startDate } }),
      ...(options.endDate && { createdAt: { lte: options.endDate } }),
      ...(options.search && {
        OR: [
          { orderNumber: { contains: options.search, mode: "insensitive" } },
          { customerName: { contains: options.search, mode: "insensitive" } },
          { customerEmail: { contains: options.search, mode: "insensitive" } },
        ],
      }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          customer: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: options.skip,
        take: options.take,
      }),
      prisma.order.count({ where }),
    ]);

    return { orders: orders.map(this.toDomain), total };
  }

  private toDomain(raw: any): Order {
    // Mapping Prisma -> Domain Entity
    return Order.reconstitute({
      id: raw.id,
      orderNumber: raw.orderNumber,
      creatorId: raw.creatorId,
      customerId: raw.customerId,
      customerName: raw.customer.name,
      customerEmail: raw.customer.email,
      items: raw.items,
      totalAmount: raw.totalAmount,
      status: raw.status,
      createdAt: raw.createdAt,
    });
  }
}
```

### Page Server Component

```typescript
// src/app/(dashboard)/dashboard/orders/page.tsx
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth-options";
import { container } from "@/lib/di/container";
import { GetCreatorOrdersUseCase } from "@/modules/orders/application/use-cases/get-creator-orders.use-case";
import { OrdersTable } from "@/components/orders/orders-table";
import { OrdersFilters } from "@/components/orders/orders-filters";
import { OrdersTableSkeleton } from "@/components/orders/orders-table-skeleton";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    period?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.creatorId) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 20;

  // Calculate date range from period
  const dateRange = getDateRange(params.period, params.startDate, params.endDate);

  const useCase = container.resolve(GetCreatorOrdersUseCase);
  const result = await useCase.execute({
    creatorId: session.user.creatorId,
    status: params.status as any,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    search: params.search,
    page,
    limit,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes commandes</h1>
        <p className="text-muted-foreground">
          Gerez vos commandes et suivez vos expeditions
        </p>
      </div>

      <OrdersFilters
        currentStatus={params.status}
        currentPeriod={params.period}
        currentSearch={params.search}
      />

      <Suspense fallback={<OrdersTableSkeleton />}>
        <OrdersTable
          orders={result.orders}
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
        />
      </Suspense>
    </div>
  );
}

function getDateRange(period?: string, startDate?: string, endDate?: string) {
  if (startDate && endDate) {
    return { startDate: new Date(startDate), endDate: new Date(endDate) };
  }

  const now = new Date();
  switch (period) {
    case "7d":
      return { startDate: new Date(now.setDate(now.getDate() - 7)), endDate: new Date() };
    case "30d":
      return { startDate: new Date(now.setDate(now.getDate() - 30)), endDate: new Date() };
    case "90d":
      return { startDate: new Date(now.setDate(now.getDate() - 90)), endDate: new Date() };
    default:
      return { startDate: undefined, endDate: undefined };
  }
}
```

### Composant OrdersTable

```typescript
// src/components/orders/orders-table.tsx
"use client";

import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Eye } from "lucide-react";

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
  SHIPPED: "Expediee",
  DELIVERED: "Livree",
  CANCELED: "Annulee",
};

interface Order {
  id: string;
  orderNumber: string;
  createdAt: Date;
  customerName: string;
  totalAmount: number;
  status: keyof typeof STATUS_COLORS;
  itemsCount: number;
}

interface OrdersTableProps {
  orders: Order[];
  page: number;
  totalPages: number;
  total: number;
}

export function OrdersTable({ orders, page, totalPages, total }: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">Aucune commande trouvee</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {total} commande{total > 1 ? "s" : ""} trouvee{total > 1 ? "s" : ""}
      </p>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numero</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Articles</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono">{order.orderNumber}</TableCell>
                <TableCell>{formatDate(order.createdAt)}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{order.itemsCount} article{order.itemsCount > 1 ? "s" : ""}</TableCell>
                <TableCell className="font-medium">{formatPrice(order.totalAmount)}</TableCell>
                <TableCell>
                  <Badge className={STATUS_COLORS[order.status]}>
                    {STATUS_LABELS[order.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} />
      )}
    </div>
  );
}
```

### Composant OrdersFilters

```typescript
// src/components/orders/orders-filters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OrdersFiltersProps {
  currentStatus?: string;
  currentPeriod?: string;
  currentSearch?: string;
}

const STATUSES = [
  { value: "all", label: "Tous les statuts" },
  { value: "PENDING", label: "En attente" },
  { value: "PAID", label: "Payees" },
  { value: "SHIPPED", label: "Expediees" },
  { value: "DELIVERED", label: "Livrees" },
  { value: "CANCELED", label: "Annulees" },
];

const PERIODS = [
  { value: "all", label: "Toutes les periodes" },
  { value: "7d", label: "7 derniers jours" },
  { value: "30d", label: "30 derniers jours" },
  { value: "90d", label: "90 derniers jours" },
];

export function OrdersFilters({ currentStatus, currentPeriod, currentSearch }: OrdersFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch || "");

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset to page 1

    startTransition(() => {
      router.push(`/dashboard/orders?${params.toString()}`);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter("search", search);
  };

  return (
    <div className="flex flex-wrap gap-4">
      <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numero..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </form>

      <Select value={currentStatus || "all"} onValueChange={(v) => updateFilter("status", v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((status) => (
            <SelectItem key={status.value} value={status.value}>
              {status.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentPeriod || "all"} onValueChange={(v) => updateFilter("period", v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Periode" />
        </SelectTrigger>
        <SelectContent>
          {PERIODS.map((period) => (
            <SelectItem key={period.value} value={period.value}>
              {period.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

### References

- [Source: architecture.md#Order Management]
- [Source: prd.md#FR35 - Gestion des commandes createur]
- [Source: epics.md#Story 8.1]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story creee | Claude Opus 4.5 |
