# Story 2.2: Saisie des Informations Professionnelles

Status: ready-for-dev

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

- [ ] **Task 1: Créer la page étape 1** (AC: #1)
  - [ ] 1.1 Créer `src/app/(auth)/onboarding/creator/step/1/page.tsx`
  - [ ] 1.2 Implémenter le formulaire avec shadcn/ui (Input, Label, Button)
  - [ ] 1.3 Ajouter les champs : brandName, siret, address (street, postalCode, city)

- [ ] **Task 2: Implémenter la validation SIRET** (AC: #2, #5)
  - [ ] 2.1 Créer `src/modules/creators/domain/value-objects/siret.vo.ts`
  - [ ] 2.2 Implémenter la validation format (14 chiffres, clé de Luhn optionnelle)
  - [ ] 2.3 Créer le hook `useSiretValidation` pour validation temps réel

- [ ] **Task 3: Implémenter la validation d'adresse** (AC: #3)
  - [ ] 3.1 Créer `src/modules/creators/domain/value-objects/professional-address.vo.ts`
  - [ ] 3.2 Valider code postal français (5 chiffres)
  - [ ] 3.3 Valider les champs requis

- [ ] **Task 4: Créer le use case SubmitProfessionalInfo** (AC: #4)
  - [ ] 4.1 Créer `src/modules/creators/application/use-cases/submit-professional-info.use-case.ts`
  - [ ] 4.2 Valider et sauvegarder les informations
  - [ ] 4.3 Mettre à jour la progression onboarding

- [ ] **Task 5: Créer le Server Action** (AC: #4, #5)
  - [ ] 5.1 Créer `src/app/(auth)/onboarding/creator/step/1/actions.ts`
  - [ ] 5.2 Appeler le use case
  - [ ] 5.3 Gérer les erreurs et la redirection

- [ ] **Task 6: Écrire les tests** (AC: #1-5)
  - [ ] 6.1 Tests unitaires pour Siret value object
  - [ ] 6.2 Tests unitaires pour ProfessionalAddress value object
  - [ ] 6.3 Tests unitaires pour le use case
  - [ ] 6.4 Tests d'intégration pour le formulaire

## Dev Notes

### Value Object SIRET

```typescript
// src/modules/creators/domain/value-objects/siret.vo.ts
import { ValueObject, Result } from "@/shared/domain";

interface SiretProps {
  value: string;
}

export class Siret extends ValueObject<SiretProps> {
  private constructor(props: SiretProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  private static isValidFormat(siret: string): boolean {
    // SIRET = 14 digits (SIREN 9 + NIC 5)
    return /^\d{14}$/.test(siret);
  }

  private static isValidLuhn(siret: string): boolean {
    // Algorithme de Luhn pour vérification
    let sum = 0;
    for (let i = 0; i < 14; i++) {
      let digit = parseInt(siret[i], 10);
      if (i % 2 === 0) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    return sum % 10 === 0;
  }

  static create(siret: string): Result<Siret> {
    const cleaned = siret.replace(/\s/g, "");

    if (!this.isValidFormat(cleaned)) {
      return Result.fail("Le SIRET doit contenir exactement 14 chiffres");
    }

    if (!this.isValidLuhn(cleaned)) {
      return Result.fail("Le SIRET n'est pas valide (vérification Luhn)");
    }

    return Result.ok(new Siret({ value: cleaned }));
  }
}
```

### Value Object Adresse Professionnelle

```typescript
// src/modules/creators/domain/value-objects/professional-address.vo.ts
interface AddressProps {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

export class ProfessionalAddress extends ValueObject<AddressProps> {
  private static isValidFrenchPostalCode(code: string): boolean {
    return /^\d{5}$/.test(code);
  }

  static create(props: AddressProps): Result<ProfessionalAddress> {
    if (!props.street.trim()) {
      return Result.fail("L'adresse est requise");
    }

    if (!this.isValidFrenchPostalCode(props.postalCode)) {
      return Result.fail("Le code postal doit contenir 5 chiffres");
    }

    if (!props.city.trim()) {
      return Result.fail("La ville est requise");
    }

    return Result.ok(new ProfessionalAddress(props));
  }
}
```

### Hook de Validation Temps Réel

```typescript
// src/hooks/use-siret-validation.ts
"use client";

import { useState, useCallback } from "react";
import { Siret } from "@/modules/creators/domain/value-objects/siret.vo";

export function useSiretValidation() {
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  const validate = useCallback((value: string) => {
    if (!value) {
      setError(null);
      setIsValid(false);
      return;
    }

    const result = Siret.create(value);
    if (result.isFailure) {
      setError(result.error!);
      setIsValid(false);
    } else {
      setError(null);
      setIsValid(true);
    }
  }, []);

  return { error, isValid, validate };
}
```

### Références

- [Source: architecture.md#Value Objects]
- [Source: prd.md#FR5]
- [Source: epics.md#Story 2.2]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
