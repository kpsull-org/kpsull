# Story 5.2: Choix de Template

Status: ready-for-dev

## Story

As a Créateur,
I want choisir un template de base,
so that ma page ait un style professionnel adapté à mon activité.

## Acceptance Criteria

1. **AC1 - Galerie de templates**
   - **Given** un Créateur sur le Page Builder
   - **When** il clique sur "Choisir un template"
   - **Then** une galerie de templates s'affiche (Artisan, Moderne, Minimaliste, etc.)

2. **AC2 - Aperçu du template**
   - **Given** un Créateur sur la galerie
   - **When** il survole un template
   - **Then** un aperçu agrandi s'affiche

3. **AC3 - Application du template**
   - **Given** un template sélectionné
   - **When** le Créateur confirme
   - **Then** les sections par défaut du template sont créées
   - **And** le champ template de CreatorPage est mis à jour

## Tasks / Subtasks

- [ ] **Task 1: Définir les templates disponibles** (AC: #1)
  - [ ] 1.1 Créer `src/modules/pages/domain/templates.ts`
  - [ ] 1.2 Définir les templates : Artisan, Moderne, Minimaliste, Créatif
  - [ ] 1.3 Définir les sections par défaut pour chaque template

- [ ] **Task 2: Créer la galerie de templates** (AC: #1, #2)
  - [ ] 2.1 Créer `src/components/page-builder/template-gallery.tsx`
  - [ ] 2.2 Afficher les cards avec miniatures
  - [ ] 2.3 Implémenter l'aperçu au survol

- [ ] **Task 3: Créer le use case ApplyTemplate** (AC: #3)
  - [ ] 3.1 Créer `src/modules/pages/application/use-cases/apply-template.use-case.ts`
  - [ ] 3.2 Supprimer les sections existantes
  - [ ] 3.3 Créer les nouvelles sections du template
  - [ ] 3.4 Mettre à jour le champ template

- [ ] **Task 4: Écrire les tests** (AC: #1-3)
  - [ ] 4.1 Tests pour les définitions de templates
  - [ ] 4.2 Tests pour ApplyTemplateUseCase

## Dev Notes

### Définition des Templates

```typescript
// src/modules/pages/domain/templates.ts
import { SectionType } from "./value-objects/section-type.vo";

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  sections: {
    type: SectionType;
    defaultContent: Record<string, unknown>;
  }[];
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "artisan",
    name: "Artisan",
    description: "Parfait pour les créateurs manuels et artisans",
    thumbnail: "/templates/artisan.png",
    sections: [
      {
        type: SectionType.hero(),
        defaultContent: {
          title: "Bienvenue dans mon univers",
          subtitle: "Découvrez mes créations artisanales",
          backgroundImage: null,
          ctaText: "Voir mes créations",
          ctaLink: "#products",
        },
      },
      {
        type: SectionType.about(),
        defaultContent: {
          title: "Mon histoire",
          text: "Parlez de votre passion et de votre parcours...",
          image: null,
        },
      },
      {
        type: SectionType.productsFeatured(),
        defaultContent: {
          title: "Mes créations phares",
          productIds: [],
          layout: "grid",
        },
      },
      {
        type: SectionType.contact(),
        defaultContent: {
          title: "Me contacter",
          showEmail: true,
          showSocial: true,
        },
      },
    ],
  },
  {
    id: "moderne",
    name: "Moderne",
    description: "Design épuré et contemporain",
    thumbnail: "/templates/moderne.png",
    sections: [
      {
        type: SectionType.hero(),
        defaultContent: {
          title: "Collection",
          subtitle: "",
          backgroundImage: null,
          ctaText: "Explorer",
          ctaLink: "#products",
          style: "minimal",
        },
      },
      {
        type: SectionType.bentoGrid(),
        defaultContent: {
          images: [],
          layout: "asymmetric",
        },
      },
      {
        type: SectionType.productsGrid(),
        defaultContent: {
          title: "Tous les produits",
          columns: 3,
        },
      },
    ],
  },
  {
    id: "minimaliste",
    name: "Minimaliste",
    description: "L'essentiel, rien de plus",
    thumbnail: "/templates/minimaliste.png",
    sections: [
      {
        type: SectionType.hero(),
        defaultContent: {
          title: "",
          subtitle: "",
          backgroundImage: null,
          style: "logo-only",
        },
      },
      {
        type: SectionType.productsGrid(),
        defaultContent: {
          columns: 2,
          showPrices: true,
        },
      },
    ],
  },
  {
    id: "creatif",
    name: "Créatif",
    description: "Exprimez votre personnalité",
    thumbnail: "/templates/creatif.png",
    sections: [
      {
        type: SectionType.hero(),
        defaultContent: {
          title: "Bienvenue !",
          subtitle: "Explorez un monde de créativité",
          backgroundImage: null,
          style: "bold",
        },
      },
      {
        type: SectionType.bentoGrid(),
        defaultContent: {
          images: [],
          layout: "creative",
        },
      },
      {
        type: SectionType.about(),
        defaultContent: {
          title: "À propos",
          text: "",
          layout: "side-by-side",
        },
      },
      {
        type: SectionType.testimonials(),
        defaultContent: {
          title: "Ce qu'ils en disent",
          testimonials: [],
        },
      },
      {
        type: SectionType.productsFeatured(),
        defaultContent: {
          title: "Coups de cœur",
          productIds: [],
        },
      },
    ],
  },
];
```

### Composant TemplateGallery

```typescript
// src/components/page-builder/template-gallery.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TEMPLATES, TemplateDefinition } from "@/modules/pages/domain/templates";

interface TemplateGalleryProps {
  onSelect: (templateId: string) => Promise<void>;
}

export function TemplateGallery({ onSelect }: TemplateGalleryProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedTemplate) return;
    setIsLoading(true);
    await onSelect(selectedTemplate.id);
    setIsLoading(false);
    setSelectedTemplate(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {TEMPLATES.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedTemplate(template)}
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
              <Image
                src={template.thumbnail}
                alt={template.name}
                fill
                className="object-cover"
              />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{template.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{template.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <>
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <Image
                  src={selectedTemplate.thumbnail}
                  alt={selectedTemplate.name}
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-muted-foreground">{selectedTemplate.description}</p>
              <p className="text-sm">
                Ce template inclut {selectedTemplate.sections.length} sections pré-configurées.
              </p>
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                  Annuler
                </Button>
                <Button onClick={handleConfirm} disabled={isLoading}>
                  {isLoading ? "Application..." : "Utiliser ce template"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

### Références

- [Source: architecture.md#Page Builder Templates]
- [Source: prd.md#FR22]
- [Source: epics.md#Story 5.2]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
