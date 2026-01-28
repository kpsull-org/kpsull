# Story 5.1: Création de la Page Créateur

Status: ready-for-dev

## Story

As a Créateur,
I want créer ma page vitrine,
so that les clients puissent découvrir mon univers et mes créations.

## Acceptance Criteria

1. **AC1 - Page créée automatiquement**
   - **Given** un nouveau Créateur sans page
   - **When** il accède au Page Builder
   - **Then** une CreatorPage est créée automatiquement
   - **And** il voit une page vide avec option "Choisir un template"

2. **AC2 - Page existante accessible**
   - **Given** un Créateur avec une page existante
   - **When** il accède au Page Builder
   - **Then** il voit sa page actuelle avec possibilité de modifier

## Tasks / Subtasks

- [ ] **Task 1: Créer le module Pages** (AC: #1, #2)
  - [ ] 1.1 Créer la structure hexagonale `src/modules/pages/`
  - [ ] 1.2 Créer `CreatorPage` entity
  - [ ] 1.3 Créer `PageSection` entity
  - [ ] 1.4 Créer le repository interface et implémentation

- [ ] **Task 2: Créer la page du Page Builder** (AC: #1, #2)
  - [ ] 2.1 Créer `src/app/(dashboard)/page-builder/page.tsx`
  - [ ] 2.2 Vérifier si une page existe, sinon en créer une
  - [ ] 2.3 Afficher l'interface du builder

- [ ] **Task 3: Implémenter GetOrCreatePage use case** (AC: #1, #2)
  - [ ] 3.1 Créer `src/modules/pages/application/use-cases/get-or-create-page.use-case.ts`
  - [ ] 3.2 Récupérer la page existante ou en créer une nouvelle

- [ ] **Task 4: Créer l'interface du Page Builder vide** (AC: #1)
  - [ ] 4.1 Afficher le message de bienvenue
  - [ ] 4.2 Afficher le CTA "Choisir un template"
  - [ ] 4.3 Afficher le CTA "Commencer de zéro"

- [ ] **Task 5: Écrire les tests** (AC: #1, #2)
  - [ ] 5.1 Tests unitaires pour CreatorPage entity
  - [ ] 5.2 Tests unitaires pour le use case
  - [ ] 5.3 Tests d'intégration

## Dev Notes

### Structure Module Pages

```
src/modules/pages/
├── domain/
│   ├── entities/
│   │   ├── creator-page.entity.ts
│   │   └── page-section.entity.ts
│   ├── value-objects/
│   │   └── section-type.vo.ts
│   └── errors/
│       └── page.errors.ts
├── application/
│   ├── ports/
│   │   └── page.repository.interface.ts
│   ├── use-cases/
│   │   ├── get-or-create-page.use-case.ts
│   │   ├── add-section.use-case.ts
│   │   ├── update-section.use-case.ts
│   │   ├── remove-section.use-case.ts
│   │   ├── reorder-sections.use-case.ts
│   │   └── publish-page.use-case.ts
│   └── dtos/
│       └── page.dto.ts
└── infrastructure/
    └── repositories/
        └── prisma-page.repository.ts
```

### Entity CreatorPage

```typescript
// src/modules/pages/domain/entities/creator-page.entity.ts
import { Entity, UniqueId, Result } from "@/shared/domain";
import { PageSection } from "./page-section.entity";

interface CreatorPageProps {
  creatorId: string;
  slug: string;
  template?: string;
  published: boolean;
  publishedAt?: Date;
  sections: PageSection[];
}

export class CreatorPage extends Entity<CreatorPageProps> {
  private constructor(props: CreatorPageProps, id?: UniqueId) {
    super(props, id);
  }

  get creatorId(): string { return this.props.creatorId; }
  get slug(): string { return this.props.slug; }
  get template(): string | undefined { return this.props.template; }
  get published(): boolean { return this.props.published; }
  get publishedAt(): Date | undefined { return this.props.publishedAt; }
  get sections(): PageSection[] { return this.props.sections; }

  static create(props: Omit<CreatorPageProps, "published" | "publishedAt" | "sections">, id?: UniqueId): Result<CreatorPage> {
    if (!props.slug.trim()) {
      return Result.fail("Le slug est requis");
    }

    // Valider le format du slug
    if (!/^[a-z0-9-]+$/.test(props.slug)) {
      return Result.fail("Le slug ne peut contenir que des lettres minuscules, chiffres et tirets");
    }

    return Result.ok(new CreatorPage({
      ...props,
      published: false,
      publishedAt: undefined,
      sections: [],
    }, id));
  }

  addSection(section: PageSection): void {
    this.props.sections.push(section);
  }

  removeSection(sectionId: UniqueId): Result<void> {
    const index = this.props.sections.findIndex(s => s.id.equals(sectionId));
    if (index === -1) {
      return Result.fail("Section non trouvée");
    }
    this.props.sections.splice(index, 1);
    return Result.ok();
  }

  reorderSections(sectionIds: string[]): Result<void> {
    const reordered: PageSection[] = [];
    for (const id of sectionIds) {
      const section = this.props.sections.find(s => s.id.value === id);
      if (!section) {
        return Result.fail(`Section ${id} non trouvée`);
      }
      reordered.push(section);
    }
    this.props.sections = reordered;
    return Result.ok();
  }

  publish(): Result<void> {
    if (this.published) {
      return Result.fail("La page est déjà publiée");
    }
    this.props.published = true;
    this.props.publishedAt = new Date();
    return Result.ok();
  }

  unpublish(): Result<void> {
    if (!this.published) {
      return Result.fail("La page n'est pas publiée");
    }
    this.props.published = false;
    return Result.ok();
  }

  setTemplate(template: string): void {
    this.props.template = template;
  }
}
```

### Schéma Prisma

```prisma
model CreatorPage {
  id          String        @id @default(cuid())
  creatorId   String        @unique
  creator     Creator       @relation(fields: [creatorId], references: [id], onDelete: Cascade)

  slug        String        @unique
  template    String?
  published   Boolean       @default(false)
  publishedAt DateTime?

  sections    PageSection[]

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([slug])
  @@map("creator_pages")
}

model PageSection {
  id          String      @id @default(cuid())
  pageId      String
  page        CreatorPage @relation(fields: [pageId], references: [id], onDelete: Cascade)

  type        String      // HERO, ABOUT, BENTO_GRID, etc.
  position    Int
  content     Json        // Configuration spécifique au type

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([pageId])
  @@map("page_sections")
}
```

### Références

- [Source: architecture.md#Page Builder Module]
- [Source: prd.md#FR21]
- [Source: epics.md#Story 5.1]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
