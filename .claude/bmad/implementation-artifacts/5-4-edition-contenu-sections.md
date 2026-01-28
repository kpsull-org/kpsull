# Story 5.4: Édition du Contenu des Sections

Status: ready-for-dev

## Story

As a Créateur,
I want éditer le contenu de chaque section,
so that ma page reflète mon identité et mes produits.

## Acceptance Criteria

1. **AC1 - Édition section HERO**
   - **Given** une section HERO
   - **When** le Créateur l'édite
   - **Then** il peut modifier : titre, sous-titre, image de fond, CTA

2. **AC2 - Édition section ABOUT**
   - **Given** une section ABOUT
   - **When** le Créateur l'édite
   - **Then** il peut modifier : texte de présentation, images, liens

3. **AC3 - Édition section PRODUCTS_FEATURED**
   - **Given** une section PRODUCTS_FEATURED
   - **When** le Créateur l'édite
   - **Then** il peut sélectionner les produits à mettre en avant

4. **AC4 - Upload d'images dans les sections**
   - **Given** des images uploadées dans une section
   - **When** le Créateur valide
   - **Then** les images sont stockées via Cloudinary
   - **And** le JSON content de la PageSection est mis à jour

## Tasks / Subtasks

- [ ] **Task 1: Créer les éditeurs par type de section** (AC: #1, #2, #3)
  - [ ] 1.1 Créer `src/components/page-builder/editors/hero-editor.tsx`
  - [ ] 1.2 Créer `src/components/page-builder/editors/about-editor.tsx`
  - [ ] 1.3 Créer `src/components/page-builder/editors/products-featured-editor.tsx`
  - [ ] 1.4 Créer les éditeurs pour les autres types

- [ ] **Task 2: Créer le composant SectionEditor** (AC: #1-4)
  - [ ] 2.1 Créer `src/components/page-builder/section-editor.tsx`
  - [ ] 2.2 Router vers l'éditeur approprié selon le type
  - [ ] 2.3 Gérer la sauvegarde du contenu

- [ ] **Task 3: Intégrer l'upload d'images** (AC: #4)
  - [ ] 3.1 Réutiliser le service Cloudinary
  - [ ] 3.2 Créer un composant ImagePickerForSection
  - [ ] 3.3 Gérer les URLs dans le contenu JSON

- [ ] **Task 4: Créer le use case UpdateSectionContent** (AC: #1-4)
  - [ ] 4.1 Créer `src/modules/pages/application/use-cases/update-section-content.use-case.ts`
  - [ ] 4.2 Valider le contenu selon le type
  - [ ] 4.3 Persister les modifications

- [ ] **Task 5: Écrire les tests** (AC: #1-4)
  - [ ] 5.1 Tests unitaires pour chaque éditeur
  - [ ] 5.2 Tests pour le use case

## Dev Notes

### Composant HeroEditor

```typescript
// src/components/page-builder/editors/hero-editor.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/products/image-uploader";

interface HeroContent {
  title: string;
  subtitle: string;
  backgroundImage?: string;
  ctaText: string;
  ctaLink: string;
  style?: "default" | "minimal" | "bold";
}

interface HeroEditorProps {
  content: HeroContent;
  onChange: (content: HeroContent) => void;
}

export function HeroEditor({ content, onChange }: HeroEditorProps) {
  const handleChange = (field: keyof HeroContent, value: string) => {
    onChange({ ...content, [field]: value });
  };

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "pages/hero");

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const { url } = await response.json();
      onChange({ ...content, backgroundImage: url });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Titre principal</Label>
        <Input
          id="title"
          value={content.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Bienvenue sur ma boutique"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtitle">Sous-titre</Label>
        <Textarea
          id="subtitle"
          value={content.subtitle}
          onChange={(e) => handleChange("subtitle", e.target.value)}
          placeholder="Découvrez mes créations uniques..."
        />
      </div>

      <div className="space-y-2">
        <Label>Image de fond</Label>
        {content.backgroundImage ? (
          <div className="relative">
            <img
              src={content.backgroundImage}
              alt="Background"
              className="w-full h-48 object-cover rounded-lg"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => onChange({ ...content, backgroundImage: undefined })}
            >
              Supprimer
            </Button>
          </div>
        ) : (
          <ImageUploader onUpload={handleImageUpload} />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ctaText">Texte du bouton</Label>
          <Input
            id="ctaText"
            value={content.ctaText}
            onChange={(e) => handleChange("ctaText", e.target.value)}
            placeholder="Voir mes créations"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ctaLink">Lien du bouton</Label>
          <Input
            id="ctaLink"
            value={content.ctaLink}
            onChange={(e) => handleChange("ctaLink", e.target.value)}
            placeholder="#products"
          />
        </div>
      </div>
    </div>
  );
}
```

### Composant ProductsFeaturedEditor

```typescript
// src/components/page-builder/editors/products-featured-editor.tsx
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  price: number;
  images: { url: string }[];
}

interface ProductsFeaturedContent {
  title: string;
  productIds: string[];
  layout: "grid" | "carousel";
}

interface ProductsFeaturedEditorProps {
  content: ProductsFeaturedContent;
  onChange: (content: ProductsFeaturedContent) => void;
}

export function ProductsFeaturedEditor({ content, onChange }: ProductsFeaturedEditorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products?status=PUBLISHED")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products);
        setLoading(false);
      });
  }, []);

  const toggleProduct = (productId: string) => {
    const newIds = content.productIds.includes(productId)
      ? content.productIds.filter((id) => id !== productId)
      : [...content.productIds, productId];
    onChange({ ...content, productIds: newIds });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Titre de la section</Label>
        <Input
          id="title"
          value={content.title}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          placeholder="Mes créations phares"
        />
      </div>

      <div className="space-y-2">
        <Label>Produits à mettre en avant</Label>
        {loading ? (
          <p className="text-muted-foreground">Chargement...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {products.map((product) => (
              <div
                key={product.id}
                className={`relative border rounded-lg p-2 cursor-pointer transition-colors ${
                  content.productIds.includes(product.id) ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => toggleProduct(product.id)}
              >
                <div className="relative aspect-square mb-2">
                  <Image
                    src={product.images[0]?.url || "/placeholder.png"}
                    alt={product.name}
                    fill
                    className="object-cover rounded"
                  />
                </div>
                <p className="text-sm font-medium truncate">{product.name}</p>
                <Checkbox
                  checked={content.productIds.includes(product.id)}
                  className="absolute top-4 left-4"
                />
              </div>
            ))}
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          {content.productIds.length} produit(s) sélectionné(s)
        </p>
      </div>
    </div>
  );
}
```

### Composant SectionEditor (Router)

```typescript
// src/components/page-builder/section-editor.tsx
"use client";

import { HeroEditor } from "./editors/hero-editor";
import { AboutEditor } from "./editors/about-editor";
import { ProductsFeaturedEditor } from "./editors/products-featured-editor";
// ... autres imports

interface SectionEditorProps {
  type: string;
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}

export function SectionEditor({ type, content, onChange }: SectionEditorProps) {
  switch (type) {
    case "HERO":
      return <HeroEditor content={content as any} onChange={onChange} />;
    case "ABOUT":
      return <AboutEditor content={content as any} onChange={onChange} />;
    case "PRODUCTS_FEATURED":
      return <ProductsFeaturedEditor content={content as any} onChange={onChange} />;
    // ... autres cas
    default:
      return <p>Éditeur non disponible pour ce type de section</p>;
  }
}
```

### Références

- [Source: architecture.md#Section Content Schema]
- [Source: prd.md#FR24]
- [Source: epics.md#Story 5.4]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
