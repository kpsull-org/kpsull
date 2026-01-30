# Story 1.5: Modification du Profil Utilisateur

Status: review

## Story

As a utilisateur connecté,
I want modifier mes informations de profil,
so that mes données soient à jour sur la plateforme.

## Acceptance Criteria

1. **AC1 - Page de profil accessible**
   - **Given** un utilisateur connecté
   - **When** il accède à la page de profil
   - **Then** il voit ses informations actuelles : nom, email, photo de profil

2. **AC2 - Modification du nom et de la photo**
   - **Given** un utilisateur sur la page de profil
   - **When** il modifie son nom ou sa photo de profil
   - **Then** les modifications sont enregistrées dans la base de données
   - **And** un message de confirmation s'affiche

3. **AC3 - Modification de l'email avec vérification** _(post-MVP)_
   - **Given** un utilisateur qui modifie son email
   - **When** il soumet le formulaire
   - **Then** une vérification est envoyée au nouvel email via Resend
   - **And** l'email n'est changé qu'après validation du lien

4. **AC4 - Validation des données**
   - **Given** des données invalides (nom vide, email invalide)
   - **When** l'utilisateur soumet le formulaire
   - **Then** des messages d'erreur clairs s'affichent
   - **And** les modifications ne sont pas enregistrées

## Tasks / Subtasks

- [x] **Task 1: Créer la page de profil** (AC: #1)
  - [x] 1.1 Créé `src/app/(dashboard)/profile/page.tsx`
  - [x] 1.2 Affichage des informations actuelles
  - [x] 1.3 Utilisation des composants shadcn/ui (Card, Avatar, Input, Label)

- [x] **Task 2: Implémenter le formulaire de modification** (AC: #2)
  - [x] 2.1 Créé composant `ProfileForm`
  - [x] 2.2 Photo de profil via URL (Cloudinary post-MVP)
  - [x] 2.3 Créé Server Action `updateProfile`
  - [x] 2.4 Message de confirmation affiché

- [x] **Task 3: Implémenter le use case UpdateProfile** (AC: #2)
  - [x] 3.1 Créé `UpdateProfileUseCase` avec 6 tests TDD
  - [x] 3.2 Validation avec zod
  - [x] 3.3 Mis à jour le module auth avec le nouveau use case

- [ ] **Task 4: Implémenter la vérification d'email** (AC: #3) _(post-MVP)_
  - Resend integration reportée

- [x] **Task 5: Validation** (AC: #4)
  - [x] 5.1 Validation zod côté serveur
  - [x] 5.2 Messages d'erreur affichés
  - [x] 5.3 136 tests passants

## Dev Notes

### Architecture Implémentée

```
src/modules/auth/application/use-cases/
└── update-profile.use-case.ts      # NEW - 6 tests

src/app/(dashboard)/profile/
├── page.tsx                        # Page principale
├── profile-form.tsx                # Formulaire client
└── actions.ts                      # Server action avec zod

src/components/ui/
├── label.tsx                       # NEW - composant shadcn
└── avatar.tsx                      # NEW - composant shadcn
```

### Dépendances Ajoutées

- `zod` - Validation des données
- `@radix-ui/react-label` - Composant Label
- `@radix-ui/react-avatar` - Composant Avatar

### Fonctionnalités Implémentées

- Page `/profile` accessible aux utilisateurs connectés
- Formulaire de modification du nom et de la photo de profil
- Validation côté serveur avec zod
- Messages de succès/erreur
- Email affiché en lecture seule (modification post-MVP)

### Références

- [Source: architecture.md#Server Actions]
- [Source: prd.md#FR7]
- [Source: epics.md#Story 1.5]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - Implémentation réussie

### Completion Notes List

1. ✅ Créé UpdateProfileUseCase avec 6 tests TDD
2. ✅ Créé page /profile avec formulaire
3. ✅ Créé composants Avatar et Label (shadcn/ui)
4. ✅ Installé zod et dépendances radix
5. ✅ Server action avec validation zod
6. ✅ 136 tests passants, TypeScript et ESLint OK
7. ⚠️ Modification email via Resend reportée (post-MVP)
8. ⚠️ Upload Cloudinary reporté (post-MVP)

### File List

**Nouveaux fichiers créés:**
- `src/modules/auth/application/use-cases/update-profile.use-case.ts`
- `src/modules/auth/application/use-cases/__tests__/update-profile.use-case.test.ts`
- `src/app/(dashboard)/profile/page.tsx`
- `src/app/(dashboard)/profile/profile-form.tsx`
- `src/app/(dashboard)/profile/actions.ts`
- `src/components/ui/label.tsx`
- `src/components/ui/avatar.tsx`

**Fichiers modifiés:**
- `src/modules/auth/application/use-cases/index.ts` - Export UpdateProfileUseCase
- `package.json` - Ajout zod, @radix-ui/react-label, @radix-ui/react-avatar

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
| 2026-01-28 | Story implémentée - Page profil + UpdateProfile use case + 6 tests | Claude Opus 4.5 |
