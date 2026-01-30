# Story 2.1: Initiation de l'Upgrade Client vers Créateur

Status: review

## Story

As a Client,
I want initier le processus pour devenir Créateur,
so that je puisse commencer à vendre mes créations sur la plateforme.

## Acceptance Criteria

1. **AC1 - Bouton "Devenir Créateur" visible pour les Clients**
   - **Given** un utilisateur avec le rôle CLIENT sur sa page de profil
   - **When** il consulte la page
   - **Then** un bouton "Devenir Créateur" est visible et accessible

2. **AC2 - Redirection vers le formulaire d'onboarding**
   - **Given** un Client qui clique sur "Devenir Créateur"
   - **When** il est redirigé
   - **Then** il arrive sur le formulaire d'onboarding créateur
   - **And** le formulaire affiche les étapes : Informations Pro → Vérification SIRET → Stripe Connect

3. **AC3 - Stepper de progression visible**
   - **Given** un Client sur le formulaire d'onboarding
   - **When** il consulte la page
   - **Then** un stepper indique les 3 étapes et l'étape actuelle

4. **AC4 - Option masquée pour CREATOR/ADMIN**
   - **Given** un utilisateur déjà CREATOR ou ADMIN
   - **When** il accède à la page de profil
   - **Then** l'option "Devenir Créateur" n'est pas affichée

## Tasks / Subtasks

- [x] **Task 1: Ajouter le bouton sur la page profil** (AC: #1, #4)
  - [x] 1.1 Modifier `src/app/(dashboard)/profile/page.tsx`
  - [x] 1.2 Conditionner l'affichage du bouton selon le rôle
  - [x] 1.3 Styliser avec shadcn/ui (Button, Card)

- [x] **Task 2: Créer les pages d'onboarding** (AC: #2, #3)
  - [x] 2.1 Créer `src/app/(auth)/onboarding/creator/layout.tsx` avec le stepper
  - [x] 2.2 Créer `src/app/(auth)/onboarding/creator/page.tsx` (redirect vers step 1)
  - [x] 2.3 Créer `src/app/(auth)/onboarding/creator/step/[step]/page.tsx`
  - [x] 2.4 Implémenter le composant Stepper

- [x] **Task 3: Créer le module Creators** (AC: #2)
  - [x] 3.1 Créer la structure hexagonale pour `src/modules/creators/`
  - [x] 3.2 Créer `CreatorOnboarding` entity pour tracker la progression
  - [x] 3.3 Créer les value objects nécessaires (OnboardingStep)

- [x] **Task 4: Implémenter le use case InitiateCreatorUpgrade** (AC: #2)
  - [x] 4.1 Créer `src/modules/creators/application/use-cases/initiate-creator-upgrade.use-case.ts`
  - [x] 4.2 Créer un enregistrement de progression onboarding
  - [x] 4.3 Retourner l'étape initiale

- [x] **Task 5: Écrire les tests** (AC: #1-4)
  - [x] 5.1 Tests unitaires pour OnboardingStep VO (14 tests)
  - [x] 5.2 Tests unitaires pour CreatorOnboarding entity (21 tests)
  - [x] 5.3 Tests unitaires pour InitiateCreatorUpgrade use case (6 tests)
  - [ ] 5.4 Tests d'intégration pour les pages (post-MVP)

## Dev Notes

### Composant Stepper

```typescript
// src/components/onboarding/stepper.tsx
interface Step {
  id: number;
  title: string;
  description: string;
}

const steps: Step[] = [
  { id: 1, title: "Informations", description: "Informations professionnelles" },
  { id: 2, title: "SIRET", description: "Vérification SIRET" },
  { id: 3, title: "Paiements", description: "Configuration Stripe" },
];

export function OnboardingStepper({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center">
        {steps.map((step, index) => (
          <li key={step.id} className={cn(
            "relative",
            index !== steps.length - 1 && "pr-8 sm:pr-20"
          )}>
            {/* Step circle and connector */}
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

### Structure Module Creators

```
src/modules/creators/
├── domain/
│   ├── entities/
│   │   ├── creator.entity.ts
│   │   └── creator-onboarding.entity.ts
│   ├── value-objects/
│   │   ├── siret.vo.ts
│   │   ├── brand-name.vo.ts
│   │   └── professional-address.vo.ts
│   ├── events/
│   │   ├── creator-onboarding-started.event.ts
│   │   └── creator-activated.event.ts
│   └── errors/
│       └── creator.errors.ts
├── application/
│   ├── ports/
│   │   ├── creator.repository.interface.ts
│   │   └── siret-verification.service.interface.ts
│   ├── use-cases/
│   │   ├── initiate-creator-upgrade.use-case.ts
│   │   ├── submit-professional-info.use-case.ts
│   │   ├── verify-siret.use-case.ts
│   │   └── complete-stripe-onboarding.use-case.ts
│   └── dtos/
│       └── creator.dto.ts
└── infrastructure/
    ├── repositories/
    │   └── prisma-creator.repository.ts
    └── services/
        ├── insee-siret.service.ts
        └── stripe-connect.service.ts
```

### Schéma de progression Onboarding

```typescript
// Types pour la progression
enum OnboardingStep {
  PROFESSIONAL_INFO = 1,
  SIRET_VERIFICATION = 2,
  STRIPE_CONNECT = 3,
  COMPLETED = 4,
}

interface CreatorOnboarding {
  userId: string;
  currentStep: OnboardingStep;
  professionalInfoCompleted: boolean;
  siretVerified: boolean;
  stripeOnboarded: boolean;
  startedAt: Date;
  completedAt?: Date;
}
```

### Références

- [Source: architecture.md#Hexagonal Architecture]
- [Source: prd.md#FR4]
- [Source: epics.md#Story 2.1]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - Implémentation réussie

### Completion Notes List

1. ✅ Créé le module Creators avec architecture hexagonale complète
2. ✅ Créé OnboardingStep value object avec tests TDD (14 tests)
3. ✅ Créé CreatorOnboarding entity avec tests TDD (21 tests)
4. ✅ Créé InitiateCreatorUpgradeUseCase avec tests TDD (6 tests)
5. ✅ Mis à jour le schéma Prisma avec CreatorOnboarding model
6. ✅ Créé le composant OnboardingStepper
7. ✅ Créé les pages d'onboarding avec 3 étapes
8. ✅ Créé le composant BecomeCreatorCard sur la page profil
9. ✅ 177 tests passants, TypeScript et ESLint OK

### File List

**Nouveaux fichiers créés:**

Module Creators - Domain:
- `src/modules/creators/domain/value-objects/onboarding-step.vo.ts`
- `src/modules/creators/domain/value-objects/__tests__/onboarding-step.vo.test.ts`
- `src/modules/creators/domain/entities/creator-onboarding.entity.ts`
- `src/modules/creators/domain/entities/__tests__/creator-onboarding.entity.test.ts`
- `src/modules/creators/domain/events/creator-onboarding-started.event.ts`

Module Creators - Application:
- `src/modules/creators/application/ports/creator-onboarding.repository.interface.ts`
- `src/modules/creators/application/dtos/creator-onboarding.dto.ts`
- `src/modules/creators/application/use-cases/initiate-creator-upgrade.use-case.ts`
- `src/modules/creators/application/use-cases/__tests__/initiate-creator-upgrade.use-case.test.ts`

Module Creators - Infrastructure:
- `src/modules/creators/infrastructure/mappers/creator-onboarding.mapper.ts`
- `src/modules/creators/infrastructure/repositories/prisma-creator-onboarding.repository.ts`

UI Components:
- `src/components/onboarding/stepper.tsx`
- `src/app/(dashboard)/profile/become-creator-card.tsx`

Onboarding Pages:
- `src/app/(auth)/onboarding/creator/layout.tsx`
- `src/app/(auth)/onboarding/creator/page.tsx`
- `src/app/(auth)/onboarding/creator/step/[step]/page.tsx`
- `src/app/(auth)/onboarding/creator/step/[step]/professional-info-form.tsx`
- `src/app/(auth)/onboarding/creator/step/[step]/siret-verification-form.tsx`
- `src/app/(auth)/onboarding/creator/step/[step]/stripe-connect-form.tsx`
- `src/app/(auth)/onboarding/creator/step/[step]/actions.ts`

Index files et exports.

**Fichiers modifiés:**

- `prisma/schema.prisma` - Ajout OnboardingStep enum et CreatorOnboarding model
- `src/app/(dashboard)/profile/page.tsx` - Ajout BecomeCreatorCard conditionnel

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
| 2026-01-28 | Story implémentée - Module Creators + Onboarding flow + Bouton profil | Claude Opus 4.5 |
