# Story 5.3: Gestion des Sections de Page

Status: ready-for-dev

## Story

As a Créateur,
I want ajouter et organiser des sections sur ma page,
so that je puisse présenter mon contenu de manière personnalisée.

## Acceptance Criteria

1. **AC1 - Ajout de section**
   - **Given** un Créateur sur le Page Builder
   - **When** il clique sur "Ajouter une section"
   - **Then** il peut choisir : HERO, ABOUT, BENTO_GRID, PRODUCTS_FEATURED, PRODUCTS_GRID, TESTIMONIALS, CONTACT, CUSTOM

2. **AC2 - Réorganisation par drag-and-drop**
   - **Given** des sections existantes
   - **When** le Créateur drag-and-drop une section
   - **Then** les positions sont réorganisées
   - **And** les champs position des PageSection sont mis à jour

3. **AC3 - Suppression de section**
   - **Given** une section existante
   - **When** le Créateur clique sur "Supprimer"
   - **Then** la section est supprimée de la page

## Tasks / Subtasks

- [ ] **Task 1: Créer le composant SectionPicker** (AC: #1)
  - [ ] 1.1 Créer `src/components/page-builder/section-picker.tsx`
  - [ ] 1.2 Afficher les types de sections disponibles
  - [ ] 1.3 Montrer une description/aperçu de chaque type

- [ ] **Task 2: Créer le composant SectionList** (AC: #2, #3)
  - [ ] 2.1 Créer `src/components/page-builder/section-list.tsx`
  - [ ] 2.2 Intégrer dnd-kit pour le drag-and-drop
  - [ ] 2.3 Afficher les contrôles de section (éditer, supprimer)

- [ ] **Task 3: Implémenter les use cases** (AC: #1, #2, #3)
  - [ ] 3.1 Créer `AddSectionUseCase`
  - [ ] 3.2 Créer `ReorderSectionsUseCase`
  - [ ] 3.3 Créer `RemoveSectionUseCase`

- [ ] **Task 4: Créer les Server Actions** (AC: #1, #2, #3)
  - [ ] 4.1 Créer les actions pour ajout/réorganisation/suppression
  - [ ] 4.2 Revalider la page après modification

- [ ] **Task 5: Écrire les tests** (AC: #1-3)
  - [ ] 5.1 Tests unitaires pour les use cases
  - [ ] 5.2 Tests pour le drag-and-drop

## Dev Notes

### Value Object SectionType

```typescript
// src/modules/pages/domain/value-objects/section-type.vo.ts
import { ValueObject } from "@/shared/domain";

type SectionTypeValue =
  | "HERO"
  | "ABOUT"
  | "BENTO_GRID"
  | "PRODUCTS_FEATURED"
  | "PRODUCTS_GRID"
  | "TESTIMONIALS"
  | "CONTACT"
  | "CUSTOM";

interface SectionTypeProps {
  value: SectionTypeValue;
}

export class SectionType extends ValueObject<SectionTypeProps> {
  private static readonly LABELS: Record<SectionTypeValue, string> = {
    HERO: "Hero / Bannière",
    ABOUT: "À propos",
    BENTO_GRID: "Grille Bento",
    PRODUCTS_FEATURED: "Produits en vedette",
    PRODUCTS_GRID: "Grille de produits",
    TESTIMONIALS: "Témoignages",
    CONTACT: "Contact",
    CUSTOM: "Section personnalisée",
  };

  private static readonly DESCRIPTIONS: Record<SectionTypeValue, string> = {
    HERO: "Grande bannière avec titre, sous-titre et image de fond",
    ABOUT: "Section pour vous présenter et raconter votre histoire",
    BENTO_GRID: "Grille d'images en disposition asymétrique",
    PRODUCTS_FEATURED: "Sélection de vos produits phares",
    PRODUCTS_GRID: "Affichage de tous vos produits en grille",
    TESTIMONIALS: "Avis et témoignages de vos clients",
    CONTACT: "Informations de contact et réseaux sociaux",
    CUSTOM: "Section HTML/texte libre",
  };

  get value(): SectionTypeValue { return this.props.value; }
  get label(): string { return SectionType.LABELS[this.value]; }
  get description(): string { return SectionType.DESCRIPTIONS[this.value]; }

  static hero(): SectionType { return new SectionType({ value: "HERO" }); }
  static about(): SectionType { return new SectionType({ value: "ABOUT" }); }
  static bentoGrid(): SectionType { return new SectionType({ value: "BENTO_GRID" }); }
  static productsFeatured(): SectionType { return new SectionType({ value: "PRODUCTS_FEATURED" }); }
  static productsGrid(): SectionType { return new SectionType({ value: "PRODUCTS_GRID" }); }
  static testimonials(): SectionType { return new SectionType({ value: "TESTIMONIALS" }); }
  static contact(): SectionType { return new SectionType({ value: "CONTACT" }); }
  static custom(): SectionType { return new SectionType({ value: "CUSTOM" }); }

  static all(): SectionType[] {
    return [
      this.hero(),
      this.about(),
      this.bentoGrid(),
      this.productsFeatured(),
      this.productsGrid(),
      this.testimonials(),
      this.contact(),
      this.custom(),
    ];
  }
}
```

### Composant SectionList avec DnD

```typescript
// src/components/page-builder/section-list.tsx
"use client";

import { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableSection } from "./sortable-section";

interface Section {
  id: string;
  type: string;
  position: number;
  content: Record<string, unknown>;
}

interface SectionListProps {
  sections: Section[];
  onReorder: (sectionIds: string[]) => Promise<void>;
  onEdit: (sectionId: string) => void;
  onRemove: (sectionId: string) => Promise<void>;
}

export function SectionList({ sections, onReorder, onEdit, onRemove }: SectionListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedSections = useMemo(
    () => [...sections].sort((a, b) => a.position - b.position),
    [sections]
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedSections.findIndex((s) => s.id === active.id);
      const newIndex = sortedSections.findIndex((s) => s.id === over.id);
      const newOrder = arrayMove(sortedSections, oldIndex, newIndex);
      await onReorder(newOrder.map((s) => s.id));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortedSections.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {sortedSections.map((section) => (
            <SortableSection
              key={section.id}
              section={section}
              onEdit={() => onEdit(section.id)}
              onRemove={() => onRemove(section.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

### Composant SortableSection

```typescript
// src/components/page-builder/sortable-section.tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionType } from "@/modules/pages/domain/value-objects/section-type.vo";

interface SortableSectionProps {
  section: {
    id: string;
    type: string;
    content: Record<string, unknown>;
  };
  onEdit: () => void;
  onRemove: () => void;
}

export function SortableSection({ section, onEdit, onRemove }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sectionType = SectionType.all().find((t) => t.value === section.type);

  return (
    <Card ref={setNodeRef} style={style} className="group">
      <CardHeader className="flex flex-row items-center gap-4 py-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="flex-1">
          <CardTitle className="text-base">{sectionType?.label || section.type}</CardTitle>
        </div>

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
```

### Références

- [Source: architecture.md#Page Builder Sections]
- [Source: prd.md#FR23]
- [Source: epics.md#Story 5.3]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
