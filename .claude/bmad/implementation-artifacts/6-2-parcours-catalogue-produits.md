# Story 6.2: Parcours du Catalogue Produits

Status: ready-for-dev

## Story

As a visiteur,
I want parcourir les produits d'un créateur,
so that je puisse découvrir ce qui est disponible à l'achat.

## Acceptance Criteria

1. **AC1 - Affichage des produits publiés**
   - **Given** un visiteur sur la page d'un créateur
   - **When** il accède à la section produits ou /[slug]/products
   - **Then** tous les produits PUBLISHED sont affichés en grille
   - **And** chaque produit montre : image principale, nom, prix

2. **AC2 - Prix avec variantes**
   - **Given** des produits avec variantes de prix différentes
   - **When** ils sont affichés dans le catalogue
   - **Then** le prix affiché est "À partir de X€"

## Tasks / Subtasks

- [ ] **Task 1: Créer la page catalogue** (AC: #1)
  - [ ] 1.1 Créer `src/app/(public)/[slug]/products/page.tsx`
  - [ ] 1.2 Récupérer les produits publiés du créateur
  - [ ] 1.3 Afficher en grille responsive

- [ ] **Task 2: Créer le composant ProductCard public** (AC: #1, #2)
  - [ ] 2.1 Créer `src/components/public/product-card.tsx`
  - [ ] 2.2 Afficher image, nom, prix
  - [ ] 2.3 Gérer l'affichage "À partir de"

- [ ] **Task 3: Intégrer dans la page créateur** (AC: #1)
  - [ ] 3.1 Créer la section PRODUCTS_GRID render
  - [ ] 3.2 Lier vers la page catalogue complète

- [ ] **Task 4: Écrire les tests** (AC: #1, #2)
  - [ ] 4.1 Tests pour la page catalogue
  - [ ] 4.2 Tests pour l'affichage des prix

## Dev Notes

### Page Catalogue

```typescript
// src/app/(public)/[slug]/products/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { PublicProductCard } from "@/components/public/product-card";

interface ProductsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { slug } = await params;

  const page = await prisma.creatorPage.findUnique({
    where: { slug, published: true },
    include: {
      creator: {
        include: {
          products: {
            where: { status: "PUBLISHED" },
            include: {
              images: { orderBy: { position: "asc" }, take: 1 },
              variants: true,
            },
            orderBy: { publishedAt: "desc" },
          },
        },
      },
    },
  });

  if (!page) {
    notFound();
  }

  const { creator } = page;

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">
        Tous les produits de {creator.brandName}
      </h1>

      {creator.products.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          Aucun produit disponible pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {creator.products.map((product) => (
            <PublicProductCard
              key={product.id}
              product={product}
              creatorSlug={slug}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Composant PublicProductCard

```typescript
// src/components/public/product-card.tsx
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number; // En centimes
    images: { url: string }[];
    variants: { priceOverride?: number | null }[];
  };
  creatorSlug: string;
}

export function PublicProductCard({ product, creatorSlug }: ProductCardProps) {
  const mainImage = product.images[0]?.url || "/placeholder-product.png";

  // Calculer le prix minimum
  const variantPrices = product.variants
    .filter((v) => v.priceOverride !== null)
    .map((v) => v.priceOverride!);

  const allPrices = [product.price, ...variantPrices];
  const minPrice = Math.min(...allPrices);
  const hasVariablePricing = Math.max(...allPrices) !== minPrice;

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);

  return (
    <Link href={`/${creatorSlug}/products/${product.id}`}>
      <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
        <div className="relative aspect-square">
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        </div>
        <CardContent className="p-4">
          <h3 className="font-medium truncate">{product.name}</h3>
          <p className="text-lg font-semibold text-primary">
            {hasVariablePricing && (
              <span className="text-sm font-normal text-muted-foreground">
                À partir de{" "}
              </span>
            )}
            {formatPrice(minPrice)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
```

### Section ProductsGrid Render

```typescript
// src/components/page-render/products-grid-section.tsx
import { PublicProductCard } from "@/components/public/product-card";

interface ProductsGridSectionProps {
  content: {
    title?: string;
    columns?: number;
    showPrices?: boolean;
  };
  products: Array<{
    id: string;
    name: string;
    price: number;
    images: { url: string }[];
    variants: { priceOverride?: number | null }[];
  }>;
  creatorSlug: string;
}

export function ProductsGridSection({
  content,
  products,
  creatorSlug,
}: ProductsGridSectionProps) {
  const columns = content.columns || 3;

  return (
    <section className="py-16 px-4">
      <div className="container">
        {content.title && (
          <h2 className="text-3xl font-bold mb-8 text-center">{content.title}</h2>
        )}
        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          }}
        >
          {products.map((product) => (
            <PublicProductCard
              key={product.id}
              product={product}
              creatorSlug={creatorSlug}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

### Références

- [Source: architecture.md#Public Catalog]
- [Source: prd.md#FR28]
- [Source: epics.md#Story 6.2]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
