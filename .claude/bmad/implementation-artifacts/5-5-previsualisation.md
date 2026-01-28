# Story 5.5: Prévisualisation de la Page

Status: ready-for-dev

## Story

As a Créateur,
I want prévisualiser ma page avant publication,
so that je puisse vérifier le rendu final.

## Acceptance Criteria

1. **AC1 - Bouton de prévisualisation**
   - **Given** un Créateur sur le Page Builder
   - **When** il clique sur "Prévisualiser"
   - **Then** une nouvelle fenêtre/onglet s'ouvre avec le rendu de la page

2. **AC2 - Rendu fidèle**
   - **Given** une prévisualisation ouverte
   - **When** le Créateur consulte la page
   - **Then** la prévisualisation reflète exactement le contenu actuel

3. **AC3 - Modifications en temps réel**
   - **Given** des modifications non sauvegardées
   - **When** le Créateur prévisualise
   - **Then** la prévisualisation inclut les modifications en cours

## Tasks / Subtasks

- [ ] **Task 1: Créer la page de prévisualisation** (AC: #1, #2)
  - [ ] 1.1 Créer `src/app/(preview)/preview/[slug]/page.tsx`
  - [ ] 1.2 Récupérer la page avec ses sections
  - [ ] 1.3 Rendre les sections avec les composants de rendu

- [ ] **Task 2: Créer les composants de rendu** (AC: #2)
  - [ ] 2.1 Créer `src/components/page-render/hero-section.tsx`
  - [ ] 2.2 Créer `src/components/page-render/about-section.tsx`
  - [ ] 2.3 Créer les composants pour chaque type de section

- [ ] **Task 3: Implémenter la prévisualisation avec données non sauvegardées** (AC: #3)
  - [ ] 3.1 Utiliser les query params ou localStorage pour les données en cours
  - [ ] 3.2 Permettre de prévisualiser sans sauvegarder

- [ ] **Task 4: Ajouter le bouton dans le Page Builder** (AC: #1)
  - [ ] 4.1 Ajouter le bouton "Prévisualiser"
  - [ ] 4.2 Ouvrir dans un nouvel onglet
  - [ ] 4.3 Passer les données en cours si non sauvegardées

- [ ] **Task 5: Écrire les tests** (AC: #1-3)
  - [ ] 5.1 Tests pour les composants de rendu
  - [ ] 5.2 Tests pour la page de prévisualisation

## Dev Notes

### Page de Prévisualisation

```typescript
// src/app/(preview)/preview/[slug]/page.tsx
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma/client";
import { PageRenderer } from "@/components/page-render/page-renderer";

interface PreviewPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ data?: string }>;
}

export default async function PreviewPage({ params, searchParams }: PreviewPageProps) {
  const { slug } = await params;
  const { data } = await searchParams;
  const session = await auth();

  // Récupérer la page
  const page = await prisma.creatorPage.findUnique({
    where: { slug },
    include: {
      sections: { orderBy: { position: "asc" } },
      creator: { include: { user: true } },
    },
  });

  if (!page) {
    notFound();
  }

  // Vérifier que l'utilisateur est le propriétaire
  if (page.creator.userId !== session?.user?.id) {
    notFound();
  }

  // Si des données temporaires sont passées, les utiliser
  let sections = page.sections;
  if (data) {
    try {
      const parsedData = JSON.parse(decodeURIComponent(data));
      sections = parsedData.sections || sections;
    } catch {
      // Ignorer les erreurs de parsing
    }
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-50 bg-yellow-100 border-b border-yellow-300 px-4 py-2 text-center text-sm">
        ⚠️ Mode prévisualisation - Cette page n'est pas encore publiée
      </div>
      <PageRenderer
        page={{
          ...page,
          sections,
        }}
        isPreview
      />
    </div>
  );
}
```

### Composant PageRenderer

```typescript
// src/components/page-render/page-renderer.tsx
import { HeroSection } from "./hero-section";
import { AboutSection } from "./about-section";
import { BentoGridSection } from "./bento-grid-section";
import { ProductsFeaturedSection } from "./products-featured-section";
import { ProductsGridSection } from "./products-grid-section";
import { TestimonialsSection } from "./testimonials-section";
import { ContactSection } from "./contact-section";
import { CustomSection } from "./custom-section";

interface Section {
  id: string;
  type: string;
  content: Record<string, unknown>;
}

interface PageRendererProps {
  page: {
    sections: Section[];
    creator: {
      brandName: string;
      user: { name: string; image?: string };
    };
  };
  isPreview?: boolean;
}

export function PageRenderer({ page, isPreview }: PageRendererProps) {
  const renderSection = (section: Section) => {
    const props = {
      key: section.id,
      content: section.content,
      creator: page.creator,
    };

    switch (section.type) {
      case "HERO":
        return <HeroSection {...props} />;
      case "ABOUT":
        return <AboutSection {...props} />;
      case "BENTO_GRID":
        return <BentoGridSection {...props} />;
      case "PRODUCTS_FEATURED":
        return <ProductsFeaturedSection {...props} />;
      case "PRODUCTS_GRID":
        return <ProductsGridSection {...props} />;
      case "TESTIMONIALS":
        return <TestimonialsSection {...props} />;
      case "CONTACT":
        return <ContactSection {...props} />;
      case "CUSTOM":
        return <CustomSection {...props} />;
      default:
        return null;
    }
  };

  return (
    <main>
      {page.sections.map(renderSection)}
    </main>
  );
}
```

### Composant HeroSection

```typescript
// src/components/page-render/hero-section.tsx
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  content: {
    title: string;
    subtitle: string;
    backgroundImage?: string;
    ctaText?: string;
    ctaLink?: string;
    style?: "default" | "minimal" | "bold";
  };
}

export function HeroSection({ content }: HeroSectionProps) {
  const { title, subtitle, backgroundImage, ctaText, ctaLink, style = "default" } = content;

  return (
    <section className="relative min-h-[60vh] flex items-center justify-center">
      {backgroundImage && (
        <Image
          src={backgroundImage}
          alt=""
          fill
          className="object-cover"
          priority
        />
      )}
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 text-center text-white px-4 max-w-3xl mx-auto">
        <h1 className={`font-bold mb-4 ${
          style === "bold" ? "text-5xl md:text-7xl" : "text-4xl md:text-5xl"
        }`}>
          {title}
        </h1>
        {subtitle && (
          <p className={`mb-8 ${
            style === "minimal" ? "text-lg" : "text-xl md:text-2xl"
          }`}>
            {subtitle}
          </p>
        )}
        {ctaText && ctaLink && (
          <Button asChild size="lg" variant={style === "minimal" ? "outline" : "default"}>
            <Link href={ctaLink}>{ctaText}</Link>
          </Button>
        )}
      </div>
    </section>
  );
}
```

### Bouton de prévisualisation dans le Page Builder

```typescript
// Dans le Page Builder
const handlePreview = () => {
  // Si des modifications non sauvegardées, les passer en query param
  const unsavedData = hasUnsavedChanges
    ? encodeURIComponent(JSON.stringify({ sections: currentSections }))
    : undefined;

  const previewUrl = unsavedData
    ? `/preview/${page.slug}?data=${unsavedData}`
    : `/preview/${page.slug}`;

  window.open(previewUrl, "_blank");
};

<Button variant="outline" onClick={handlePreview}>
  <Eye className="h-4 w-4 mr-2" />
  Prévisualiser
</Button>
```

### Références

- [Source: architecture.md#Page Preview]
- [Source: prd.md#FR25]
- [Source: epics.md#Story 5.5]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
