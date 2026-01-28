# Story 6.1: Affichage de la Page Créateur Publique

Status: ready-for-dev

## Story

As a visiteur,
I want consulter la page d'un créateur,
so that je puisse découvrir son univers et ses créations.

## Acceptance Criteria

1. **AC1 - Affichage page publiée**
   - **Given** une page créateur publiée
   - **When** un visiteur accède à /[slug]
   - **Then** la page s'affiche avec toutes les sections configurées
   - **And** le temps de chargement est < 1.5s (LCP)

2. **AC2 - Page non publiée = 404**
   - **Given** une page non publiée
   - **When** un visiteur accède à /[slug]
   - **Then** une page 404 est affichée

3. **AC3 - Slug inexistant = 404 avec suggestions**
   - **Given** un slug inexistant
   - **When** un visiteur accède à /[slug]
   - **Then** une page 404 est affichée avec suggestions

## Tasks / Subtasks

- [ ] **Task 1: Optimiser la page publique** (AC: #1)
  - [ ] 1.1 Implémenter le cache statique avec ISR
  - [ ] 1.2 Optimiser les images avec next/image
  - [ ] 1.3 Lazy-load les sections non-critiques

- [ ] **Task 2: Créer la page 404 personnalisée** (AC: #2, #3)
  - [ ] 2.1 Créer `src/app/(public)/[slug]/not-found.tsx`
  - [ ] 2.2 Afficher un message approprié
  - [ ] 2.3 Proposer des suggestions de créateurs populaires

- [ ] **Task 3: Ajouter les métadonnées SEO** (AC: #1)
  - [ ] 3.1 Générer les meta tags dynamiques
  - [ ] 3.2 Ajouter Open Graph tags
  - [ ] 3.3 Ajouter le schema JSON-LD

- [ ] **Task 4: Écrire les tests** (AC: #1-3)
  - [ ] 4.1 Tests de performance LCP
  - [ ] 4.2 Tests pour les pages 404

## Dev Notes

### Page avec ISR et Optimisations

```typescript
// src/app/(public)/[slug]/page.tsx
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma/client";
import { PageRenderer } from "@/components/page-render/page-renderer";

// Revalidate every hour
export const revalidate = 3600;

// Generate static params for popular creators
export async function generateStaticParams() {
  const pages = await prisma.creatorPage.findMany({
    where: { published: true },
    select: { slug: true },
    take: 100, // Top 100 most active
  });

  return pages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const page = await prisma.creatorPage.findUnique({
    where: { slug, published: true },
    include: { creator: true },
  });

  if (!page) {
    return { title: "Page non trouvée | Kpsull" };
  }

  const description = `Découvrez les créations uniques de ${page.creator.brandName} sur Kpsull`;

  return {
    title: `${page.creator.brandName} | Kpsull`,
    description,
    openGraph: {
      title: page.creator.brandName,
      description,
      type: "website",
      url: `https://kpsull.com/${slug}`,
      images: page.creator.logo ? [{ url: page.creator.logo }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: page.creator.brandName,
      description,
    },
  };
}

export default async function PublicPage({ params }: Props) {
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
            include: { images: { take: 1 } },
            take: 20,
          },
        },
      },
    },
  });

  if (!page) {
    notFound();
  }

  // JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: page.creator.brandName,
    url: `https://kpsull.com/${slug}`,
    description: `Boutique de ${page.creator.brandName}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageRenderer page={page} />
    </>
  );
}
```

### Page 404 Personnalisée

```typescript
// src/app/(public)/[slug]/not-found.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma/client";

export default async function NotFound() {
  // Récupérer quelques créateurs populaires pour suggestions
  const popularCreators = await prisma.creator.findMany({
    where: {
      page: { published: true },
    },
    orderBy: { totalOrders: "desc" },
    take: 4,
    include: {
      page: { select: { slug: true } },
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Page non trouvée</h2>
        <p className="text-muted-foreground mb-8">
          Cette page de créateur n'existe pas ou n'est pas encore publiée.
        </p>

        {popularCreators.length > 0 && (
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-4">
              Découvrez nos créateurs populaires :
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {popularCreators.map((creator) => (
                <Button key={creator.id} variant="outline" size="sm" asChild>
                  <Link href={`/${creator.page?.slug}`}>
                    {creator.brandName}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        )}

        <Button asChild>
          <Link href="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </div>
  );
}
```

### Références

- [Source: architecture.md#Public Pages]
- [Source: prd.md#FR27]
- [Source: epics.md#Story 6.1]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
