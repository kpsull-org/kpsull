# Story 2.2: Saisie des Informations Professionnelles

Status: review

## Story

As a Client en cours d'upgrade,
I want saisir mes informations professionnelles,
so that la plateforme puisse vérifier mon activité.

## Acceptance Criteria

1. **AC1 - Formulaire d'informations professionnelles**
   - **Given** un Client sur le formulaire d'onboarding (étape 1)
   - **When** il consulte la page
   - **Then** il voit les champs : nom de marque, numéro SIRET, adresse professionnelle

2. **AC2 - Validation en temps réel du SIRET**
   - **Given** un Client qui saisit son SIRET
   - **When** il tape le numéro
   - **Then** le format est validé en temps réel (14 chiffres)
   - **And** un message indique si le format est valide ou non

3. **AC3 - Validation de l'adresse**
   - **Given** un Client qui saisit son adresse
   - **When** il remplit les champs (rue, code postal, ville)
   - **Then** les champs sont validés (code postal 5 chiffres, ville non vide)

4. **AC4 - Passage à l'étape suivante**
   - **Given** un formulaire valide
   - **When** le Client clique sur "Continuer"
   - **Then** les informations sont sauvegardées
   - **And** il passe à l'étape de vérification SIRET

5. **AC5 - Erreur si SIRET invalide**
   - **Given** un SIRET au format invalide
   - **When** l'utilisateur tente de continuer
   - **Then** un message d'erreur indique le format attendu
   - **And** l'utilisateur ne peut pas passer à l'étape suivante

## Tasks / Subtasks

- [x] **Task 1: Créer les Value Objects** (AC: #2, #3, #5)
  - [x] 1.1 Créer `siret.vo.ts` avec validation Luhn (13 tests)
  - [x] 1.2 Créer `professional-address.vo.ts` avec validation code postal (15 tests)
  - [x] 1.3 Exporter depuis le module Creators

- [x] **Task 2: Créer le use case SubmitProfessionalInfo** (AC: #4)
  - [x] 2.1 Créer le use case avec validation via VOs (15 tests)
  - [x] 2.2 Valider et sauvegarder les informations
  - [x] 2.3 Mettre à jour la progression onboarding

- [x] **Task 3: Améliorer le formulaire** (AC: #1, #2, #3)
  - [x] 3.1 Restructurer avec champs d'adresse individuels (rue, code postal, ville)
  - [x] 3.2 Ajouter validation temps réel du SIRET avec indicateur visuel
  - [x] 3.3 Ajouter validation temps réel du code postal

- [x] **Task 4: Mettre à jour la Server Action** (AC: #4, #5)
  - [x] 4.1 Utiliser le use case SubmitProfessionalInfo
  - [x] 4.2 Gérer les erreurs de validation
  - [x] 4.3 Parser l'adresse stockée pour repopuler le formulaire

## Dev Notes

### Value Object SIRET

Implémenté dans `src/modules/creators/domain/value-objects/siret.vo.ts`:
- Validation format (14 chiffres)
- Algorithme de Luhn pour vérification checksum
- Normalisation (suppression espaces)
- Extraction SIREN et NIC
- Formatage avec espaces

### Value Object Adresse

Implémenté dans `src/modules/creators/domain/value-objects/professional-address.vo.ts`:
- Validation champs requis (rue, ville, code postal)
- Code postal français (5 chiffres)
- Longueurs maximales
- Formatage complet

### Validation Temps Réel

Le formulaire `professional-info-form.tsx` inclut:
- Validation SIRET avec indicateur checkmark/erreur
- Compteur de caractères SIRET (X/14)
- Validation code postal avec indicateur visuel
- Désactivation du bouton tant que le formulaire est invalide

### Références

- [Source: architecture.md#Value Objects]
- [Source: prd.md#FR5]
- [Source: epics.md#Story 2.2]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

1. ✅ Créé Siret value object avec validation Luhn (13 tests)
2. ✅ Créé ProfessionalAddress value object (15 tests)
3. ✅ Créé SubmitProfessionalInfoUseCase (15 tests)
4. ✅ Mis à jour le formulaire avec champs structurés et validation temps réel
5. ✅ Mis à jour la Server Action pour utiliser le use case
6. ✅ 220 tests passants, TypeScript et ESLint OK

### File List

**Nouveaux fichiers créés:**

Module Creators - Domain:
- `src/modules/creators/domain/value-objects/siret.vo.ts`
- `src/modules/creators/domain/value-objects/__tests__/siret.vo.test.ts`
- `src/modules/creators/domain/value-objects/professional-address.vo.ts`
- `src/modules/creators/domain/value-objects/__tests__/professional-address.vo.test.ts`

Module Creators - Application:
- `src/modules/creators/application/use-cases/submit-professional-info.use-case.ts`
- `src/modules/creators/application/use-cases/__tests__/submit-professional-info.use-case.test.ts`

**Fichiers modifiés:**

- `src/modules/creators/domain/value-objects/index.ts` - Export des nouveaux VOs
- `src/modules/creators/application/use-cases/index.ts` - Export du nouveau use case
- `src/app/(auth)/onboarding/creator/step/[step]/actions.ts` - Utilisation du use case
- `src/app/(auth)/onboarding/creator/step/[step]/professional-info-form.tsx` - Formulaire amélioré
- `src/app/(auth)/onboarding/creator/step/[step]/page.tsx` - Parse adresse pour repopuler

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
| 2026-01-28 | Story implémentée - VOs + Use Case + Formulaire amélioré | Claude Opus 4.5 |
