# Story 11.2: Liste et Gestion des Créateurs

Status: ready-for-dev

## Story

As a Admin,
I want gérer les créateurs de la plateforme,
so that je puisse superviser les comptes et intervenir en cas de besoin.

## Acceptance Criteria

1. **AC1 - Liste paginée des créateurs**
   - **Given** un Admin sur la page de gestion des créateurs
   - **When** il consulte la liste
   - **Then** il voit une liste paginée avec : nom de marque, email, statut, CA total, date d'inscription
   - **And** la pagination affiche 20 créateurs par page

2. **AC2 - Filtres par statut**
   - **Given** un Admin sur la liste
   - **When** il utilise le filtre de statut
   - **Then** il peut filtrer par : PENDING_VERIFICATION, ACTIVE, SUSPENDED, REJECTED
   - **And** il peut cumuler plusieurs filtres

3. **AC3 - Recherche créateur**
   - **Given** un Admin sur la liste
   - **When** il utilise la barre de recherche
   - **Then** il peut rechercher par nom de marque, email ou SIRET

4. **AC4 - Détail d'un créateur**
   - **Given** un Admin qui clique sur un créateur
   - **When** il accède au détail
   - **Then** il voit : informations personnelles, informations entreprise, statut Stripe Connect, historique des commandes, statistiques de ventes

5. **AC5 - Tri des résultats**
   - **Given** un Admin sur la liste
   - **When** il clique sur un en-tête de colonne
   - **Then** la liste se trie par cette colonne (asc/desc)

## Tasks / Subtasks

- [ ] **Task 1: Créer la page liste créateurs** (AC: #1, #2, #3, #5)
  - [ ] 1.1 Créer `src/app/(admin)/admin/creators/page.tsx`
  - [ ] 1.2 Implémenter la DataTable avec colonnes triables
  - [ ] 1.3 Ajouter les filtres par statut (multi-select)
  - [ ] 1.4 Implémenter la barre de recherche avec debounce
  - [ ] 1.5 Ajouter la pagination côté serveur

- [ ] **Task 2: Créer la page détail créateur** (AC: #4)
  - [ ] 2.1 Créer `src/app/(admin)/admin/creators/[id]/page.tsx`
  - [ ] 2.2 Afficher les informations personnelles et entreprise
  - [ ] 2.3 Afficher le statut Stripe Connect avec lien dashboard
  - [ ] 2.4 Afficher l'historique des commandes (dernières 50)
  - [ ] 2.5 Afficher les statistiques de ventes (CA, commissions, produits)

- [ ] **Task 3: Implémenter les services** (AC: #1, #4)
  - [ ] 3.1 Créer `GetCreatorsListUseCase` avec pagination et filtres
  - [ ] 3.2 Créer `GetCreatorDetailUseCase` avec toutes les données
  - [ ] 3.3 Créer les routes API correspondantes

- [ ] **Task 4: Écrire les tests** (AC: #1-5)
  - [ ] 4.1 Tests unitaires pour les use cases
  - [ ] 4.2 Tests d'intégration pour les API
  - [ ] 4.3 Tests de pagination et filtres

## Dev Notes

### Structure Page Liste

```typescript
// src/app/(admin)/admin/creators/page.tsx
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { CreatorsDataTable } from "./data-table";
import { getCreatorsList } from "@/modules/admin/application/use-cases/get-creators-list.use-case";

interface SearchParams {
  page?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export default async function AdminCreatorsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  const page = parseInt(searchParams.page || "1");
  const statuses = searchParams.status?.split(",") || [];
  const search = searchParams.search || "";
  const sortBy = searchParams.sortBy || "createdAt";
  const sortOrder = searchParams.sortOrder || "desc";

  const result = await getCreatorsList({
    page,
    limit: 20,
    statuses,
    search,
    sortBy,
    sortOrder,
  });

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des créateurs</h1>
        <div className="text-sm text-muted-foreground">
          {result.total} créateurs
        </div>
      </div>

      <CreatorsDataTable
        data={result.creators}
        pagination={{
          page,
          totalPages: result.totalPages,
          total: result.total,
        }}
      />
    </div>
  );
}
```

### Colonnes DataTable

```typescript
// src/app/(admin)/admin/creators/columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export type CreatorRow = {
  id: string;
  brandName: string;
  email: string;
  status: "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "REJECTED";
  totalRevenue: number;
  createdAt: Date;
};

const statusVariants = {
  PENDING_VERIFICATION: "warning",
  ACTIVE: "success",
  SUSPENDED: "destructive",
  REJECTED: "secondary",
} as const;

const statusLabels = {
  PENDING_VERIFICATION: "En attente",
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  REJECTED: "Refusé",
};

export const columns: ColumnDef<CreatorRow>[] = [
  {
    accessorKey: "brandName",
    header: "Nom de marque",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.brandName}</div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => (
      <Badge variant={statusVariants[row.original.status]}>
        {statusLabels[row.original.status]}
      </Badge>
    ),
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "totalRevenue",
    header: "CA Total",
    cell: ({ row }) => formatCurrency(row.original.totalRevenue),
  },
  {
    accessorKey: "createdAt",
    header: "Inscrit le",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/admin/creators/${row.original.id}`}>
          <Eye className="h-4 w-4 mr-2" />
          Voir
        </Link>
      </Button>
    ),
  },
];
```

### Page Détail Créateur

```typescript
// src/app/(admin)/admin/creators/[id]/page.tsx
import { auth } from "@/lib/auth/config";
import { redirect, notFound } from "next/navigation";
import { getCreatorDetail } from "@/modules/admin/application/use-cases/get-creator-detail.use-case";
import { CreatorInfoCard } from "./components/CreatorInfoCard";
import { BusinessInfoCard } from "./components/BusinessInfoCard";
import { StripeStatusCard } from "./components/StripeStatusCard";
import { OrdersHistoryCard } from "./components/OrdersHistoryCard";
import { StatsCard } from "./components/StatsCard";
import { CreatorActions } from "./components/CreatorActions";

export default async function CreatorDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  const creator = await getCreatorDetail(params.id);

  if (!creator) {
    notFound();
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{creator.brandName}</h1>
          <p className="text-muted-foreground">{creator.user.email}</p>
        </div>
        <CreatorActions creator={creator} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          <CreatorInfoCard creator={creator} />
          <BusinessInfoCard creator={creator} />
          <OrdersHistoryCard orders={creator.orders} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <StatsCard stats={creator.stats} />
          <StripeStatusCard stripeAccount={creator.stripeAccount} />
        </div>
      </div>
    </div>
  );
}
```

### Use Case GetCreatorsList

```typescript
// src/modules/admin/application/use-cases/get-creators-list.use-case.ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface GetCreatorsListDTO {
  page: number;
  limit: number;
  statuses: string[];
  search: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export async function getCreatorsList(dto: GetCreatorsListDTO) {
  const { page, limit, statuses, search, sortBy, sortOrder } = dto;
  const skip = (page - 1) * limit;

  const where: Prisma.CreatorWhereInput = {
    ...(statuses.length > 0 && {
      status: { in: statuses as any[] },
    }),
    ...(search && {
      OR: [
        { brandName: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { siret: { contains: search } },
      ],
    }),
  };

  const [creators, total] = await Promise.all([
    prisma.creator.findMany({
      where,
      include: {
        user: {
          select: { email: true, name: true },
        },
        _count: {
          select: { orders: true, products: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.creator.count({ where }),
  ]);

  // Calcul du CA pour chaque créateur
  const creatorsWithRevenue = await Promise.all(
    creators.map(async (creator) => {
      const revenue = await prisma.order.aggregate({
        where: {
          creatorId: creator.id,
          status: { in: ["COMPLETED", "SHIPPED", "DELIVERED"] },
        },
        _sum: { totalAmount: true },
      });

      return {
        id: creator.id,
        brandName: creator.brandName,
        email: creator.user.email,
        status: creator.status,
        totalRevenue: revenue._sum.totalAmount || 0,
        createdAt: creator.createdAt,
      };
    })
  );

  return {
    creators: creatorsWithRevenue,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
```

### Filtres Multi-Select

```typescript
// src/app/(admin)/admin/creators/filters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import { useDebouncedCallback } from "use-debounce";

const statusOptions = [
  { value: "PENDING_VERIFICATION", label: "En attente" },
  { value: "ACTIVE", label: "Actif" },
  { value: "SUSPENDED", label: "Suspendu" },
  { value: "REJECTED", label: "Refusé" },
];

export function CreatorsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`/admin/creators?${params.toString()}`);
  }, 300);

  const handleStatusChange = (values: string[]) => {
    const params = new URLSearchParams(searchParams);
    if (values.length > 0) {
      params.set("status", values.join(","));
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    router.push(`/admin/creators?${params.toString()}`);
  };

  return (
    <div className="flex gap-4 mb-4">
      <Input
        placeholder="Rechercher par nom, email ou SIRET..."
        className="max-w-sm"
        defaultValue={searchParams.get("search") || ""}
        onChange={(e) => handleSearch(e.target.value)}
      />
      <MultiSelect
        options={statusOptions}
        placeholder="Filtrer par statut"
        selected={searchParams.get("status")?.split(",") || []}
        onChange={handleStatusChange}
      />
    </div>
  );
}
```

### Références

- [Source: architecture.md#Admin Module]
- [Source: prd.md#FR13]
- [Source: epics.md#Epic 11 - Administration]
- [Story: 11.1 - Dashboard Admin]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
