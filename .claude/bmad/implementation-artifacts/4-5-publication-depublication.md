# Story 4.5: Publication et Dépublication de Produit

Status: ready-for-dev

## Story

As a Créateur,
I want publier ou dépublier mes produits,
so that je contrôle ce qui est visible par les clients.

## Acceptance Criteria

1. **AC1 - Publication d'un produit DRAFT**
   - **Given** un produit en statut DRAFT
   - **When** le Créateur clique sur "Publier"
   - **Then** le statut passe à PUBLISHED
   - **And** publishedAt est défini
   - **And** currentProductCount de la Subscription est incrémenté

2. **AC2 - Blocage si limite atteinte (FREE)**
   - **Given** un Créateur FREE avec 5 produits publiés
   - **When** il tente de publier un 6ème produit
   - **Then** l'action est bloquée avec message "Limite atteinte"
   - **And** un CTA "Passer à PRO" est proposé

3. **AC3 - Dépublication d'un produit**
   - **Given** un produit PUBLISHED
   - **When** le Créateur clique sur "Dépublier"
   - **Then** le statut passe à DRAFT
   - **And** currentProductCount est décrémenté
   - **And** le produit n'est plus visible publiquement

## Tasks / Subtasks

- [ ] **Task 1: Implémenter le use case PublishProduct** (AC: #1, #2)
  - [ ] 1.1 Créer `src/modules/products/application/use-cases/products/publish-product.use-case.ts`
  - [ ] 1.2 Vérifier la limite de produits via SubscriptionService
  - [ ] 1.3 Mettre à jour le statut et publishedAt
  - [ ] 1.4 Incrémenter currentProductCount

- [ ] **Task 2: Implémenter le use case UnpublishProduct** (AC: #3)
  - [ ] 2.1 Créer `src/modules/products/application/use-cases/products/unpublish-product.use-case.ts`
  - [ ] 2.2 Mettre à jour le statut
  - [ ] 2.3 Décrémenter currentProductCount

- [ ] **Task 3: Créer les boutons d'action dans l'UI** (AC: #1, #2, #3)
  - [ ] 3.1 Ajouter bouton Publier/Dépublier sur la page produit
  - [ ] 3.2 Afficher le modal de confirmation
  - [ ] 3.3 Gérer l'état de chargement

- [ ] **Task 4: Créer les Server Actions** (AC: #1, #2, #3)
  - [ ] 4.1 Créer `publishProduct` action
  - [ ] 4.2 Créer `unpublishProduct` action
  - [ ] 4.3 Revalider les pages concernées

- [ ] **Task 5: Afficher le message de limite** (AC: #2)
  - [ ] 5.1 Créer le modal `LimitReachedModal`
  - [ ] 5.2 Afficher le CTA vers upgrade

- [ ] **Task 6: Écrire les tests** (AC: #1-3)
  - [ ] 6.1 Tests unitaires pour PublishProductUseCase
  - [ ] 6.2 Tests unitaires pour UnpublishProductUseCase
  - [ ] 6.3 Tests pour la vérification de limite

## Dev Notes

### Use Case PublishProduct

```typescript
// src/modules/products/application/use-cases/products/publish-product.use-case.ts
export class PublishProductUseCase implements IUseCase<PublishProductDTO, void> {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly subscriptionService: ISubscriptionService
  ) {}

  async execute(dto: PublishProductDTO): Promise<Result<void>> {
    // Récupérer le produit
    const product = await this.productRepo.findById(dto.productId);
    if (!product) {
      return Result.fail("Produit non trouvé");
    }

    // Vérifier que le créateur est bien le propriétaire
    if (product.creatorId !== dto.creatorId) {
      return Result.fail("Accès non autorisé");
    }

    // Vérifier si déjà publié
    if (product.isPublished) {
      return Result.fail("Le produit est déjà publié");
    }

    // Vérifier la limite de produits
    const limitCheck = await this.subscriptionService.checkProductLimit(dto.creatorId);
    if (limitCheck.isFailure) {
      return Result.fail(limitCheck.error!);
    }

    if (limitCheck.value.status === "BLOCKED") {
      return Result.fail(limitCheck.value.message!);
    }

    // Publier le produit
    const publishResult = product.publish();
    if (publishResult.isFailure) {
      return Result.fail(publishResult.error!);
    }

    // Persister
    await this.productRepo.save(product);

    // Incrémenter le compteur
    await this.subscriptionService.incrementProductCount(dto.creatorId);

    return Result.ok();
  }
}
```

### Use Case UnpublishProduct

```typescript
// src/modules/products/application/use-cases/products/unpublish-product.use-case.ts
export class UnpublishProductUseCase implements IUseCase<UnpublishProductDTO, void> {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly subscriptionService: ISubscriptionService
  ) {}

  async execute(dto: UnpublishProductDTO): Promise<Result<void>> {
    const product = await this.productRepo.findById(dto.productId);
    if (!product) {
      return Result.fail("Produit non trouvé");
    }

    if (product.creatorId !== dto.creatorId) {
      return Result.fail("Accès non autorisé");
    }

    if (product.isDraft) {
      return Result.fail("Le produit est déjà en brouillon");
    }

    // Dépublier
    const unpublishResult = product.unpublish();
    if (unpublishResult.isFailure) {
      return Result.fail(unpublishResult.error!);
    }

    // Persister
    await this.productRepo.save(product);

    // Décrémenter le compteur
    await this.subscriptionService.decrementProductCount(dto.creatorId);

    return Result.ok();
  }
}
```

### Server Actions

```typescript
// src/app/(dashboard)/products/[id]/actions.ts
"use server";

import { auth } from "@/lib/auth/config";
import { revalidatePath } from "next/cache";

export async function publishProduct(productId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Non authentifié" };
  }

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
  });

  if (!creator) {
    return { error: "Compte créateur non trouvé" };
  }

  const useCase = new PublishProductUseCase(/* inject deps */);
  const result = await useCase.execute({
    productId,
    creatorId: creator.id,
  });

  if (result.isFailure) {
    if (result.error?.includes("Limite atteinte")) {
      return { error: result.error, limitReached: true };
    }
    return { error: result.error };
  }

  revalidatePath(`/products/${productId}`);
  revalidatePath("/products");

  return { success: true };
}

export async function unpublishProduct(productId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Non authentifié" };
  }

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
  });

  if (!creator) {
    return { error: "Compte créateur non trouvé" };
  }

  const useCase = new UnpublishProductUseCase(/* inject deps */);
  const result = await useCase.execute({
    productId,
    creatorId: creator.id,
  });

  if (result.isFailure) {
    return { error: result.error };
  }

  revalidatePath(`/products/${productId}`);
  revalidatePath("/products");

  return { success: true };
}
```

### Composant PublishButton

```typescript
// src/components/products/publish-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LimitReachedModal } from "./limit-reached-modal";
import { publishProduct, unpublishProduct } from "@/app/(dashboard)/products/[id]/actions";

interface PublishButtonProps {
  productId: string;
  isPublished: boolean;
}

export function PublishButton({ productId, isPublished }: PublishButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);

    const result = isPublished
      ? await unpublishProduct(productId)
      : await publishProduct(productId);

    setIsLoading(false);

    if (result.error) {
      if (result.limitReached) {
        setShowLimitModal(true);
      } else {
        toast.error(result.error);
      }
    } else {
      toast.success(isPublished ? "Produit dépublié" : "Produit publié");
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isLoading}
        variant={isPublished ? "outline" : "default"}
      >
        {isLoading ? "..." : isPublished ? "Dépublier" : "Publier"}
      </Button>

      <LimitReachedModal
        open={showLimitModal}
        onClose={() => setShowLimitModal(false)}
      />
    </>
  );
}
```

### Références

- [Source: architecture.md#Product Lifecycle]
- [Source: prd.md#FR19, FR20]
- [Source: epics.md#Story 4.5]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
