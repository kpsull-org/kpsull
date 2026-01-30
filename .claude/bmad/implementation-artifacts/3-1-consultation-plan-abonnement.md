# Story 3.1: Consultation du Plan d'Abonnement

Status: ready-for-dev

## Story

As a Créateur,
I want consulter mon plan d'abonnement actuel,
so that je puisse voir mes limites et fonctionnalités disponibles.

## Acceptance Criteria

1. **AC1 - Page abonnement accessible**
   - **Given** un Créateur connecté
   - **When** il accède à la page abonnement
   - **Then** il voit son plan actuel (FREE/PRO)

2. **AC2 - Affichage des limites et usage**
   - **Given** un Créateur sur la page abonnement
   - **When** il consulte son plan
   - **Then** il voit les limites (produits, ventes) et l'usage actuel
   - **And** une barre de progression indique l'utilisation

3. **AC3 - Affichage des features par plan**
   - **Given** un Créateur sur la page abonnement
   - **When** il consulte les fonctionnalités
   - **Then** il voit les features disponibles (✓) et verrouillées (🔒) selon son plan

4. **AC4 - Détails spécifiques plan FREE**
   - **Given** un Créateur FREE
   - **When** il consulte ses limites
   - **Then** il voit "5 produits max (X utilisés)" et "10 ventes max (Y réalisées)"
   - **And** un CTA "Passer à PRO" est visible

## Tasks / Subtasks

- [ ] **Task 1: Créer la page abonnement** (AC: #1, #2, #3, #4)
  - [ ] 1.1 Créer `src/app/(dashboard)/subscription/page.tsx`
  - [ ] 1.2 Afficher le plan actuel avec badge
  - [ ] 1.3 Créer le composant UsageProgress pour les barres de progression
  - [ ] 1.4 Créer le composant FeaturesList pour les fonctionnalités

- [ ] **Task 2: Créer le module Subscriptions** (AC: #2)
  - [ ] 2.1 Créer la structure hexagonale `src/modules/subscriptions/`
  - [ ] 2.2 Créer `Subscription` entity
  - [ ] 2.3 Créer `Plan` value object (FREE, PRO)
  - [ ] 2.4 Créer le repository interface et implémentation

- [ ] **Task 3: Implémenter le use case GetSubscription** (AC: #1, #2)
  - [ ] 3.1 Créer `src/modules/subscriptions/application/use-cases/get-subscription.use-case.ts`
  - [ ] 3.2 Récupérer la subscription avec usage actuel
  - [ ] 3.3 Créer le DTO de réponse

- [ ] **Task 4: Définir les features par plan** (AC: #3)
  - [ ] 4.1 Créer `src/modules/subscriptions/domain/plan-features.ts`
  - [ ] 4.2 Définir les features FREE vs PRO
  - [ ] 4.3 Créer le helper pour vérifier l'accès

- [ ] **Task 5: Écrire les tests** (AC: #1-4)
  - [ ] 5.1 Tests unitaires pour Subscription entity
  - [ ] 5.2 Tests unitaires pour le use case
  - [ ] 5.3 Tests pour les features par plan

## Dev Notes

### Features par Plan

```typescript
// src/modules/subscriptions/domain/plan-features.ts
export const PLAN_FEATURES = {
  FREE: {
    productLimit: 5,
    salesLimit: 10,
    features: {
      basicDashboard: true,
      productManagement: true,
      orderManagement: true,
      basicAnalytics: true,
      advancedAnalytics: false,
      exportReports: false,
      prioritySupport: false,
      customDomain: false,
    },
  },
  PRO: {
    productLimit: -1, // Unlimited
    salesLimit: -1,   // Unlimited
    features: {
      basicDashboard: true,
      productManagement: true,
      orderManagement: true,
      basicAnalytics: true,
      advancedAnalytics: true,
      exportReports: true,
      prioritySupport: true,
      customDomain: true,
    },
  },
};

export const FEATURE_LABELS: Record<string, string> = {
  basicDashboard: "Dashboard de base",
  productManagement: "Gestion des produits",
  orderManagement: "Gestion des commandes",
  basicAnalytics: "Statistiques de base",
  advancedAnalytics: "Analytics avancés",
  exportReports: "Export des rapports",
  prioritySupport: "Support prioritaire",
  customDomain: "Domaine personnalisé",
};
```

### Composant UsageProgress

```typescript
// src/components/subscription/usage-progress.tsx
interface UsageProgressProps {
  label: string;
  current: number;
  limit: number; // -1 for unlimited
  unit?: string;
}

export function UsageProgress({ label, current, limit, unit = "" }: UsageProgressProps) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && current >= limit;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className={cn(isAtLimit && "text-destructive", isNearLimit && "text-warning")}>
          {current}{unit} / {isUnlimited ? "∞" : `${limit}${unit}`}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={percentage}
          className={cn(
            isAtLimit && "bg-destructive/20",
            isNearLimit && !isAtLimit && "bg-warning/20"
          )}
        />
      )}
    </div>
  );
}
```

### Structure Module Subscriptions

```
src/modules/subscriptions/
├── domain/
│   ├── entities/
│   │   └── subscription.entity.ts
│   ├── value-objects/
│   │   ├── plan.vo.ts
│   │   └── subscription-status.vo.ts
│   ├── plan-features.ts
│   └── errors/
│       └── subscription.errors.ts
├── application/
│   ├── ports/
│   │   └── subscription.repository.interface.ts
│   ├── use-cases/
│   │   ├── get-subscription.use-case.ts
│   │   └── check-limit.use-case.ts
│   └── dtos/
│       └── subscription.dto.ts
└── infrastructure/
    └── repositories/
        └── prisma-subscription.repository.ts
```

### Références

- [Source: architecture.md#Subscription Model]
- [Source: prd.md#FR9]
- [Source: epics.md#Story 3.1]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
