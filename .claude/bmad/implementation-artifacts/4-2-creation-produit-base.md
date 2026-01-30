# Story 4.2: Création de Produit avec Informations de Base

Status: ready-for-dev

## Story

As a Créateur,
I want créer un produit avec ses informations de base,
so that je puisse commencer à constituer mon catalogue.

## Acceptance Criteria

1. **AC1 - Formulaire de création**
   - **Given** un Créateur sur la page de création de produit
   - **When** il consulte le formulaire
   - **Then** il voit les champs : nom, description, prix, projet (optionnel)

2. **AC2 - Validation des champs**
   - **Given** un Créateur qui remplit le formulaire
   - **When** il saisit les données
   - **Then** les champs sont validés (nom requis, prix > 0)

3. **AC3 - Produit créé en DRAFT**
   - **Given** un formulaire valide
   - **When** le Créateur valide
   - **Then** le produit est créé en statut DRAFT
   - **And** currentProductCount de la Subscription n'est pas incrémenté

4. **AC4 - Erreur sur prix invalide**
   - **Given** un prix invalide (négatif, non numérique)
   - **When** le Créateur tente de valider
   - **Then** un message d'erreur clair s'affiche

## Tasks / Subtasks

- [ ] **Task 1: Créer la page de création produit** (AC: #1)
  - [ ] 1.1 Créer `src/app/(dashboard)/products/new/page.tsx`
  - [ ] 1.2 Implémenter le formulaire avec shadcn/ui
  - [ ] 1.3 Ajouter le sélecteur de projet (dropdown)

- [ ] **Task 2: Créer l'entity Product** (AC: #2, #3)
  - [ ] 2.1 Créer `src/modules/products/domain/entities/product.entity.ts`
  - [ ] 2.2 Créer `Money` value object pour le prix
  - [ ] 2.3 Créer `ProductStatus` value object

- [ ] **Task 3: Implémenter le use case CreateProduct** (AC: #2, #3, #4)
  - [ ] 3.1 Créer `src/modules/products/application/use-cases/products/create-product.use-case.ts`
  - [ ] 3.2 Valider les données métier
  - [ ] 3.3 Créer le produit en DRAFT

- [ ] **Task 4: Implémenter la validation** (AC: #2, #4)
  - [ ] 4.1 Créer le schéma zod pour le formulaire
  - [ ] 4.2 Valider côté client et serveur
  - [ ] 4.3 Afficher les messages d'erreur

- [ ] **Task 5: Créer le Server Action** (AC: #3)
  - [ ] 5.1 Créer `src/app/(dashboard)/products/new/actions.ts`
  - [ ] 5.2 Appeler le use case
  - [ ] 5.3 Rediriger vers la page d'édition

- [ ] **Task 6: Écrire les tests** (AC: #1-4)
  - [ ] 6.1 Tests unitaires pour Product entity
  - [ ] 6.2 Tests unitaires pour Money value object
  - [ ] 6.3 Tests unitaires pour le use case

## Dev Notes

### Entity Product

```typescript
// src/modules/products/domain/entities/product.entity.ts
import { Entity, UniqueId, Result } from "@/shared/domain";
import { Money } from "../value-objects/money.vo";
import { ProductStatus } from "../value-objects/product-status.vo";

interface ProductProps {
  creatorId: string;
  projectId?: string;
  name: string;
  description?: string;
  price: Money;
  status: ProductStatus;
  publishedAt?: Date;
}

export class Product extends Entity<ProductProps> {
  private constructor(props: ProductProps, id?: UniqueId) {
    super(props, id);
  }

  get creatorId(): string { return this.props.creatorId; }
  get projectId(): string | undefined { return this.props.projectId; }
  get name(): string { return this.props.name; }
  get description(): string | undefined { return this.props.description; }
  get price(): Money { return this.props.price; }
  get status(): ProductStatus { return this.props.status; }
  get publishedAt(): Date | undefined { return this.props.publishedAt; }

  get isDraft(): boolean { return this.status.value === "DRAFT"; }
  get isPublished(): boolean { return this.status.value === "PUBLISHED"; }

  static create(props: Omit<ProductProps, "status" | "publishedAt">, id?: UniqueId): Result<Product> {
    if (!props.name.trim()) {
      return Result.fail("Le nom du produit est requis");
    }

    if (props.name.length > 200) {
      return Result.fail("Le nom ne peut pas dépasser 200 caractères");
    }

    return Result.ok(new Product({
      ...props,
      status: ProductStatus.draft(),
      publishedAt: undefined,
    }, id));
  }

  publish(): Result<void> {
    if (this.isPublished) {
      return Result.fail("Le produit est déjà publié");
    }
    this.props.status = ProductStatus.published();
    this.props.publishedAt = new Date();
    return Result.ok();
  }

  unpublish(): Result<void> {
    if (this.isDraft) {
      return Result.fail("Le produit est déjà en brouillon");
    }
    this.props.status = ProductStatus.draft();
    return Result.ok();
  }
}
```

### Value Object Money

```typescript
// src/modules/products/domain/value-objects/money.vo.ts
import { ValueObject, Result } from "@/shared/domain";

interface MoneyProps {
  amount: number;      // En centimes
  currency: string;
}

export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  get amount(): number { return this.props.amount; }
  get currency(): string { return this.props.currency; }

  get displayAmount(): number {
    return this.amount / 100;
  }

  get formatted(): string {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: this.currency,
    }).format(this.displayAmount);
  }

  static create(amount: number, currency: string = "EUR"): Result<Money> {
    if (isNaN(amount)) {
      return Result.fail("Le montant doit être un nombre");
    }

    if (amount < 0) {
      return Result.fail("Le prix ne peut pas être négatif");
    }

    if (amount === 0) {
      return Result.fail("Le prix doit être supérieur à 0");
    }

    // Stocker en centimes pour éviter les problèmes de float
    const amountInCents = Math.round(amount * 100);

    return Result.ok(new Money({ amount: amountInCents, currency }));
  }

  static fromCents(cents: number, currency: string = "EUR"): Money {
    return new Money({ amount: cents, currency });
  }

  add(other: Money): Result<Money> {
    if (this.currency !== other.currency) {
      return Result.fail("Les devises doivent être identiques");
    }
    return Result.ok(new Money({
      amount: this.amount + other.amount,
      currency: this.currency,
    }));
  }
}
```

### Value Object ProductStatus

```typescript
// src/modules/products/domain/value-objects/product-status.vo.ts
import { ValueObject } from "@/shared/domain";

type ProductStatusValue = "DRAFT" | "PUBLISHED" | "ARCHIVED";

interface ProductStatusProps {
  value: ProductStatusValue;
}

export class ProductStatus extends ValueObject<ProductStatusProps> {
  private constructor(props: ProductStatusProps) {
    super(props);
  }

  get value(): ProductStatusValue { return this.props.value; }

  static draft(): ProductStatus {
    return new ProductStatus({ value: "DRAFT" });
  }

  static published(): ProductStatus {
    return new ProductStatus({ value: "PUBLISHED" });
  }

  static archived(): ProductStatus {
    return new ProductStatus({ value: "ARCHIVED" });
  }
}
```

### Schéma Zod pour validation

```typescript
// src/modules/products/application/dtos/create-product.schema.ts
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string()
    .min(1, "Le nom est requis")
    .max(200, "Le nom ne peut pas dépasser 200 caractères"),
  description: z.string().optional(),
  price: z.number()
    .positive("Le prix doit être supérieur à 0")
    .multipleOf(0.01, "Le prix doit avoir au maximum 2 décimales"),
  projectId: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
```

### Références

- [Source: architecture.md#Product Entity]
- [Source: prd.md#FR16, FR18]
- [Source: epics.md#Story 4.2]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
