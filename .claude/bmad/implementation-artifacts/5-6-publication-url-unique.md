# Story 5.6: Publication de la Page avec URL Unique

Status: ready-for-dev

## Story

As a Créateur,
I want publier ma page avec une URL unique,
so that mes clients puissent y accéder facilement.

## Acceptance Criteria

1. **AC1 - Publication de la page**
   - **Given** un Créateur avec une page complète
   - **When** il clique sur "Publier"
   - **Then** published passe à true
   - **And** publishedAt est défini
   - **And** la page est accessible à l'URL /[slug]

2. **AC2 - Gestion du slug unique**
   - **Given** un slug déjà pris
   - **When** le Créateur tente de publier
   - **Then** un message lui demande de choisir un autre slug

3. **AC3 - Dépublication**
   - **Given** une page publiée
   - **When** le Créateur clique sur "Dépublier"
   - **Then** published passe à false
   - **And** la page n'est plus accessible publiquement

## Tasks / Subtasks

- [ ] **Task 1: Créer le use case PublishPage** (AC: #1, #2)
  - [ ] 1.1 Créer `src/modules/pages/application/use-cases/publish-page.use-case.ts`
  - [ ] 1.2 Vérifier l'unicité du slug
  - [ ] 1.3 Mettre à jour published et publishedAt

- [ ] **Task 2: Créer le use case UnpublishPage** (AC: #3)
  - [ ] 2.1 Créer `src/modules/pages/application/use-cases/unpublish-page.use-case.ts`
  - [ ] 2.2 Mettre à jour le statut

- [ ] **Task 3: Créer la page publique** (AC: #1)
  - [ ] 3.1 Créer `src/app/(public)/[slug]/page.tsx`
  - [ ] 3.2 Récupérer la page publiée
  - [ ] 3.3 Afficher avec PageRenderer

- [ ] **Task 4: Gérer l'édition du slug** (AC: #2)
  - [ ] 4.1 Ajouter un champ d'édition du slug dans les settings
  - [ ] 4.2 Vérifier la disponibilité en temps réel
  - [ ] 4.3 Afficher les suggestions si pris

- [ ] **Task 5: Ajouter les boutons Publier/Dépublier** (AC: #1, #3)
  - [ ] 5.1 Ajouter dans le Page Builder
  - [ ] 5.2 Afficher l'état actuel
  - [ ] 5.3 Afficher l'URL publique après publication

- [ ] **Task 6: Écrire les tests** (AC: #1-3)
  - [ ] 6.1 Tests pour PublishPageUseCase
  - [ ] 6.2 Tests pour UnpublishPageUseCase
  - [ ] 6.3 Tests pour la page publique

## Dev Notes

### Use Case PublishPage

```typescript
// src/modules/pages/application/use-cases/publish-page.use-case.ts
export class PublishPageUseCase implements IUseCase<PublishPageDTO, void> {
  constructor(private readonly pageRepo: IPageRepository) {}

  async execute(dto: PublishPageDTO): Promise<Result<void>> {
    const page = await this.pageRepo.findById(dto.pageId);
    if (!page) {
      return Result.fail("Page non trouvée");
    }

    if (page.creatorId !== dto.creatorId) {
      return Result.fail("Accès non autorisé");
    }

    // Vérifier si le slug est disponible
    const existingPage = await this.pageRepo.findBySlug(page.slug);
    if (existingPage && !existingPage.id.equals(page.id)) {
      return Result.fail("Ce slug est déjà utilisé par une autre page");
    }

    // Vérifier qu'il y a au moins une section
    if (page.sections.length === 0) {
      return Result.fail("La page doit contenir au moins une section");
    }

    // Publier
    const publishResult = page.publish();
    if (publishResult.isFailure) {
      return Result.fail(publishResult.error!);
    }

    await this.pageRepo.save(page);

    return Result.ok();
  }
}
```

### Page Publique

```typescript
// src/app/(public)/[slug]/page.tsx
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma/client";
import { PageRenderer } from "@/components/page-render/page-renderer";

interface PublicPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PublicPageProps): Promise<Metadata> {
  const { slug } = await params;

  const page = await prisma.creatorPage.findUnique({
    where: { slug, published: true },
    include: { creator: true },
  });

  if (!page) {
    return { title: "Page non trouvée" };
  }

  return {
    title: page.creator.brandName,
    description: `Découvrez les créations de ${page.creator.brandName}`,
    openGraph: {
      title: page.creator.brandName,
      type: "website",
      url: `${process.env.NEXTAUTH_URL}/${slug}`,
    },
  };
}

export default async function PublicPage({ params }: PublicPageProps) {
  const { slug } = await params;

  const page = await prisma.creatorPage.findUnique({
    where: { slug, published: true },
    include: {
      sections: { orderBy: { position: "asc" } },
      creator: {
        include: {
          user: { select: { name: true, image: true } },
          products: {
            where: { status: "PUBLISHED" },
            include: { images: true },
          },
        },
      },
    },
  });

  if (!page) {
    notFound();
  }

  return <PageRenderer page={page} />;
}
```

### Composant SlugEditor

```typescript
// src/components/page-builder/slug-editor.tsx
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, Loader2 } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

interface SlugEditorProps {
  currentSlug: string;
  onChange: (slug: string) => void;
}

export function SlugEditor({ currentSlug, onChange }: SlugEditorProps) {
  const [slug, setSlug] = useState(currentSlug);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const checkAvailability = useDebouncedCallback(async (value: string) => {
    if (!value || value === currentSlug) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    const response = await fetch(`/api/pages/check-slug?slug=${value}`);
    const { available } = await response.json();
    setIsAvailable(available);
    setIsChecking(false);
  }, 500);

  const handleChange = (value: string) => {
    // Normaliser le slug
    const normalized = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    setSlug(normalized);
    onChange(normalized);
    checkAvailability(normalized);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="slug">URL de la page</Label>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">
          {process.env.NEXT_PUBLIC_URL}/
        </span>
        <div className="relative flex-1">
          <Input
            id="slug"
            value={slug}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="ma-boutique"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isChecking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {!isChecking && isAvailable === true && <Check className="h-4 w-4 text-green-500" />}
            {!isChecking && isAvailable === false && <X className="h-4 w-4 text-destructive" />}
          </div>
        </div>
      </div>
      {isAvailable === false && (
        <p className="text-sm text-destructive">Ce slug est déjà pris</p>
      )}
    </div>
  );
}
```

### API Route Check Slug

```typescript
// src/app/api/pages/check-slug/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ available: false });
  }

  const existing = await prisma.creatorPage.findUnique({
    where: { slug },
  });

  return NextResponse.json({ available: !existing });
}
```

### Références

- [Source: architecture.md#Public Pages]
- [Source: prd.md#FR26]
- [Source: epics.md#Story 5.6]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
