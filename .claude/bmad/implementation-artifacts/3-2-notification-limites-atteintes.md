# Story 3.2: Notification des Limites Atteintes

Status: ready-for-dev

## Story

As a Créateur FREE,
I want être notifié quand j'atteins mes limites,
so that je puisse décider de passer au plan PRO.

## Acceptance Criteria

1. **AC1 - Notification à l'approche de la limite produits**
   - **Given** un Créateur FREE avec 4 produits publiés
   - **When** il publie un 5ème produit
   - **Then** une notification s'affiche "Vous avez atteint votre limite de produits"
   - **And** un CTA "Passer à PRO" est affiché

2. **AC2 - Blocage à la limite produits**
   - **Given** un Créateur FREE avec 5 produits publiés
   - **When** il tente de publier un nouveau produit
   - **Then** l'action est bloquée avec message "Limite atteinte, passez à PRO"
   - **And** le bouton publier est désactivé

3. **AC3 - Notification email proche limite ventes**
   - **Given** un Créateur FREE avec 9 ventes
   - **When** une 10ème commande est passée
   - **Then** une notification email est envoyée "Vous approchez de votre limite de ventes"

4. **AC4 - Blocage des nouvelles commandes à la limite**
   - **Given** un Créateur FREE avec 10 ventes (limite atteinte)
   - **When** un client tente de passer commande
   - **Then** la commande est bloquée côté créateur
   - **And** un message indique "Ce créateur a atteint sa limite de ventes"

## Tasks / Subtasks

- [ ] **Task 1: Créer le service de vérification des limites** (AC: #1, #2, #3, #4)
  - [ ] 1.1 Créer `src/modules/subscriptions/application/use-cases/check-limit.use-case.ts`
  - [ ] 1.2 Implémenter `checkProductLimit(creatorId)`
  - [ ] 1.3 Implémenter `checkSalesLimit(creatorId)`
  - [ ] 1.4 Retourner le statut : OK, WARNING, BLOCKED

- [ ] **Task 2: Intégrer la vérification lors de la publication** (AC: #1, #2)
  - [ ] 2.1 Modifier le use case de publication produit
  - [ ] 2.2 Vérifier la limite avant publication
  - [ ] 2.3 Bloquer ou notifier selon le résultat

- [ ] **Task 3: Créer les composants de notification UI** (AC: #1, #2)
  - [ ] 3.1 Créer `LimitWarningBanner` component
  - [ ] 3.2 Créer `LimitReachedModal` component
  - [ ] 3.3 Intégrer dans les pages produits

- [ ] **Task 4: Implémenter les notifications email** (AC: #3)
  - [ ] 4.1 Créer le template email "limite ventes approchée"
  - [ ] 4.2 Déclencher l'envoi lors de la 9ème vente
  - [ ] 4.3 Ne pas renvoyer si déjà notifié

- [ ] **Task 5: Bloquer les commandes si limite atteinte** (AC: #4)
  - [ ] 5.1 Vérifier la limite créateur lors du checkout
  - [ ] 5.2 Afficher un message approprié au client
  - [ ] 5.3 Notifier le créateur de la tentative bloquée

- [ ] **Task 6: Écrire les tests** (AC: #1-4)
  - [ ] 6.1 Tests unitaires pour CheckLimitUseCase
  - [ ] 6.2 Tests d'intégration pour le blocage publication
  - [ ] 6.3 Tests pour les notifications email

## Dev Notes

### Use Case CheckLimit

```typescript
// src/modules/subscriptions/application/use-cases/check-limit.use-case.ts
export enum LimitStatus {
  OK = "OK",           // Sous la limite
  WARNING = "WARNING", // Limite atteinte (dernier élément)
  BLOCKED = "BLOCKED", // Limite dépassée
}

interface CheckLimitResult {
  status: LimitStatus;
  current: number;
  limit: number;
  message?: string;
}

export class CheckLimitUseCase {
  async checkProductLimit(creatorId: string): Promise<Result<CheckLimitResult>> {
    const subscription = await this.subscriptionRepo.findByCreatorId(creatorId);

    if (!subscription) {
      return Result.fail("Subscription non trouvée");
    }

    const { productLimit, currentProductCount } = subscription;

    // PRO = unlimited
    if (productLimit === -1) {
      return Result.ok({ status: LimitStatus.OK, current: currentProductCount, limit: -1 });
    }

    if (currentProductCount >= productLimit) {
      return Result.ok({
        status: LimitStatus.BLOCKED,
        current: currentProductCount,
        limit: productLimit,
        message: `Vous avez atteint la limite de ${productLimit} produits. Passez à PRO pour publier plus de produits.`,
      });
    }

    if (currentProductCount === productLimit - 1) {
      return Result.ok({
        status: LimitStatus.WARNING,
        current: currentProductCount,
        limit: productLimit,
        message: `Vous n'avez plus qu'un emplacement produit disponible.`,
      });
    }

    return Result.ok({ status: LimitStatus.OK, current: currentProductCount, limit: productLimit });
  }

  async checkSalesLimit(creatorId: string): Promise<Result<CheckLimitResult>> {
    const subscription = await this.subscriptionRepo.findByCreatorId(creatorId);

    if (!subscription) {
      return Result.fail("Subscription non trouvée");
    }

    const { salesLimit, currentSalesCount } = subscription;

    // PRO = unlimited
    if (salesLimit === -1) {
      return Result.ok({ status: LimitStatus.OK, current: currentSalesCount, limit: -1 });
    }

    if (currentSalesCount >= salesLimit) {
      return Result.ok({
        status: LimitStatus.BLOCKED,
        current: currentSalesCount,
        limit: salesLimit,
        message: `Ce créateur a atteint sa limite de ventes.`,
      });
    }

    return Result.ok({ status: LimitStatus.OK, current: currentSalesCount, limit: salesLimit });
  }
}
```

### Composant LimitWarningBanner

```typescript
// src/components/subscription/limit-warning-banner.tsx
"use client";

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface LimitWarningBannerProps {
  type: "products" | "sales";
  current: number;
  limit: number;
  isBlocked: boolean;
}

export function LimitWarningBanner({ type, current, limit, isBlocked }: LimitWarningBannerProps) {
  const title = isBlocked
    ? `Limite de ${type === "products" ? "produits" : "ventes"} atteinte`
    : `Vous approchez de la limite`;

  const description = isBlocked
    ? `Vous avez atteint ${limit} ${type === "products" ? "produits" : "ventes"}. Passez à PRO pour continuer.`
    : `${current}/${limit} ${type === "products" ? "produits" : "ventes"} utilisés.`;

  return (
    <Alert variant={isBlocked ? "destructive" : "warning"}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{description}</span>
        <Button asChild size="sm">
          <Link href="/subscription/upgrade">Passer à PRO</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

### Template Email Limite Ventes

```typescript
// src/lib/resend/templates/sales-limit-warning.tsx
export function SalesLimitWarningEmail({ name, current, limit }: Props) {
  return (
    <Html>
      <Body>
        <Container>
          <Text style={heading}>Attention : limite de ventes bientôt atteinte</Text>
          <Text>
            Bonjour {name}, vous avez réalisé {current} ventes sur {limit} autorisées
            avec votre plan FREE.
          </Text>
          <Text>
            Passez à PRO pour vendre sans limite et débloquer toutes les fonctionnalités.
          </Text>
          <Button href={`${process.env.NEXTAUTH_URL}/subscription/upgrade`}>
            Découvrir PRO
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
```

### Références

- [Source: architecture.md#Subscription Limits]
- [Source: prd.md#FR11, FR20, FR40]
- [Source: epics.md#Story 3.2]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
