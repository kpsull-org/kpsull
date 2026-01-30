# Story 6.3: Affichage des Détails d'un Produit

Status: ready-for-dev

## Story

As a visiteur,
I want voir les détails d'un produit,
so that je puisse prendre ma décision d'achat.

## Acceptance Criteria

1. **AC1 - Page détail produit**
   - **Given** un visiteur sur le catalogue
   - **When** il clique sur un produit
   - **Then** il est redirigé vers /[slug]/products/[productId]
   - **And** il voit : galerie images, nom, description, prix, variantes disponibles

2. **AC2 - Galerie d'images**
   - **Given** un produit avec plusieurs images
   - **When** le visiteur navigue dans la galerie
   - **Then** il peut voir toutes les images en grand

3. **AC3 - Sélection de variante et mise à jour du prix**
   - **Given** un produit avec variantes
   - **When** le visiteur sélectionne une variante
   - **Then** le prix se met à jour si la variante a un prix différent

## Tasks / Subtasks

- [ ] **Task 1: Créer la page détail produit** (AC: #1)
  - [ ] 1.1 Créer `src/app/(public)/[slug]/products/[productId]/page.tsx`
  - [ ] 1.2 Récupérer le produit avec images et variantes
  - [ ] 1.3 Afficher les informations complètes

- [ ] **Task 2: Créer la galerie d'images** (AC: #2)
  - [ ] 2.1 Créer `src/components/public/product-gallery.tsx`
  - [ ] 2.2 Implémenter le carousel/thumbnails
  - [ ] 2.3 Ajouter le zoom au clic

- [ ] **Task 3: Créer le sélecteur de variantes** (AC: #3)
  - [ ] 3.1 Créer `src/components/public/variant-selector.tsx`
  - [ ] 3.2 Grouper par type de variante
  - [ ] 3.3 Mettre à jour le prix dynamiquement

- [ ] **Task 4: Ajouter le bouton "Ajouter au panier"** (AC: #1)
  - [ ] 4.1 Créer le bouton avec état
  - [ ] 4.2 Préparer pour la story 7.1

- [ ] **Task 5: Écrire les tests** (AC: #1-3)
  - [ ] 5.1 Tests pour la page détail
  - [ ] 5.2 Tests pour le sélecteur de variantes

## Dev Notes

### Page Détail Produit

```typescript
// src/app/(public)/[slug]/products/[productId]/page.tsx
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma/client";
import { ProductGallery } from "@/components/public/product-gallery";
import { VariantSelector } from "@/components/public/variant-selector";
import { AddToCartButton } from "@/components/public/add-to-cart-button";

interface ProductPageProps {
  params: Promise<{ slug: string; productId: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug, productId } = await params;

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      status: "PUBLISHED",
      creator: { page: { slug, published: true } },
    },
    include: { images: { take: 1 }, creator: true },
  });

  if (!product) {
    return { title: "Produit non trouvé" };
  }

  return {
    title: `${product.name} | ${product.creator.brandName}`,
    description: product.description || `Découvrez ${product.name}`,
    openGraph: {
      title: product.name,
      description: product.description || undefined,
      images: product.images[0]?.url ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, productId } = await params;

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      status: "PUBLISHED",
      creator: { page: { slug, published: true } },
    },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: true,
      creator: true,
    },
  });

  if (!product) {
    notFound();
  }

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);

  return (
    <div className="container py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Galerie */}
        <ProductGallery images={product.images} productName={product.name} />

        {/* Informations */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-2xl font-semibold text-primary mt-2">
              {formatPrice(product.price)}
            </p>
          </div>

          {product.description && (
            <div className="prose prose-sm">
              <p>{product.description}</p>
            </div>
          )}

          {product.variants.length > 0 && (
            <VariantSelector
              variants={product.variants}
              basePrice={product.price}
            />
          )}

          <AddToCartButton
            productId={product.id}
            creatorSlug={slug}
          />
        </div>
      </div>
    </div>
  );
}
```

### Composant ProductGallery

```typescript
// src/components/public/product-gallery.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductGalleryProps {
  images: { id: string; url: string }[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const selectedImage = images[selectedIndex];

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Image principale */}
      <div
        className="relative aspect-square rounded-lg overflow-hidden cursor-zoom-in"
        onClick={() => setIsZoomed(true)}
      >
        <Image
          src={selectedImage?.url || "/placeholder-product.png"}
          alt={productName}
          fill
          className="object-cover"
          priority
        />
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0 border-2",
                index === selectedIndex ? "border-primary" : "border-transparent"
              )}
            >
              <Image src={image.url} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Modal zoom */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-4xl">
          <div className="relative aspect-square">
            <Image
              src={selectedImage?.url || "/placeholder-product.png"}
              alt={productName}
              fill
              className="object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

### Composant VariantSelector

```typescript
// src/components/public/variant-selector.tsx
"use client";

import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Variant {
  id: string;
  type: string;
  customLabel?: string | null;
  value: string;
  priceOverride?: number | null;
  stock: number;
}

interface VariantSelectorProps {
  variants: Variant[];
  basePrice: number;
  onSelect?: (variantId: string, price: number) => void;
}

export function VariantSelector({ variants, basePrice, onSelect }: VariantSelectorProps) {
  // Grouper par type
  const groupedVariants = useMemo(() => {
    return variants.reduce((acc, variant) => {
      const key = variant.customLabel || variant.type;
      if (!acc[key]) acc[key] = [];
      acc[key].push(variant);
      return acc;
    }, {} as Record<string, Variant[]>);
  }, [variants]);

  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [currentPrice, setCurrentPrice] = useState(basePrice);

  const handleSelect = (type: string, variantId: string) => {
    const variant = variants.find((v) => v.id === variantId);
    if (!variant) return;

    const newSelected = { ...selectedVariants, [type]: variantId };
    setSelectedVariants(newSelected);

    const price = variant.priceOverride ?? basePrice;
    setCurrentPrice(price);

    onSelect?.(variantId, price);
  };

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);

  const typeLabels: Record<string, string> = {
    SIZE: "Taille",
    COLOR: "Couleur",
    MATERIAL: "Matière",
    STYLE: "Style",
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedVariants).map(([type, typeVariants]) => (
        <div key={type} className="space-y-3">
          <Label className="text-base font-medium">
            {typeLabels[type] || type}
          </Label>
          <RadioGroup
            value={selectedVariants[type]}
            onValueChange={(value) => handleSelect(type, value)}
            className="flex flex-wrap gap-3"
          >
            {typeVariants.map((variant) => (
              <div key={variant.id} className="flex items-center">
                <RadioGroupItem
                  value={variant.id}
                  id={variant.id}
                  className="peer sr-only"
                  disabled={variant.stock === 0}
                />
                <Label
                  htmlFor={variant.id}
                  className={cn(
                    "px-4 py-2 rounded-md border cursor-pointer transition-colors",
                    "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5",
                    variant.stock === 0 && "opacity-50 cursor-not-allowed line-through"
                  )}
                >
                  {variant.value}
                  {variant.priceOverride && variant.priceOverride !== basePrice && (
                    <span className="text-sm text-muted-foreground ml-1">
                      ({formatPrice(variant.priceOverride)})
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      ))}

      {currentPrice !== basePrice && (
        <p className="text-lg font-semibold text-primary">
          Prix : {formatPrice(currentPrice)}
        </p>
      )}
    </div>
  );
}
```

### Références

- [Source: architecture.md#Product Detail Page]
- [Source: prd.md#FR29]
- [Source: epics.md#Story 6.3]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
