# Story 4.6: Liste et Filtrage des Produits

Status: ready-for-dev

## Story

As a Créateur,
I want voir et filtrer mes produits,
so that je puisse gérer mon catalogue efficacement.

## Acceptance Criteria

1. **AC1 - Liste des produits**
   - **Given** un Créateur sur la page produits
   - **When** il consulte la liste
   - **Then** il voit tous ses produits avec : image, nom, prix, statut, projet

2. **AC2 - Filtrage par statut**
   - **Given** des filtres disponibles
   - **When** le Créateur filtre par statut (DRAFT/PUBLISHED)
   - **Then** la liste est mise à jour en temps réel

3. **AC3 - Filtrage par projet**
   - **Given** des filtres disponibles
   - **When** le Créateur filtre par projet
   - **Then** seuls les produits du projet sélectionné sont affichés

4. **AC4 - Recherche par nom**
   - **Given** une recherche par nom
   - **When** le Créateur saisit un terme
   - **Then** les produits correspondants sont affichés

## Tasks / Subtasks

- [ ] **Task 1: Créer la page liste produits** (AC: #1)
  - [ ] 1.1 Créer `src/app/(dashboard)/products/page.tsx`
  - [ ] 1.2 Afficher la grille de produits avec images
  - [ ] 1.3 Afficher les badges de statut
  - [ ] 1.4 Ajouter le bouton "Nouveau produit"

- [ ] **Task 2: Implémenter le use case ListProducts** (AC: #1)
  - [ ] 2.1 Créer `src/modules/products/application/use-cases/products/list-products.use-case.ts`
  - [ ] 2.2 Récupérer les produits avec pagination
  - [ ] 2.3 Inclure les images et projet associés

- [ ] **Task 3: Créer les composants de filtrage** (AC: #2, #3)
  - [ ] 3.1 Créer `ProductFilters` component
  - [ ] 3.2 Implémenter le filtre par statut (tabs ou dropdown)
  - [ ] 3.3 Implémenter le filtre par projet (dropdown)
  - [ ] 3.4 Synchroniser avec les query params

- [ ] **Task 4: Implémenter la recherche** (AC: #4)
  - [ ] 4.1 Ajouter le champ de recherche
  - [ ] 4.2 Implémenter le debounce
  - [ ] 4.3 Rechercher dans nom et description

- [ ] **Task 5: Créer le composant ProductCard** (AC: #1)
  - [ ] 5.1 Créer `src/components/products/product-card.tsx`
  - [ ] 5.2 Afficher image, nom, prix, statut
  - [ ] 5.3 Ajouter les actions rapides (éditer, publier/dépublier)

- [ ] **Task 6: Écrire les tests** (AC: #1-4)
  - [ ] 6.1 Tests unitaires pour ListProductsUseCase
  - [ ] 6.2 Tests pour les filtres
  - [ ] 6.3 Tests pour la recherche

## Dev Notes

### Page Liste Produits

```typescript
// src/app/(dashboard)/products/page.tsx
import { Suspense } from "react";
import { auth } from "@/lib/auth/config";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductGrid } from "@/components/products/product-grid";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

interface SearchParams {
  status?: string;
  project?: string;
  search?: string;
  page?: string;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  const params = await searchParams;

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mes produits</h1>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="h-4 w-4 mr-2" /> Nouveau produit
          </Link>
        </Button>
      </div>

      <ProductFilters
        status={params.status}
        project={params.project}
        search={params.search}
      />

      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid
          status={params.status}
          projectId={params.project}
          search={params.search}
          page={parseInt(params.page || "1")}
        />
      </Suspense>
    </div>
  );
}
```

### Composant ProductFilters

```typescript
// src/components/products/product-filters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

interface ProductFiltersProps {
  status?: string;
  project?: string;
  search?: string;
  projects?: { id: string; name: string }[];
}

export function ProductFilters({ status, project, search, projects }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.delete("page"); // Reset page on filter change
    startTransition(() => {
      router.push(`/products?${params.toString()}`);
    });
  }, [router, searchParams]);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    updateParams({ search: value || undefined });
  }, 300);

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un produit..."
          defaultValue={search}
          onChange={(e) => debouncedSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs value={status || "all"} onValueChange={(v) => updateParams({ status: v === "all" ? undefined : v })}>
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="DRAFT">Brouillons</TabsTrigger>
          <TabsTrigger value="PUBLISHED">Publiés</TabsTrigger>
        </TabsList>
      </Tabs>

      {projects && projects.length > 0 && (
        <Select value={project || "all"} onValueChange={(v) => updateParams({ project: v === "all" ? undefined : v })}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tous les projets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les projets</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
```

### Composant ProductCard

```typescript
// src/components/products/product-card.tsx
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    status: string;
    images: { url: string }[];
    project?: { name: string } | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const mainImage = product.images[0]?.url || "/placeholder-product.png";
  const priceFormatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(product.price / 100);

  return (
    <Card className="overflow-hidden group">
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square">
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          <Badge
            variant={product.status === "PUBLISHED" ? "default" : "secondary"}
            className="absolute top-2 left-2"
          >
            {product.status === "PUBLISHED" ? "Publié" : "Brouillon"}
          </Badge>
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-medium truncate hover:underline">{product.name}</h3>
        </Link>
        <p className="text-lg font-semibold text-primary">{priceFormatted}</p>
        {product.project && (
          <p className="text-sm text-muted-foreground">{product.project.name}</p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/products/${product.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" /> Modifier
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Dupliquer</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Supprimer</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
```

### Use Case ListProducts

```typescript
// src/modules/products/application/use-cases/products/list-products.use-case.ts
interface ListProductsDTO {
  creatorId: string;
  status?: string;
  projectId?: string;
  search?: string;
  page: number;
  limit: number;
}

interface ListProductsResult {
  products: ProductDTO[];
  total: number;
  pages: number;
}

export class ListProductsUseCase {
  async execute(dto: ListProductsDTO): Promise<Result<ListProductsResult>> {
    const { creatorId, status, projectId, search, page, limit } = dto;

    const where: Prisma.ProductWhereInput = {
      creatorId,
      ...(status && { status }),
      ...(projectId && { projectId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [products, total] = await Promise.all([
      this.productRepo.findMany({
        where,
        include: { images: true, project: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.productRepo.count({ where }),
    ]);

    return Result.ok({
      products: products.map(ProductMapper.toDTO),
      total,
      pages: Math.ceil(total / limit),
    });
  }
}
```

### Références

- [Source: architecture.md#Product Listing]
- [Source: prd.md#FR16]
- [Source: epics.md#Story 4.6]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
