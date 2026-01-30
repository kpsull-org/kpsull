# Story 1.3: Choix du Type de Compte à l'Inscription

Status: review

## Story

As a nouvel utilisateur,
I want choisir si je suis Client ou Créateur lors de l'inscription,
so that je puisse accéder aux fonctionnalités adaptées à mon profil.

## Acceptance Criteria

1. **AC1 - Page de choix affichée après inscription**
   - **Given** un utilisateur venant de s'inscrire
   - **When** il arrive sur la page de choix de type de compte
   - **Then** il voit deux options claires : "Je veux acheter" (CLIENT) et "Je veux vendre" (CREATOR)

2. **AC2 - Choix CLIENT**
   - **Given** l'utilisateur choisit "Je veux acheter"
   - **When** il valide son choix
   - **Then** son rôle reste CLIENT
   - **And** le flag `accountTypeChosen` est mis à true
   - **And** il est redirigé vers la page d'accueil

3. **AC3 - Choix CREATOR initie l'onboarding**
   - **Given** l'utilisateur choisit "Je veux vendre"
   - **When** il valide son choix
   - **Then** son rôle reste CLIENT (sera CREATOR après onboarding complet)
   - **And** le flag `wantsToBeCreator` est mis à true
   - **And** il est redirigé vers l'onboarding créateur (Epic 2)

4. **AC4 - Protection de la route**
   - **Given** un utilisateur ayant déjà choisi son type de compte
   - **When** il tente d'accéder à la page de choix
   - **Then** il est redirigé vers son dashboard

## Tasks / Subtasks

- [x] **Task 1: Créer la page de choix de compte** (AC: #1)
  - [x] 1.1 Créer `src/app/(auth)/account-type/page.tsx`
  - [x] 1.2 Implémenter l'UI avec deux cartes cliquables (CLIENT / CREATOR)
  - [x] 1.3 Utiliser les composants shadcn/ui (Card, Button)
  - [x] 1.4 Ajouter les icônes et descriptions pour chaque option

- [x] **Task 2: Implémenter le use case SetAccountType** (AC: #2, #3)
  - [x] 2.1 Créer `src/modules/auth/application/use-cases/set-account-type.use-case.ts`
  - [x] 2.2 Implémenter la logique de mise à jour du flag
  - [x] 2.3 Mettre à jour le DTO UserDTO pour inclure les nouveaux champs

- [x] **Task 3: Créer la Server Action** (AC: #2, #3)
  - [x] 3.1 Créer `src/app/(auth)/account-type/actions.ts`
  - [x] 3.2 Implémenter setAccountType pour sauvegarder le choix
  - [x] 3.3 Valider la session et rediriger selon le choix

- [x] **Task 4: Implémenter la protection de route** (AC: #4)
  - [x] 4.1 Mettre à jour Auth.js config avec callback authorized
  - [x] 4.2 Rediriger si déjà choisi
  - [x] 4.3 Rediriger les non-authentifiés vers login

- [x] **Task 5: Écrire les tests** (AC: #1-4)
  - [x] 5.1 Tests unitaires pour le use case SetAccountType (5 tests)
  - [x] 5.2 Tests unitaires pour User.setAccountType (4 tests)
  - [ ] 5.3 Tests d'intégration pour la page (post-MVP)

## Dev Notes

### Architecture Implémentée

```
prisma/schema.prisma
└── User model updated with:
    ├── accountTypeChosen Boolean @default(false)
    └── wantsToBeCreator Boolean @default(false)

src/modules/auth/
├── domain/
│   └── entities/
│       └── user.entity.ts          # Added setAccountType method
├── application/
│   ├── dtos/
│   │   └── user.dto.ts             # Added accountTypeChosen, wantsToBeCreator
│   └── use-cases/
│       └── set-account-type.use-case.ts  # NEW
└── infrastructure/
    └── mappers/
        └── user.mapper.ts          # Updated for new fields

src/lib/auth/
├── config.ts                       # Updated callbacks with account type
└── types.d.ts                      # Extended Session/User/JWT types

src/app/(auth)/account-type/
├── page.tsx                        # Page with server-side auth check
├── account-type-card.tsx           # Client component with cards
└── actions.ts                      # Server action
```

### Tests Implémentés

- **130 tests unitaires passants** couvrant:
  - User Entity setAccountType (4 tests)
  - SetAccountType Use Case (5 tests)
  - Tous les tests existants mis à jour

### Références

- [Source: architecture.md#Server Actions]
- [Source: prd.md#FR2]
- [Source: epics.md#Story 1.3]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - Implémentation réussie

### Completion Notes List

1. ✅ Mis à jour le schéma Prisma avec accountTypeChosen et wantsToBeCreator
2. ✅ Mis à jour User entity avec getters et méthode setAccountType
3. ✅ Créé SetAccountTypeUseCase avec 5 tests TDD
4. ✅ Mis à jour UserDTO et tous les mappers
5. ✅ Créé Server Action pour le choix de type de compte
6. ✅ Créé page /account-type avec UI à deux cartes
7. ✅ Mis à jour Auth.js config pour la protection de route
8. ✅ 130 tests passants, TypeScript et ESLint OK

### File List

**Nouveaux fichiers créés:**
- `src/modules/auth/application/use-cases/set-account-type.use-case.ts`
- `src/modules/auth/application/use-cases/__tests__/set-account-type.use-case.test.ts`
- `src/app/(auth)/account-type/page.tsx`
- `src/app/(auth)/account-type/account-type-card.tsx`
- `src/app/(auth)/account-type/actions.ts`

**Fichiers modifiés:**
- `prisma/schema.prisma` - Ajout accountTypeChosen, wantsToBeCreator
- `src/modules/auth/domain/entities/user.entity.ts` - Ajout setAccountType
- `src/modules/auth/domain/entities/__tests__/user.entity.test.ts` - 7 nouveaux tests
- `src/modules/auth/application/dtos/user.dto.ts` - Ajout des champs
- `src/modules/auth/application/use-cases/create-user.use-case.ts` - Mise à jour toDTO
- `src/modules/auth/application/use-cases/get-user-by-email.use-case.ts` - Mise à jour toDTO
- `src/modules/auth/application/use-cases/index.ts` - Export SetAccountTypeUseCase
- `src/modules/auth/infrastructure/mappers/user.mapper.ts` - Mise à jour tous les mappers
- `src/lib/auth/config.ts` - Callbacks JWT/session/authorized mis à jour
- `src/lib/auth/types.d.ts` - Types étendus

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
| 2026-01-28 | Story implémentée - Page choix compte + Use case + Protection route | Claude Opus 4.5 |
